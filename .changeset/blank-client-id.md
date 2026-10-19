---
"@oneschema/importer": patch
---

Avoid loading the embed launcher when the client ID is blank, missing, or not a string. `launch()` and `launchSession()` then return `{ success: false, error: OneSchemaLaunchError.LaunchError }` with a message, and valid client IDs are URL-encoded in the embed launcher URL.
