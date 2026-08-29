# Contributing

This is a Yarn workspaces monorepo. Use the Node version in `.nvmrc` and
enable Corepack before installing dependencies from the repository root:

```sh
corepack enable
yarn install
```

## Script vocabulary

The workspaces and the root share a common script vocabulary. The root
`build`, `fix`, `check`, and `test:ci` scripts fan out to every workspace via
`yarn workspaces foreach`; you can also run any script inside a single package.
Invoke root scripts with `yarn <script>`. (A few workspaces stub out scripts
that don't apply to them.)

| Script           | What it does                                                          |
| ---------------- | --------------------------------------------------------------------- |
| `build`          | Build the package's distributable output                              |
| `fix`            | Auto-fix formatting (Prettier) and lint (ESLint) issues               |
| `check`          | Verify formatting, lint, HTML test pages, and types, without writing  |
| `check:packages` | (root only) Validate packed tarballs with publint and report attw     |
| `check:ranges`   | (root only) Verify wrapper ranges admit the core versions in the repo |
| `check:install`  | (root only) Install packed tarballs into a scratch project and verify |
| `test`           | Serve the package's interactive manual test page (see `TESTING.md`)   |
| `test:ci`        | Run the package's automated tests headlessly (no-op where none exist) |
| `clean`          | Remove build output and caches                                        |

Before pushing, run from the root:

```sh
yarn fix
yarn check
```

CI runs `yarn build`, `yarn check:packages`, `yarn check:ranges`,
`yarn check:install`, `yarn check`, and `yarn test:ci` on every pull request,
plus actionlint and a bundle-size report comment. The release workflow runs
`check:ranges` and `check:install` in a credential-free step before the publish
step, and `yarn release` re-runs `check:ranges` before `changeset publish`.

## Core compatibility

Every published package here that references another one — `@oneschema/react`,
`@oneschema/vue` and `@oneschema/angular` on `@oneschema/importer`, and
`@oneschema/filefeeds-react` on `@oneschema/filefeeds` — must always admit the
version of that package this repository would release. `@oneschema/filefeeds`
and `@oneschema/importer` are standalone cores with no internal references, so
they have nothing to widen themselves. React and Vue depend on
`@oneschema/importer` directly;
`@oneschema/angular` declares it as a peer dependency so the host application
resolves a single copy of the core. Either way the declared range must include
the current core version — `@oneschema/angular@0.7.5` shipped with a
`^0.6.0` peer range, which left a fresh `npm install @oneschema/angular` pinned
to core `0.6.1` and made `npm install` fail outright for anyone already on a
`0.7.x` core.

Two checks enforce this, on pull requests and again before publishing:

- `yarn check:ranges` fails when a package's dependency or peer-dependency
  range on another package in this repository excludes that package's current
  version.
- `yarn check:install` packs every published package with `npm pack`, installs
  the tarballs into a throwaway project outside the workspace with
  `--strict-peer-deps` (never `--force` or `--legacy-peer-deps`), asserts the
  resolved `@oneschema/importer` version, checks that a consumer installing
  only the `@oneschema/angular` tarball gets the current published core, and
  links the Angular bundle with the Angular linker to confirm the entry point
  is consumable. Because it installs and executes packed bundles, it never runs
  in a credentialed step: the release workflow runs it before publish
  credentials are configured, its installs use `--ignore-scripts` and empty npm
  config files, and linking and importing the bundle happens in a separate
  `scripts/check-angular-entry-point.mjs` process with release tokens stripped
  from its environment.

When bumping the core's minor version, widen the wrappers' ranges in the same
pull request and add a changeset for each wrapper.

## Pull requests

- Use Conventional Commits for commit messages and PR titles.
- Add a changeset (`yarn changeset`) when changing a published package;
  see the Releasing section of `README.md`.
- Manual testing of the importer/filefeeds embeds is documented in
  `TESTING.md`.
