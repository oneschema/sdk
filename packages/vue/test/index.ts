import { createApp } from "vue"

import { createOneSchemaImporter } from "../src"
import App from "./OneSchemaImporter.vue"

const app = createApp(App)

app.use(
  createOneSchemaImporter({
    clientId: "67bb2e5f-f0f7-42a6-a511-18b25e67b8c4",
    templateKey: "crm_test",
    importConfig: { type: "local" },
    userJwt:
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI2N2JiMmU1Zi1mMGY3LTQyYTYtYTUxMS0xOGIyNWU2N2I4YzQiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-IiwiY3JlYXRlIjp7InNlc3Npb24iOnsiZmlsZV9mZWVkX2lkIjoyOTM3Nn19fQ.BgpLx_kmW2HWMu2dzcw1pMKBm3LNsXXJzAgmZt1rNuA",
    baseUrl: "http://embed.localschema.co:9450",
    devMode: false,
  }),
)

app.mount("#app")
