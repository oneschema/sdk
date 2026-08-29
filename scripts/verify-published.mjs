// Compares the packages published to npm with the ones a fresh build of this
// revision produces, so a release can be traced back to the source it came
// from.
//
//   yarn build && node scripts/verify-published.mjs
//   node scripts/verify-published.mjs @oneschema/importer
//
// Only reads the public registry, so it needs no npm credentials.
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { mkdtemp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises"
import { join, relative, resolve } from "node:path"
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

const only = process.argv.slice(2)

const run = (command, args, cwd = repoRoot) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" })
  if (result.error) {
    throw result.error
  }
  return result
}

const sleep = (seconds) => new Promise((done) => setTimeout(done, seconds * 1000))

async function packTo(directory, spec, attempts = 1) {
  await mkdir(directory, { recursive: true })

  let result
  for (let attempt = 1; attempt <= attempts; attempt++) {
    result = run("npm", ["pack", "--silent", "--pack-destination", directory, spec])
    if (result.status === 0) {
      break
    }
    // A version published seconds ago may not have reached the registry yet.
    if (attempt < attempts) {
      await sleep(15)
    }
  }

  if (result.status !== 0) {
    return { error: (result.stderr || result.stdout).trim() }
  }

  const tarballs = (await readdir(directory)).filter((file) => file.endsWith(".tgz"))
  if (tarballs.length !== 1) {
    return { error: `npm pack produced ${tarballs.length} tarballs for ${spec}` }
  }

  const extracted = join(directory, "extracted")
  await mkdir(extracted, { recursive: true })
  const untar = run("tar", ["-xzf", join(directory, tarballs[0]), "-C", extracted])
  if (untar.status !== 0) {
    return { error: `could not extract the tarball for ${spec}` }
  }

  return { directory: join(extracted, "package") }
}

// The tarballs themselves differ in gzip metadata even for identical input, so
// the comparison is per file.
async function digests(directory) {
  const entries = new Map()
  const walk = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(path)
      } else if ((await stat(path)).isFile()) {
        entries.set(
          relative(directory, path),
          createHash("sha256")
            .update(await readFile(path))
            .digest("hex"),
        )
      }
    }
  }

  await walk(directory)
  return entries
}

function compare(published, built) {
  const differences = []
  for (const [file, digest] of published) {
    if (!built.has(file)) {
      differences.push(`only published: ${file}`)
    } else if (built.get(file) !== digest) {
      differences.push(`differs: ${file}`)
    }
  }

  for (const file of built.keys()) {
    if (!published.has(file)) {
      differences.push(`only built: ${file}`)
    }
  }

  return differences.sort()
}

const failures = []
const workspace = await mkdtemp(join(repoRoot, ".verify-published-"))

try {
  for (const packageDirectory of packageDirectories) {
    const directory = join(repoRoot, packageDirectory)
    const manifest = JSON.parse(await readFile(join(directory, "package.json"), "utf8"))
    const { name, version } = manifest
    if (only.length > 0 && !only.includes(name) && !only.includes(`${name}@${version}`)) {
      continue
    }

    console.log(`\n===== ${name}@${version} =====`)

    const published = await packTo(
      join(workspace, "published", name),
      `${name}@${version}`,
      4,
    )
    if (published.error) {
      failures.push(
        `${name}@${version}: not published or not downloadable (${published.error})`,
      )
      continue
    }

    const built = await packTo(join(workspace, "built", name), `./${packageDirectory}`)
    if (built.error) {
      failures.push(`${name}@${version}: ${built.error}`)
      continue
    }

    const differences = compare(
      await digests(published.directory),
      await digests(built.directory),
    )

    if (differences.length === 0) {
      console.log(
        `matches the build of this revision (${differences.length} differences)`,
      )
      continue
    }

    for (const difference of differences) {
      console.error(`  ${difference}`)
    }
    failures.push(
      `${name}@${version}: ${differences.length} differences from this revision`,
    )
  }
} finally {
  await rm(workspace, { recursive: true, force: true })
}

if (failures.length > 0) {
  console.error("\nPublished packages do not match this revision:")
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
} else {
  console.log("\nEvery published package matches the build of this revision.")
}
