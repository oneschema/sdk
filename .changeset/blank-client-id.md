---
"@oneschema/importer": patch
---

Avoid loading the embed launcher when the client ID is blank, missing, or not a string

`launch()` and `launchSession()` now reject with the new `OneSchemaLaunchError.InvalidClientId`, and the client ID is URL-encoded in the embed launcher URL.
