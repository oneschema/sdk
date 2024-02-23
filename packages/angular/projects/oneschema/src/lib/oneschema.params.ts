import { InjectionToken } from "@angular/core"
import { OneSchemaParams } from "@oneschema/importer"

export const OneSchemaParamsService = new InjectionToken<OneSchemaParams>(
  "oneschema.params",
)
