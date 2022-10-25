import { Inject, Injectable, OnDestroy } from '@angular/core'
import { OneSchemaImporterClass, OneSchemaParams } from '@oneschema/importer'
import { OneSchemaParamsService } from './oneschema.params'
import { version } from '../../package.json'

@Injectable({
  providedIn: 'root',
})
export class OneSchemaService extends OneSchemaImporterClass implements OnDestroy {
  constructor(@Inject(OneSchemaParamsService) private params: OneSchemaParams) {
    super(params)
    this.setClient('Angular', version)
  }

  ngOnDestroy() {
    this.close(true)
  }
}
