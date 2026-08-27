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

    // ATTW currently reports known pre-existing CJS/ESM type issues. Keep it
    // report-only until package exports and declaration shapes are redesigned.
    const attwStatus = run(resolve(repoRoot, "node_modules/.bin/attw"), [
      "--no-color",
      tarball,
    ])
    if (attwStatus !== 0) {
      console.warn(`${packageName}: attw reported findings (report-only)`)
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
  console.log("\nAll publint packaging checks passed.")
}
