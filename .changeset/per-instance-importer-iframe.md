---
"@oneschema/importer": major
"@oneschema/react": major
"@oneschema/vue": major
"@oneschema/angular": major
---

Give every importer instance its own iframe and lifecycle state

Instances no longer share the single `_oneschema-iframe` element and its refcount, and iframe load state is per instance instead of static, so several importers can be launched on one page without stealing each other's session or initializing before their own iframe has loaded.

The new `parent` option takes the container element directly; `parentId` still works but is deprecated, since an id is resolved once at construction and falls back to `document.body` when the element does not exist yet. `importer.status` (`idle` | `launching` | `launched` | `destroyed`) replaces the internal `_hasAttemptedLaunch` field, which is gone — the React component uses the accessor and compares launch params by value, so its "already launched" warning no longer fires on ordinary rerenders.

`@oneschema/react` and `@oneschema/vue` now declare `@oneschema/importer` as a peer dependency, matching `@oneschema/angular`: install it alongside the wrapper.
