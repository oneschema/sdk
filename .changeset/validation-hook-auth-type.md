---
"@oneschema/importer": patch
---

Add `auth_type` to `OneSchemaValidationHookToAdd` for validation hook authorization

Deprecate `authorization_type`, which is ignored by OneSchema, while keeping existing TypeScript callers compatible. Use `auth_type` instead.
