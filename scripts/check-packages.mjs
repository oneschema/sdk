import { mkdtemp, readdir, rm } from "node:fs/promises"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
const packageDirectories = [
  "packages/importer",
  "packages/importer-react",
  "packages/importer-vue",
  "packages/filefeeds",
  "packages/filefeeds-react",
  "packages/importer-angular/dist/@oneschema/angular",
]
// Angular uses the standard ng-packagr 16 package shape. Bundler and
// Angular CLI resolution are green, but Node-direct consumption is not a
// supported use case; fixing that requires upgrading to Angular 17+ tooling.
const attwOptions = new Map([
  [
    "packages/importer-angular/dist/@oneschema/angular",
    ["--profile", "esm-only", "--ignore-rules", "cjs-resolves-to-esm", "false-cjs"],
  ],
])

const run = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  })

  if (result.error) {
    throw result.error
  }

  return result.status ?? 1
}

const failures = []
const tempDirectory = await mkdtemp(join(repoRoot, ".package-check-"))

try {
  for (const packageDirectory of packageDirectories) {
    const directory = join(repoRoot, packageDirectory)
    const packageJson = await import(`file://${join(directory, "package.json")}`, {
      with: { type: "json" },
    })
    const packageName = packageJson.default.name

    console.log(`\n===== ${packageName} =====`)
    const packStatus = run("npm", [
      "pack",
      "--silent",
      "--pack-destination",
      tempDirectory,
      `./${packageDirectory}`,
    ])
    if (packStatus !== 0) {
      failures.push(`${packageName}: npm pack failed`)
      continue
    }

    const tarballs = (await readdir(tempDirectory)).filter((file) =>
      file.endsWith(".tgz"),
    )
    if (tarballs.length !== 1) {
      failures.push(`${packageName}: npm pack did not produce exactly one tarball`)
      continue
    }

    const tarball = join(tempDirectory, tarballs[0])
    const publintStatus = run(resolve(repoRoot, "node_modules/.bin/publint"), [
      "run",
      tarball,
    ])
    if (publintStatus !== 0) {
      failures.push(`${packageName}: publint failed`)
    }

    const attwStatus = run(resolve(repoRoot, "node_modules/.bin/attw"), [
      tarball,
      "--no-color",
      ...(attwOptions.get(packageDirectory) ?? []),
    ])
    if (attwStatus !== 0) {
      failures.push(`${packageName}: attw failed`)
    }

    await rm(tarball)
  }
} finally {
  await rm(tempDirectory, { recursive: true, force: true })
}

if (failures.length > 0) {
  console.error("\nPackaging checks failed:")
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
} else {
  console.log("\nAll publint and ATTW packaging checks passed.")
}
