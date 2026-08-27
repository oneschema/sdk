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
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI8Q0xJRU5UX0lEPiIsInVzZXJfaWQiOiI8VVNFUl9JRD4iLCJjcmVhdGUiOnsic2Vzc2lvbiI6eyJmaWxlX2ZlZWRfaWQiOjB9fX0.not-a-real-signature",
    baseUrl: "http://embed.localschema.co:9450",
    devMode: true,
  }),
)

app.mount("#app")
