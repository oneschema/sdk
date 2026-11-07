import type { OneSchemaValidationHookToAdd } from "../src/config"

const hook: OneSchemaValidationHookToAdd = {
  name: "Validation hook",
  url: "https://example.com/validate",
}

const basicHook: OneSchemaValidationHookToAdd = { ...hook, auth_type: "basic" }
const jwtHook: OneSchemaValidationHookToAdd = {
  ...hook,
  auth_type: "bearer_user_jwt",
}
const legacyHook: OneSchemaValidationHookToAdd = {
  ...hook,
  authorization_type: "basic",
}

// @ts-expect-error Only supported authorization types are accepted.
const invalidHook: OneSchemaValidationHookToAdd = { ...hook, auth_type: "invalid" }

void [basicHook, jwtHook, legacyHook, invalidHook]
