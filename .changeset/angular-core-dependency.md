---
"@oneschema/angular": minor
---

Depend on `@oneschema/importer` directly instead of declaring it as a peer dependency, matching `@oneschema/react` and `@oneschema/vue`. Installing `@oneschema/angular` now installs the core it was built against, so `npm i --save @oneschema/angular @oneschema/importer` can become `npm i --save @oneschema/angular`. Applications that import `@oneschema/importer` themselves should keep declaring it, with a range admitting the version this wrapper requires, so a single copy of the core resolves.
