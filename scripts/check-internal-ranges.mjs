// Fails when a published workspace package declares a dependency or peer
// dependency on another workspace package with a range that does not admit
// that package's current version. Without this, a wrapper such as
// @oneschema/angular can ship a stale `@oneschema/importer` peer range and
// strand consumers on an old core (see CONTRIBUTING.md, "Core compatibility").

import { readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import semver from "semver"

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
const dependencyFields = ["dependencies", "peerDependencies", "optionalDependencies"]

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"))

const rootPackageJson = await readJson(join(repoRoot, "package.json"))
const workspacePackages = new Map()

for (const workspace of rootPackageJson.workspaces) {
  const packageJson = await readJson(join(repoRoot, workspace, "package.json"))
  if (packageJson.private) {
    continue
  }
  workspacePackages.set(packageJson.name, { workspace, packageJson })
}

const failures = []

for (const [name, { workspace, packageJson }] of workspacePackages) {
  for (const field of dependencyFields) {
    for (const [dependency, range] of Object.entries(packageJson[field] ?? {})) {
      const target = workspacePackages.get(dependency)
      if (!target) {
        continue
      }

      const version = target.packageJson.version
      if (semver.satisfies(version, range)) {
        console.log(`ok  ${name} ${field}.${dependency} ${range} admits ${version}`)
        continue
      }

      failures.push(
        `${name} (${workspace}/package.json) declares ${field}.${dependency} ` +
          `"${range}", which does not admit the version this repository would ` +
          `release: ${dependency}@${version}. Update the range (and add a ` +
          `changeset) so consumers of ${name} can install ${dependency}@${version}.`,
      )
    }
  }
}

if (failures.length > 0) {
  console.error("\nInternal dependency range checks failed:")
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
} else {
  console.log("\nAll internal dependency ranges admit the versions in this repository.")
}
