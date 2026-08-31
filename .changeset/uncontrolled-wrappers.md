---
"@oneschema/react": major
"@oneschema/vue": major
"@oneschema/angular": major
---

Let the wrappers manage the importer's visibility, and register the React listeners once

`isOpen` is now optional on `<OneSchemaImporter />`. Omit it and the component runs uncontrolled: the host launches through the component's `ref` — `launch()` returns the importer's promise, plus `close()` and `status` — and the importer closes itself when the import completes, the user cancels, or a fatal error occurs. Supplying `isOpen` keeps today's controlled behavior unchanged, including `onRequestClose`, which is only called in that mode.

React handlers are read through a ref, so the listeners are registered once per importer instead of being torn off with `removeAllListeners()` and re-registered whenever an inline handler's identity changes. That re-registration dropped listeners the importer was in the middle of emitting to, which is what made an `onSuccess` defined inline in the render body miss a `success` that landed on the same commit. `onSuccess` and `onCancel` may now return a promise, which the importer awaits before it closes the session. The duplicate-launch warning keys off the importer's `status` rather than the serialized launch params, so it no longer fires for a re-render that changed nothing.

The Vue plugin destroys its importer when the app unmounts, releasing the window message listener and, under `manageDOM`, the iframe; `useOneSchemaImporter()` throws a named error when the plugin was never installed instead of returning `undefined` typed as an importer. Vue and Angular were already uncontrolled — they hand the core importer to the host — so their only behavior change is that `launch()` now returns a promise: `@oneschema/angular`'s `OneSchemaButton` handles its rejection rather than leaving it unhandled, and a host that calls `launch()` itself has to do the same.
