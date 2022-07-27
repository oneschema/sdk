import { ModuleWithProviders, NgModule } from '@angular/core'
import { OneSchemaService } from './oneschema.service'
import { OneSchemaParams } from '@oneschema/importer'
import { OneSchemaParamsService } from './oneschema.params'
import { OneSchemaButton } from './oneschema.button'

@NgModule({
  declarations: [OneSchemaButton],
  exports: [OneSchemaButton],
})
export class OneSchemaModule {
  static forRoot(params: OneSchemaParams): ModuleWithProviders<OneSchemaModule> {
    return {
      ngModule: OneSchemaModule,
      providers: [
        OneSchemaService,
        {
          provide: OneSchemaParamsService,
          useValue: params,
        },
      ],
    }
  }
}
