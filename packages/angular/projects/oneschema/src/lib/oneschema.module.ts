import { ModuleWithProviders, NgModule } from "@angular/core"
import { OneSchemaService } from "./oneschema.service"
import { OneSchemaImporterClass, OneSchemaParams } from "@oneschema/importer"
import { OneSchemaParamsService } from "./oneschema.params"
import { OneSchemaButton } from "./oneschema.button"

@NgModule({
  declarations: [OneSchemaButton],
  // imports: [OneSchemaImporterClass],
  exports: [OneSchemaButton],
})
export class OneSchemaModule {
  static forRoot(params: OneSchemaParams): ModuleWithProviders<OneSchemaModule> {
    return {
      ngModule: OneSchemaModule,
      providers: [
        // OneSchemaJSClass,
        OneSchemaService,
        {
          provide: OneSchemaParamsService,
          useValue: params,
        },
      ],
    }
  }
}
