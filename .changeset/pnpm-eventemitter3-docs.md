---
"@oneschema/importer": patch
"@oneschema/react": patch
"@oneschema/vue": patch
"@oneschema/angular": patch
---

Document that pnpm projects need to install `eventemitter3` alongside the SDK, because the importer class extends it in the published type declarations and pnpm does not hoist transitive dependencies.
