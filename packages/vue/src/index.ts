import { OneSchemaImporterClass, OneSchemaParams } from "@oneschema/importer"
import { OneSchemaPlugin } from "./plugin"

import { inject } from "vue"

export * from "@oneschema/importer"

export function createOneSchemaImporter(createParams: OneSchemaParams) {
  return new OneSchemaPlugin(createParams)
}

export function useOneSchemaImporter() {
  return inject("os-importer") as OneSchemaImporterClass
}
