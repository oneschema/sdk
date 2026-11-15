# Angular

This workspace builds the library with Angular CLI 21, `@angular/build`, and
ng-packagr. Unit tests use Vitest with jsdom (`yarn test:ci` for a single run).

It contains the library package [@oneschema/angular](https://github.com/oneschema/sdk/tree/main/packages/importer-angular/projects/oneschema).
There is no application target in this workspace. Build from the repository
root with `yarn build` so the core importer is built first.

The published library keeps its Angular `>=15` peer range and partial-Ivy
compilation. The root `yarn check:install` verifies both Angular 15 and 21
consumers against the packed library, including declaration compilation and
linking with each consumer's Angular compiler.
