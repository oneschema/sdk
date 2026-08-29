// Packs every published package with `npm pack` and installs the tarballs into
// a throwaway project outside the workspace, so npm (not Yarn workspace
// linking) resolves the dependency graph exactly as a customer would. Asserts
// that:
//
//   1. npm can resolve the graph with strict peer dependencies (no --force and
//      no --legacy-peer-deps), which fails loudly when a wrapper's
//      `@oneschema/importer` range excludes the core being released;
//   2. the resolved `@oneschema/importer` is the version this repository would
//      publish, for every wrapper;
//   3. a consumer installing only the published `@oneschema/angular` tarball
//      gets the current core from the registry;
//   4. the Angular entry point is consumable: its partial-Ivy bundle links
//      with the Angular linker and exports the public API.
//
// Run with `yarn check:install`.

import { spawnSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import semver from "semver"

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
const angularPackageDirectory = "packages/importer-angular/dist/@oneschema/angular"
const packageDirectories = [
  "packages/importer",
  "packages/importer-react",
  "packages/importer-vue",
  "packages/filefeeds",
  "packages/filefeeds-react",
  angularPackageDirectory,
]

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"))

const createProject = async (directory, name) => {
  await mkdir(directory, { recursive: true })
  await writeFile(
    join(directory, "package.json"),
    `${JSON.stringify({ name, version: "0.0.0", private: true }, null, 2)}\n`,
  )
  return directory
}

const installFlags = ["--no-audit", "--no-fund", "--ignore-scripts", "--strict-peer-deps"]

const failures = []
const workDirectory = await mkdtemp(join(tmpdir(), "oneschema-smoke-"))
const tarballDirectory = join(workDirectory, "tarballs")
await mkdir(tarballDirectory, { recursive: true })

// This script may run in a context that holds publish credentials, so no child
// process may see them. Rather than denying known-bad variables, the child
// environment is built from an allowlist of the variables npm and node need to
// run at all: nothing else is inherited, so tokens and any `npm_config_*`
// setting (npm reads those case-insensitively) cannot reach a child or override
// the empty user and global config files below. Installs also never run
// lifecycle scripts of installed packages.
const inheritedEnvironmentKeys = [
  "PATH",
  "Path",
  "HOME",
  "USERPROFILE",
  "TMPDIR",
  "TMP",
  "TEMP",
  "LANG",
  "LC_ALL",
  "SHELL",
  "SystemRoot",
  "COMSPEC",
  "PATHEXT",
  "APPDATA",
  "LOCALAPPDATA",
]
const emptyUserNpmrc = join(workDirectory, "user.npmrc")
const emptyGlobalNpmrc = join(workDirectory, "global.npmrc")
await writeFile(emptyUserNpmrc, "")
await writeFile(emptyGlobalNpmrc, "")
const childEnvironment = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(
      ([key, value]) => value !== undefined && inheritedEnvironmentKeys.includes(key),
    ),
  ),
  NPM_CONFIG_USERCONFIG: emptyUserNpmrc,
  NPM_CONFIG_GLOBALCONFIG: emptyGlobalNpmrc,
}

const run = (command, args, options = {}) => {
  console.log(`$ ${command} ${args.join(" ")}`)
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    stdio: options.capture ? "pipe" : "inherit",
    encoding: "utf8",
    env: childEnvironment,
  })
  if (result.error) {
    throw result.error
  }
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  }
}

try {
  const corePackageJson = await readJson(join(repoRoot, "packages/importer/package.json"))
  const coreVersion = corePackageJson.version
  const tarballs = new Map()

  for (const packageDirectory of packageDirectories) {
    const packageJson = await readJson(join(repoRoot, packageDirectory, "package.json"))
    const pack = run(
      "npm",
      ["pack", "--json", "--pack-destination", tarballDirectory, `./${packageDirectory}`],
      { capture: true },
    )
    if (pack.status !== 0) {
      throw new Error(`npm pack failed for ${packageJson.name}: ${pack.stderr}`)
    }
    const [{ filename }] = JSON.parse(pack.stdout)
    tarballs.set(packageJson.name, join(tarballDirectory, filename))
  }

  // 1 + 2: the packed graph must resolve with strict peer dependencies.
  const packedProject = await createProject(
    join(workDirectory, "packed-graph"),
    "oneschema-smoke-packed",
  )
  const install = run("npm", ["install", ...installFlags, ...tarballs.values()], {
    cwd: packedProject,
  })
  if (install.status !== 0) {
    failures.push(
      "npm could not install the packed tarballs together with strict peer " +
        "dependencies; a wrapper's dependency range likely excludes " +
        `@oneschema/importer@${coreVersion}`,
    )
  } else {
    const resolved = await readJson(
      join(packedProject, "node_modules/@oneschema/importer/package.json"),
    )
    if (resolved.version !== coreVersion) {
      failures.push(
        `packed install resolved @oneschema/importer@${resolved.version}, expected ${coreVersion}`,
      )
    } else {
      console.log(`ok  packed install resolved @oneschema/importer@${resolved.version}`)
    }
  }

  // 3: a consumer installing only the Angular wrapper must get the current
  // core from the registry. Skipped while the core in this repository is not
  // published yet (during a release the wrapper is published moments later).
  // Run outside the repository so no project `.npmrc` applies either.
  const registryVersions = run("npm", ["view", "@oneschema/importer", "version"], {
    capture: true,
    cwd: workDirectory,
  })
  const publishedCoreVersion = registryVersions.stdout.trim()
  if (registryVersions.status !== 0) {
    failures.push(
      "npm could not read @oneschema/importer from the registry: " +
        registryVersions.stderr.trim(),
    )
  } else if (publishedCoreVersion !== coreVersion) {
    console.log(
      `skip registry install check: @oneschema/importer@${coreVersion} is not ` +
        `published yet (registry latest is ${publishedCoreVersion})`,
    )
  } else {
    const registryProject = await createProject(
      join(workDirectory, "registry-peers"),
      "oneschema-smoke-registry",
    )
    const registryInstall = run(
      "npm",
      ["install", ...installFlags, tarballs.get("@oneschema/angular")],
      { cwd: registryProject },
    )
    if (registryInstall.status !== 0) {
      failures.push("npm could not install the @oneschema/angular tarball on its own")
    } else {
      const resolved = await readJson(
        join(registryProject, "node_modules/@oneschema/importer/package.json"),
      )
      if (!semver.eq(resolved.version, publishedCoreVersion)) {
        failures.push(
          `a fresh install of @oneschema/angular resolved ` +
            `@oneschema/importer@${resolved.version}, but the current core is ` +
            `${publishedCoreVersion}; the wrapper's peer range strands consumers ` +
            "on an old core",
        )
      } else {
        console.log(
          `ok  fresh @oneschema/angular install resolved @oneschema/importer@${resolved.version}`,
        )
      }
    }
  }

  // 4: the installed Angular entry point links and exposes the public API.
  if (install.status === 0) {
    const angularFailure = checkAngularEntryPoint(
      join(packedProject, "node_modules/@oneschema/angular"),
    )
    if (angularFailure) {
      failures.push(angularFailure)
    } else {
      console.log(
        "ok  @oneschema/angular links with the Angular linker and exports its public API",
      )
    }
  } else {
    console.log("skip Angular entry point check: the packed install did not resolve")
  }
} finally {
  await rm(workDirectory, { recursive: true, force: true })
}

if (failures.length > 0) {
  console.error("\nTarball install smoke checks failed:")
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
} else {
  console.log("\nAll tarball install smoke checks passed.")
}

// Linking and importing the packed bundle executes its module-level code, so
// it runs in a separate process with the credential-free environment rather
// than in this one. The child prints `fail: <reason>` and exits non-zero when
// the bundle is not consumable.
function checkAngularEntryPoint(packageDirectory) {
  const checker = run(
    "node",
    [join(repoRoot, "scripts/check-angular-entry-point.mjs"), packageDirectory, repoRoot],
    { capture: true, cwd: workDirectory },
  )
  if (checker.status === 0) {
    return undefined
  }
  const output = `${checker.stdout}${checker.stderr}`.trim()
  return output.startsWith("fail:")
    ? output.slice("fail:".length).trim()
    : `the Angular entry point check failed: ${output}`
}
