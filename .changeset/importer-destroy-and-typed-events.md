---
"@oneschema/importer": patch
"@oneschema/react": patch
"@oneschema/vue": patch
"@oneschema/angular": patch
---

Add `destroy()` and fix the `message` listener leak: cleanup removed a different
function reference than the one that was added, so a closed importer kept
handling embed messages. `close(true)` now delegates to `destroy()`. A destroyed instance rejects
`launch()` with `OneSchemaLaunchError.Destroyed` rather than reporting a success
it cannot deliver, and the React component replaces the instance it destroyed so
a remount (including React strict mode's double effect) still imports.

Carry the launch failure detail (`message`, `status`, `data`) from the embed to
the host on the `launched` event, and always emit the initialization-timeout
error instead of swallowing it when `devMode` is true.

Type the event surface with `OneSchemaEventMap`, export `PicklistOption` and
`OneSchemaImportResult`, and mark the `_`-prefixed internals as `@internal`.
