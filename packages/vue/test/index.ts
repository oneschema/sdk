import { createApp } from 'vue'

import { createOneSchemaImporter } from '../src'
import App from './OneSchemaImporter.vue'

const app = createApp(App)

app.use(createOneSchemaImporter({
  clientId: "8032af4b-e2d9-40ad-8142-e68011d94d9c",
  templateKey: "crm_test",
  importConfig: { type: "local" },
  userJwt: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI4MDMyYWY0Yi1lMmQ5LTQwYWQtODE0Mi1lNjgwMTFkOTRkOWMiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-In0.UHcGqI6HutinJNCxO32dWNDBbfUJVVqrvmA_GLpLf50",
  baseUrl: "http://embed.localschema.co:9450",
  devMode: false,
}))

app.mount('#app')
