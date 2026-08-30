// Links an installed `@oneschema/angular` bundle with the Angular linker and
// imports it to confirm the public API is consumable. Importing the bundle
// executes its module-level code, so `scripts/smoke-install.mjs` runs this in a
// separate process that never inherits the release credentials.
//
// Usage: node scripts/check-angular-entry-point.mjs <packageDirectory> <repoRoot>
// Prints `fail: <reason>` and exits non-zero when the bundle is not consumable.

import { createRequire } from "node:module"
import { readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"

const [packageDirectory, repoRoot] = process.argv.slice(2)

const fail = (reason) => {
  console.log(`fail: ${reason}`)
  process.exit(1)
}

const packageJson = JSON.parse(
  await readFile(join(packageDirectory, "package.json"), "utf8"),
)
const entryPoint = packageJson.exports?.["."]?.default
if (!entryPoint) {
  fail("@oneschema/angular does not declare a default export condition")
}

const angularRequire = createRequire(
  join(repoRoot, "packages/importer-angular/package.json"),
)
const { transformAsync } = angularRequire("@babel/core")
const linker = angularRequire("@angular/compiler-cli/linker/babel")
const source = await readFile(join(packageDirectory, entryPoint), "utf8")
const linked = await transformAsync(source, {
  filename: "oneschema-angular.mjs",
  plugins: [linker.default ?? linker],
  configFile: false,
  babelrc: false,
  sourceMaps: false,
})

if (/ɵɵngDeclare/.test(linked.code)) {
  fail("the Angular linker left partial declarations in the published bundle")
}

const linkedPath = join(packageDirectory, "linked-smoke-check.mjs")
try {
  await writeFile(linkedPath, linked.code)
  const module = await import(`file://${linkedPath}`)
  const missing = ["OneSchemaModule", "OneSchemaService", "OneSchemaButton"].filter(
    (name) => !(name in module),
  )
  if (missing.length > 0) {
    fail(`@oneschema/angular is missing exports: ${missing.join(", ")}`)
  }
} finally {
  await rm(linkedPath, { force: true })
}
