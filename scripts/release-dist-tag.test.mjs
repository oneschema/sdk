import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import {
  collectCandidates,
  decideDistTag,
  isGreaterRelease,
} from "./release-dist-tag.mjs"

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
const cliPath = join(repoRoot, "scripts/release-dist-tag.mjs")

test("selects latest for a greater release", () => {
  assert.equal(
    decideDistTag([{ name: "pkg", version: "0.7.9", latest: "0.7.8" }]),
    "latest",
  )
})

test("does not promote an equal release", () => {
  assert.equal(
    decideDistTag([{ name: "pkg", version: "0.7.8", latest: "0.7.8" }]),
    "release-0.7",
  )
})

test("does not promote a lower release", () => {
  assert.equal(
    decideDistTag([{ name: "pkg", version: "0.7.9", latest: "1.0.0" }]),
    "release-0.7",
  )
})

test("does not promote a local prerelease", () => {
  assert.equal(
    decideDistTag([{ name: "pkg", version: "0.7.9-beta.0", latest: "0.7.8" }]),
    "release-0.7",
  )
})

test("promotes a release over a prerelease with the same core version", () => {
  assert.equal(isGreaterRelease("0.7.9", "0.7.9-rc.1"), true)
  assert.equal(
    decideDistTag([{ name: "pkg", version: "0.7.9", latest: "0.7.9-rc.1" }]),
    "latest",
  )
})

test("does not promote when one of several candidates is not greater", () => {
  assert.equal(
    decideDistTag([
      { name: "pkg-a", version: "1.0.1", latest: "1.0.0" },
      { name: "pkg-b", version: "0.7.9", latest: "1.0.0" },
    ]),
    "release-0.7",
  )
})

test("does not promote an empty candidate list", () => {
  assert.equal(decideDistTag([]), "release-0.7")
})

test("does not promote when npm has no latest dist-tag", () => {
  assert.equal(isGreaterRelease("0.7.9", undefined), false)
  assert.equal(
    decideDistTag([{ name: "pkg", version: "0.7.9", latest: undefined }]),
    "release-0.7",
  )
})

test("throws for unparsable versions", () => {
  assert.throws(() => isGreaterRelease("not-a-version", "1.0.0"), /Unparseable/)
  assert.throws(() => isGreaterRelease("1.0.0", "not-a-version"), /Unparseable/)
})

async function createFixture(t) {
  const root = await mkdtemp(join(os.tmpdir(), "release-dist-tag-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const packages = [
    { name: "@fixture/published", version: "1.0.0" },
    { name: "@fixture/private", version: "1.0.0", private: true },
    { name: "@fixture/ignored", version: "1.0.0" },
    { name: "@fixture/unknown", version: "0.1.0" },
    { name: "@fixture/unpublished", version: "1.2.0" },
  ]
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      workspaces: packages.map((manifest) => `packages/${manifest.name.split("/")[1]}`),
    }),
  )
  await mkdir(join(root, ".changeset"), { recursive: true })
  await writeFile(
    join(root, ".changeset/config.json"),
    JSON.stringify({ ignore: ["@fixture/ignored"] }),
  )
  for (const manifest of packages) {
    const directory = join(root, "packages", manifest.name.split("/")[1])
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, "package.json"), JSON.stringify(manifest))
  }
  return root
}

test("rejects unsupported workspace patterns", async (t) => {
  const root = await createFixture(t)
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ workspaces: ["packages/*"] }),
  )

  await assert.rejects(
    collectCandidates({ repoRoot: root }),
    /Unsupported workspace pattern: packages\/\*/,
  )
})

test("throws when a listed workspace has no package.json", async (t) => {
  const root = await createFixture(t)
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ workspaces: ["packages/missing"] }),
  )

  await assert.rejects(collectCandidates({ repoRoot: root }), /ENOENT/)
})

function response(status, value) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => value,
  }
}

test("collects unpublished packages and skips private, ignored, and published packages", async (t) => {
  const root = await createFixture(t)
  const fetched = []
  const candidates = await collectCandidates({
    repoRoot: root,
    fetchPackument: async (name) => {
      fetched.push(name)
      if (name === "@fixture/unknown") {
        return response(404)
      }
      return response(200, {
        versions: { "1.0.0": {} },
        "dist-tags": { latest: "1.0.0" },
      })
    },
  })

  assert.deepEqual(
    new Set(fetched),
    new Set(["@fixture/published", "@fixture/unknown", "@fixture/unpublished"]),
  )
  assert.deepEqual(
    candidates.map(({ name, version, latest }) => ({ name, version, latest })),
    [
      { name: "@fixture/unknown", version: "0.1.0", latest: undefined },
      { name: "@fixture/unpublished", version: "1.2.0", latest: "1.0.0" },
    ],
  )
})

test("collectCandidates rejects non-404 registry errors, network errors, and malformed JSON", async (t) => {
  const root = await createFixture(t)

  await assert.rejects(
    collectCandidates({
      repoRoot: root,
      fetchPackument: async () => response(500),
    }),
    /HTTP 500/,
  )
  await assert.rejects(
    collectCandidates({
      repoRoot: root,
      fetchPackument: async () => {
        throw new Error("network failed")
      },
    }),
    /network failed/,
  )
  await assert.rejects(
    collectCandidates({
      repoRoot: root,
      fetchPackument: async () => ({
        ...response(200),
        json: async () => {
          throw new SyntaxError("invalid JSON")
        },
      }),
    }),
    /invalid JSON/,
  )
})

test("CLI accepts only the supported dist-tags in check mode", () => {
  const latest = spawnSync("node", [cliPath, "--check", "latest"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
  const empty = spawnSync("node", [cliPath, "--check", ""], {
    cwd: repoRoot,
    encoding: "utf8",
  })
  const beta = spawnSync("node", [cliPath, "--check", "beta"], {
    cwd: repoRoot,
    encoding: "utf8",
  })

  assert.equal(latest.status, 0)
  assert.equal(latest.stdout, "")
  assert.equal(empty.status, 1)
  assert.match(empty.stderr, /requires either latest or release-0\.7/)
  assert.equal(beta.status, 1)
  assert.match(beta.stderr, /requires either latest or release-0\.7/)
})
