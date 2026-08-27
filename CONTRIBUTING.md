# Contributing

This is a Yarn workspaces monorepo. Use the Node version in `.nvmrc` and
install dependencies once from the repository root:

```sh
yarn install
```

## Script vocabulary

Every workspace (and the root) uses the same script names, so you can run any
of them from the root with `yarn <script>` (which runs it across all
workspaces) or inside a single package:

| Script           | What it does                                                          |
| ---------------- | --------------------------------------------------------------------- |
| `build`          | Build the package's distributable output                              |
| `fix`            | Auto-fix formatting (Prettier) and lint (ESLint) issues               |
| `check`          | Verify formatting, lint, and types (`tsc --noEmit`) without writing   |
| `check:packages` | (root only) Validate packed tarballs with publint and report attw     |
| `test`           | Serve the package's interactive manual test page (see `TESTING.md`)   |
| `test:ci`        | Run the package's automated tests headlessly (no-op where none exist) |
| `clean`          | Remove build output and caches                                        |

Before pushing, run from the root:

```sh
yarn fix
yarn run check
```

(Use `yarn run check` — bare `yarn check` invokes Yarn 1's built-in command.)

CI runs `yarn build`, `yarn run check:packages`, `yarn run check`, and
`yarn run test:ci` on every pull request, plus actionlint and a bundle-size
report comment.

## Pull requests

- Use Conventional Commits for commit messages and PR titles.
- Add a changeset (`yarn changeset`) when changing a published package;
  see the Releasing section of `README.md`.
- Manual testing of the importer/filefeeds embeds is documented in
  `TESTING.md`.
