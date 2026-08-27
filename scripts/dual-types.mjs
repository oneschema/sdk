import { copyFile, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const [input] = process.argv.slice(2)

if (!input) {
  console.error("Usage: node scripts/dual-types.mjs <declaration-file>")
  process.exit(1)
}

const declarationPath = resolve(process.cwd(), input)
const declaration = await readFile(declarationPath, "utf8")
const esmPath = declarationPath.replace(/\.d\.ts$/, ".d.mts")
const cjsPath = declarationPath.replace(/\.d\.ts$/, ".d.cts")

await copyFile(declarationPath, esmPath)

const exportMatch = declaration.match(/\nexport \{([\s\S]*?)\};?\s*$/)

if (!exportMatch || !/\bas default\b/.test(exportMatch[1])) {
  await copyFile(declarationPath, cjsPath)
  process.exit(0)
}

const entries = exportMatch[1]
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const alias = entry.match(/^(\S+)\s+as\s+(\S+)$/)
    return alias
      ? { local: alias[1], exported: alias[2] }
      : { local: entry, exported: entry }
  })

const runtimeDeclarations = new Set(
  [
    ...declaration.matchAll(/^(?:declare\s+)?(?:class|const|enum|function)\s+(\w+)/gm),
  ].map((match) => match[1]),
)
const defaultEntry = entries.find((entry) => entry.exported === "default")
const namedRuntimeEntries = entries.filter(
  (entry) => entry.exported !== "default" && runtimeDeclarations.has(entry.local),
)
const namedTypeEntries = entries.filter(
  (entry) => entry.exported !== "default" && !runtimeDeclarations.has(entry.local),
)

const typeAliases = namedTypeEntries.map(
  (entry) => `type __cjs_${entry.exported} = ${entry.local};`,
)
const typeNamespace = namedTypeEntries.length
  ? [
      "declare namespace _default {",
      ...namedTypeEntries.map(
        (entry) => `  export type ${entry.exported} = __cjs_${entry.exported};`,
      ),
      "}",
    ]
  : []

const cjsExport = [
  "declare const _default: {",
  `  default: typeof ${defaultEntry.local};`,
  ...namedRuntimeEntries.map((entry) => `  ${entry.exported}: typeof ${entry.local};`),
  "};",
  ...typeAliases,
  ...typeNamespace,
  "export = _default;",
  "",
].join("\n")

await writeFile(cjsPath, `${declaration.slice(0, exportMatch.index)}${cjsExport}`)
