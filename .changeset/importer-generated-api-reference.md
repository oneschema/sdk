---
"@oneschema/importer": patch
"@oneschema/react": patch
---

Generate the README option, prop and event references from the TypeScript
types, and correct the drift they had accumulated: `clientID` (never a real
option) is `clientId`, `saveSession` defaults to `true` rather than `false`, the
`error` payload is `{ message, severity }`, and the callbacks and events that
were missing are now listed.
