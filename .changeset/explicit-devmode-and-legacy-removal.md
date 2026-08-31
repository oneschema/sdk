---
"@oneschema/importer": major
"@oneschema/react": major
"@oneschema/vue": major
"@oneschema/angular": major
---

Remove the deprecated launch surface and make `devMode` explicit

`devMode` now defaults to `false` for every host. It used to default to `process.env.NODE_ENV !== "production"`, which reads a Node global that a browser bundle either inlines or leaves undefined, so whether the iframe stayed visible after a failed launch depended on the bundler rather than on the application. Wire it to your own build condition — `devMode={import.meta.env.DEV}` or whatever your bundler exposes — to keep the old behavior.

`parentId` is gone; pass the container element as `parent`. An id was resolved once, at construction, so it silently fell back to `document.body` whenever the container had not mounted yet.

The `launched` event's payload is now `OneSchemaLaunchEvent`, a union of `OneSchemaLaunchSucceeded` and `OneSchemaLaunchFailed` discriminated on `success`, replacing `OneSchemaLaunchStatus`. Narrow on `success` before reading a branch's fields; the failure branch carries the same detail as the `OneSchemaLaunchFailure` that `launch()` rejects with. The internals `_hasAttemptedLaunch`, `_launch`, `_initWithRetry` and `_resetSession` are gone — `importer.status` and the promise `launch()` returns cover what they were reached for.

[MIGRATING-0.8.md](https://github.com/oneschema/sdk/blob/main/MIGRATING-0.8.md) walks through the whole 0.7.7 → 0.8 hop, with a codemod for the mechanical parts.
