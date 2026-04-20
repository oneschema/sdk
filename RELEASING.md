# Releasing

This repository is released by the [`Release`](./.github/workflows/release.yml)
GitHub Actions workflow, triggered by pushing an annotated git tag from `main`.

There are **two independent release trains**, each covering a group of packages
that share a single version number:

| Family      | Packages                                                                                      | Changelog                                                          | Tag prefix      |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------- |
| `importer`  | `@oneschema/importer`, `@oneschema/react`, `@oneschema/vue`, `@oneschema/angular`             | [`CHANGELOG.md`](./CHANGELOG.md)                                   | `importer-v…`   |
| `filefeeds` | `@oneschema/filefeeds`, `@oneschema/filefeeds-react`                                          | [`CHANGELOG-filefeeds.md`](./CHANGELOG-filefeeds.md)               | `filefeeds-v…`  |

Versions within a family must always be in sync.

## Release steps

1. Open a PR that updates every package.json in the target family to the new
   version and adds a new section to the corresponding changelog. For example,
   to release `importer` `0.7.5`, bump:
   - `packages/importer/package.json`
   - `packages/importer-react/package.json`
   - `packages/importer-vue/package.json`
   - `packages/importer-angular/projects/oneschema/package.json`

2. Merge the PR after CI is green.

3. Tag the merge commit and push the tag:

   ```sh
   git checkout main
   git pull --ff-only
   git tag importer-v0.7.5      # or filefeeds-v0.5.3
   git push origin importer-v0.7.5
   ```

4. The `Release` workflow will:
   - verify every package.json in the family matches the tag version (fails
     fast on mismatch),
   - install, build each package (including `ng build` for Angular),
   - `npm publish --access public --provenance` each package in dependency
     order,
   - create a GitHub Release pointing at the tag.

If any step fails the workflow stops; partial releases are possible if npm
rejects only some packages, so re-running (or a manual `npm publish` of the
straggler at the same version) is how we recover.

## Manual / ad-hoc dispatch

The workflow also supports `workflow_dispatch` for dry-runs or recovering from
a missed tag:

- **Actions → Release → Run workflow**
- Pick `family`, type the `version`, optionally check **dry_run** to just run
  `npm publish --dry-run`.

The version still has to match every package.json in the family.

## npm authentication

The workflow publishes with
[`--provenance`](https://docs.npmjs.com/generating-provenance-statements), which
requires `id-token: write` (already configured).

Two auth paths are supported:

1. **OIDC trusted publishing (preferred).** No secret needed. For each
   published package, an npm maintainer must configure
   **Settings → Trusted Publishers** on npmjs.com with:
   - Organization / repo: `oneschema/sdk`
   - Workflow filename: `release.yml`
   - Environment: _(leave blank)_
2. **Classic automation token (fallback).** Add an `NPM_TOKEN` repo secret
   with an npm automation token that has publish rights to all six packages.
   When present, the workflow uses it automatically and falls back from the
   OIDC path.

## What the workflow does not do

- It does **not** bump versions or edit changelogs. Those stay as
  human-reviewed PRs so release notes remain curated.
- It does **not** run tests. The `CI` workflow runs lint + build on every PR
  and every push to `main`; that's what gates a releasable commit.
