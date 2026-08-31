import { OneSchemaImporterClass, OneSchemaParams } from "@oneschema/importer"
import { ONESCHEMA_IMPORTER_KEY, OneSchemaPlugin } from "./plugin.js"

import { inject } from "vue"

export function createOneSchemaImporter(createParams: OneSchemaParams) {
  return new OneSchemaPlugin(createParams)
}

export function useOneSchemaImporter(): OneSchemaImporterClass {
  const importer = inject<OneSchemaImporterClass>(ONESCHEMA_IMPORTER_KEY)
  if (!importer) {
    throw new Error(
      "No OneSchema importer was provided. Pass createOneSchemaImporter(params) to app.use() before calling useOneSchemaImporter()",
    )
  }

  return importer
}
