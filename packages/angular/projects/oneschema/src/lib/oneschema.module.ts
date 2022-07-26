import { ModuleWithProviders, NgModule } from '@angular/core'
import { OneSchemaService } from './oneschema.service'
import { OneSchemaParams } from '@oneschema/importer'
import { OneSchemaParamsService } from './oneschema.config'
import { OneSchemaButton } from './oneschema.button'

@NgModule({
  declarations: [OneSchemaButton],
  exports: [OneSchemaButton],
})
export class OneSchemaModule {
  static forRoot(config: OneSchemaParams): ModuleWithProviders<OneSchemaModule> {
    return {
      ngModule: OneSchemaModule,
      providers: [
        OneSchemaService,
        {
          provide: OneSchemaParamsService,
          useValue: config,
        },
      ],
    }
  }
}
