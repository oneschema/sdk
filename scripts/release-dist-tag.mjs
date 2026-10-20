// A release/* publish takes npm latest only if every unpublished package's
// version is greater than its npm latest, so 0.7.x patches are latest until
// main ships 1.0 and never after. Otherwise it uses release-0.7. Registry
// errors fail rather than defaulting to latest.
//
// Trade-off: when a 0.7.x publish goes to latest, the release-0.7 npm tag does
// not move because one publish sets one tag and npm trusted publishing/OIDC
// only supports npm publish, not npm dist-tag. It catches up on the first
// 0.7.x publish after 1.0. ^0.7 ranges are unaffected.
import { readFile, readdir, stat } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
const versionPattern = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/

function parseVersion(version) {
  const match = typeof version === "string" && versionPattern.exec(version)
  if (!match) {
    throw new Error(`Unparseable version: ${version}`)
  }

  return {
    major: BigInt(match[1]),
    minor: BigInt(match[2]),
    patch: BigInt(match[3]),
    prerelease: match[4],
  }
}

export function isGreaterRelease(version, latest) {
  const local = parseVersion(version)
  if (latest === undefined) {
    return false
  }

  const published = parseVersion(latest)
  if (local.prerelease) {
    return false
  }

  for (const component of ["major", "minor", "patch"]) {
    if (local[component] > published[component]) {
      return true
    }
    if (local[component] < published[component]) {
      return false
    }
  }

  return Boolean(published.prerelease)
}

export function decideDistTag(candidates) {
  return candidates.length > 0 &&
    candidates.every(({ version, latest }) => isGreaterRelease(version, latest))
    ? "latest"
    : "release-0.7"
}

function workspacePatterns(workspaces) {
  const patterns = Array.isArray(workspaces) ? workspaces : workspaces?.packages
  if (!Array.isArray(patterns)) {
    throw new Error("Root package.json workspaces must be an array")
  }
  return patterns
}

function globSegmentPattern(segment) {
  return new RegExp(
    `^${segment.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replaceAll("*", ".*")}$`,
  )
}

async function matchingDirectories(root, pattern) {
  const segments = pattern.split("/").filter(Boolean)
  let directories = [root]

  for (const segment of segments) {
    if (segment === "**") {
      const descendants = []
      const visit = async (directory) => {
        descendants.push(directory)
        for (const entry of await readdir(directory, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            await visit(join(directory, entry.name))
          }
        }
      }
      for (const directory of directories) {
        await visit(directory)
      }
      directories = descendants
      continue
    }

    if (segment.includes("*") || segment.includes("?")) {
      const expression = globSegmentPattern(segment)
      const matches = []
      for (const directory of directories) {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
          if (entry.isDirectory() && expression.test(entry.name)) {
            matches.push(join(directory, entry.name))
          }
        }
      }
      directories = matches
      continue
    }

    const paths = directories.map((directory) => join(directory, segment))
    directories = []
    for (const path of paths) {
      try {
        if ((await stat(path)).isDirectory()) {
          directories.push(path)
        }
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error
        }
      }
    }
  }

  return directories
}

async function defaultFetchPackument(name) {
  return await fetch(`https://registry.npmjs.org/${name.replace("/", "%2F")}`, {
    headers: { accept: "application/vnd.npm.install-v1+json" },
  })
}

export async function collectCandidates({
  repoRoot,
  fetchPackument = defaultFetchPackument,
}) {
  const rootManifest = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"))
  const { ignore = [] } = JSON.parse(
    await readFile(join(repoRoot, ".changeset/config.json"), "utf8"),
  )
  const packageDirectories = new Set()

  for (const pattern of workspacePatterns(rootManifest.workspaces)) {
    for (const directory of await matchingDirectories(repoRoot, pattern)) {
      packageDirectories.add(directory)
    }
  }

  const candidates = []
  for (const directory of packageDirectories) {
    let manifest
    try {
      manifest = JSON.parse(await readFile(join(directory, "package.json"), "utf8"))
    } catch (error) {
      if (error.code === "ENOENT") {
        continue
      }
      throw error
    }

    if (manifest.private || ignore.includes(manifest.name)) {
      continue
    }
    if (typeof manifest.name !== "string" || typeof manifest.version !== "string") {
      throw new Error(`Invalid package manifest: ${join(directory, "package.json")}`)
    }

    const response = await fetchPackument(manifest.name)
    if (response.status === 404) {
      candidates.push({
        name: manifest.name,
        version: manifest.version,
        latest: undefined,
      })
      continue
    }
    if (!response.ok) {
      throw new Error(
        `Could not fetch npm packument for ${manifest.name}: HTTP ${response.status}`,
      )
    }

    const packument = await response.json()
    if (
      !packument ||
      typeof packument.versions !== "object" ||
      packument.versions === null ||
      Array.isArray(packument.versions)
    ) {
      throw new Error(`Malformed npm packument for ${manifest.name}`)
    }
    const latest = packument["dist-tags"]?.latest
    if (latest !== undefined && typeof latest !== "string") {
      throw new Error(`Malformed npm latest dist-tag for ${manifest.name}`)
    }
    if (!Object.hasOwn(packument.versions, manifest.version)) {
      candidates.push({ name: manifest.name, version: manifest.version, latest })
    }
  }

  return candidates
}

async function runCli() {
  try {
    const args = process.argv.slice(2)
    if (args[0] === "--check") {
      if (args.length === 2 && ["latest", "release-0.7"].includes(args[1])) {
        return
      }
      throw new Error("--check requires either latest or release-0.7")
    }
    if (args.length > 0) {
      throw new Error("Usage: node scripts/release-dist-tag.mjs [--check <tag>]")
    }

    const candidates = await collectCandidates({ repoRoot })
    if (candidates.length === 0) {
      console.error("no unpublished packages")
    } else {
      for (const { name, version, latest } of candidates) {
        console.error(`${name}@${version} (npm latest: ${latest ?? "none"})`)
      }
    }
    process.stdout.write(`${decideDistTag(candidates)}\n`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli()
}
