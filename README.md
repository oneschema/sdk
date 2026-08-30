<p align="center">
  <a href="https://www.oneschema.co/">
    <img alt="OneSchema logo" src="https://uploads-ssl.webflow.com/62902d243ad8aef519be0d3e/62902d243ad8ae4014be0e97_oneschema-256.png" height="128">
    <h1 align="center">OneSchema SDK</h1>
  </a>
</p>

This repository contains tools to help you embed OneSchema products into your application.

## OneSchema Importer

- [📑 Importer](https://github.com/oneschema/sdk/tree/main/packages/importer),
  a plain Javascript library for embedding OneSchema Importer.

  [![NPM package version](https://img.shields.io/npm/v/@oneschema/importer)](https://www.npmjs.com/package/@oneschema/importer)
  [![NPM gzipped bundle size](<https://img.shields.io/bundlejs/size/@oneschema/importer?label=bundle+(gzip)>)](https://bundlejs.com/?q=@oneschema/importer)

- [⚛ Importer React](https://github.com/oneschema/sdk/tree/main/packages/importer-react), a React
  component library for embedding OneSchema Importer.

  [![NPM package version](https://img.shields.io/npm/v/@oneschema/react)](https://www.npmjs.com/package/@oneschema/react)
  [![NPM gzipped bundle size](<https://img.shields.io/bundlejs/size/@oneschema/react?label=bundle+(gzip)>)](https://bundlejs.com/?q=@oneschema/react)

- [🅰️ Importer Angular](https://github.com/oneschema/sdk/tree/main/packages/importer-angular/projects/oneschema),
  an Angular module for embedding OneSchema Importer.

  [![NPM package version](https://img.shields.io/npm/v/@oneschema/angular)](https://www.npmjs.com/package/@oneschema/angular)
  [![NPM gzipped bundle size](<https://img.shields.io/bundlejs/size/@oneschema/angular?label=bundle+(gzip)>)](https://bundlejs.com/?q=@oneschema/angular)

- [🧩 Importer Vue](https://github.com/oneschema/sdk/tree/main/packages/importer-vue), a Vue
  plugin for embedding OneSchema Importer.

  [![NPM package version](https://img.shields.io/npm/v/@oneschema/vue)](https://www.npmjs.com/package/@oneschema/vue)
  [![NPM gzipped bundle size](<https://img.shields.io/bundlejs/size/@oneschema/vue?label=bundle+(gzip)>)](https://bundlejs.com/?q=@oneschema/vue)

## OneSchema FileFeeds (legacy)

The FileFeeds packages are in maintenance mode. They keep working and still
receive critical and security fixes, but no new features and no major updates
are planned.

- [📑 FileFeeds](https://github.com/oneschema/sdk/tree/main/packages/filefeeds),
  a plain Javascript library for embedding OneSchema FileFeeds.

  [![NPM package version](https://img.shields.io/npm/v/@oneschema/filefeeds)](https://www.npmjs.com/package/@oneschema/filefeeds)
  [![NPM gzipped bundle size](<https://img.shields.io/bundlejs/size/@oneschema/filefeeds?label=bundle+(gzip)>)](https://bundlejs.com/?q=@oneschema/filefeeds)

- [⚛ FileFeeds React](https://github.com/oneschema/sdk/tree/main/packages/filefeeds-react),
  a React component library for embedding OneSchema FileFeeds.

  [![NPM package version](https://img.shields.io/npm/v/@oneschema/filefeeds-react)](https://www.npmjs.com/package/@oneschema/filefeeds-react)
  [![NPM gzipped bundle size](<https://img.shields.io/bundlejs/size/@oneschema/filefeeds-react?label=bundle+(gzip)>)](https://bundlejs.com/?q=@oneschema/filefeeds-react)

## Development

See [TESTING.md](./TESTING.md) for how to run and test the SDK packages locally.

## Releasing

Add a changeset in your pull request when changing a published package. Merging
the Version Packages pull request updates package versions and publishes them.

The legacy FileFeeds packages are ignored by that automation: do not write a
changeset for them, and note the change under `Unreleased` in
[CHANGELOG-filefeeds.md](./CHANGELOG-filefeeds.md) instead. Their versions and
their publish are handled by hand, only when a maintenance fix warrants a
release.

The workflow publishes through npm's trusted publishing: every package is
registered on npm with a GitHub Actions trusted publisher for `oneschema/sdk`
and the `release.yml` workflow in the `release` environment, so authentication
and provenance both come from the workflow's OIDC identity and no npm token
exists. The environment is restricted to `main`, which is what keeps a rewritten
workflow on another branch from publishing. A new package has to be registered
the same way before its first automated publish.

Every published package is tagged `<package>@<version>` on the commit it was
built from, and the release workflow then compares each tarball on npm with a
fresh build of that commit, so a release can always be traced back to its
source. To repeat that comparison later, run the `Verify release` workflow on
the tag, or locally:

```sh
git checkout @oneschema/importer@0.7.6
yarn install --immutable && yarn build
node scripts/verify-published.mjs
```
