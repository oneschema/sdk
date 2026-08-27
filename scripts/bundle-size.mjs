import { gzipSync } from "node:zlib"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"

const baseRoot = process.argv[2]

if (!baseRoot) {
  console.error("Usage: node scripts/bundle-size.mjs <base-directory>")
  process.exit(1)
}

const root = process.cwd()
const base = resolve(root, baseRoot)

function packageBundles(projectRoot) {
  const bundles = new Map()
  const workspaces = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8")).workspaces

  for (const workspace of workspaces) {
    const packageRoot = join(projectRoot, workspace)
    const packageJsonPath = join(packageRoot, "package.json")
    if (!existsSync(packageJsonPath)) {
      continue
    }

    const distRoot = join(packageRoot, "dist")
    if (!existsSync(distRoot)) {
      continue
    }

    function visit(directory, packageName, packageDistRoot) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) {
          visit(path, packageName, packageDistRoot)
          continue
        }
        if (!entry.isFile() || !/\.(?:js|mjs)$/.test(entry.name) || entry.name.endsWith(".map")) {
          continue
        }

        const data = readFileSync(path)
        const key = `${packageName}/${relative(packageDistRoot, path)}`
        bundles.set(key, {
          gzip: gzipSync(data).length,
          raw: statSync(path).size,
        })
      }
    }

    // A dist directory can hold built packages under their own names (for
    // example the Angular workspace builds dist/@oneschema/angular); report
    // those under the built package's name rather than the workspace's.
    const builtPackages = []
    for (const entry of readdirSync(distRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue
      }
      for (const child of readdirSync(join(distRoot, entry.name), { withFileTypes: true })) {
        const builtRoot = join(distRoot, entry.name, child.name)
        if (child.isDirectory() && existsSync(join(builtRoot, "package.json"))) {
          builtPackages.push(builtRoot)
        }
      }
    }

    if (builtPackages.length > 0) {
      for (const builtRoot of builtPackages) {
        const builtName = JSON.parse(readFileSync(join(builtRoot, "package.json"), "utf8")).name
        visit(builtRoot, builtName, builtRoot)
      }
    } else {
      const packageName = JSON.parse(readFileSync(packageJsonPath, "utf8")).name
      visit(distRoot, packageName, distRoot)
    }
  }

  return bundles
}

function formatBytes(value) {
  return `${value.toLocaleString("en-US")} B`
}

function formatDelta(current, previous) {
  if (!previous) {
    return "new"
  }

  const delta = current - previous
  const percentage = previous === 0 ? "n/a" : `${((delta / previous) * 100).toFixed(2)}%`
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta.toLocaleString("en-US")} B (${percentage})`
}

const currentBundles = packageBundles(root)
const baseBundles = packageBundles(base)
const keys = new Set([...currentBundles.keys(), ...baseBundles.keys()])

console.log("<!-- oneschema-sdk-bundle-size -->")
console.log("## Bundle size report")
console.log("")
console.log("| Package/file | Gzip size | Raw size | Delta vs base (gzip) |")
console.log("| --- | ---: | ---: | ---: |")

for (const key of [...keys].sort()) {
  const current = currentBundles.get(key)
  const previous = baseBundles.get(key)

  if (!current) {
    console.log(`| ${key} | — | — | removed |`)
    continue
  }

  console.log(
    `| ${key} | ${formatBytes(current.gzip)} | ${formatBytes(current.raw)} | ${formatDelta(current.gzip, previous?.gzip)} |`,
  )
}
