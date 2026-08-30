# @oneschema/angular

## 0.7.6

### Patch Changes

- 710ef89: Document the `@oneschema/importer` compatibility policy and the supported Angular versions in the README.
- 3816ab9: Update `@oneschema/importer` peer dependency range to `^0.7.0` to match the published importer version.
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

- 0041f56: Document that pnpm projects need to install `eventemitter3` alongside the SDK, because the importer class extends it in the published type declarations and pnpm does not hoist transitive dependencies.
- Updated dependencies [e852152]
- Updated dependencies [e852152]
- Updated dependencies [0041f56]
- Updated dependencies [6c39143]
  - @oneschema/importer@0.7.6
