// A release/* publish takes npm latest only if every unpublished package's
// version is greater than its npm latest, so 0.7.x patches are latest until
// main ships 1.0 and never after. Otherwise it uses release-0.7. Registry
// errors fail rather than defaulting to latest.
//
// Trade-off: when a 0.7.x publish goes to latest, the release-0.7 npm tag does
// not move because one publish sets one tag and npm trusted publishing/OIDC
// only supports npm publish, not npm dist-tag. It catches up on the first
// 0.7.x publish after 1.0. ^0.7 ranges are unaffected.
import { readFile } from "node:fs/promises"
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

function workspaceEntries(workspaces) {
  const entries = Array.isArray(workspaces) ? workspaces : workspaces?.packages
  if (!Array.isArray(entries)) {
    throw new Error("Root package.json workspaces must be an array")
  }
  for (const entry of entries) {
    if (
      typeof entry !== "string" ||
      ["*", "?", "{", "["].some((character) => entry.includes(character))
    ) {
      throw new Error(`Unsupported workspace pattern: ${entry}`)
    }
  }
  return entries
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
  const packageDirectories = workspaceEntries(rootManifest.workspaces).map((entry) =>
    join(repoRoot, entry),
  )

  const candidates = []
  for (const directory of packageDirectories) {
    const manifest = JSON.parse(await readFile(join(directory, "package.json"), "utf8"))

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
