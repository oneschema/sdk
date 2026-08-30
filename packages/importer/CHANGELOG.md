# @oneschema/importer

## 0.7.7

### Patch Changes

- 1e273db: Include the core importer version in initialization messages for server-side SDK telemetry.

## 0.7.6

### Patch Changes

- e852152: Add `destroy()` and fix the `message` listener leak: cleanup removed a different
  function reference than the one that was added, so a closed importer kept
  handling embed messages. `close(true)` now delegates to `destroy()`. A destroyed instance rejects
  `launch()` with `OneSchemaLaunchError.Destroyed` rather than reporting a success
  it cannot deliver, and the React component now creates and destroys its importer
  in a mount effect, so a remount (including React strict mode's double effect)
  gets a fresh instance and still imports.

  Carry the launch failure detail (`message`, `status`, `data`) from the embed to
  the host on the `launched` event, and always emit the initialization-timeout
  error instead of swallowing it when `devMode` is true.

  Type the event surface with `OneSchemaEventMap`, export `PicklistOption` and
  `OneSchemaImportResult`, and mark the `_`-prefixed internals as `@internal`.

- e852152: Generate the README option, prop and event references from the TypeScript
  types, and correct the drift they had accumulated: `clientID` (never a real
  option) is `clientId`, `saveSession` defaults to `true` rather than `false`, the
  `error` payload is `{ message, severity }`, and the callbacks and events that
  were missing are now listed.
- 0041f56: Document that pnpm projects need to install `eventemitter3` alongside the SDK, because the importer class extends it in the published type declarations and pnpm does not hoist transitive dependencies.
- 6c39143: Publish dual ESM and CommonJS package entrypoints with explicit export maps.
