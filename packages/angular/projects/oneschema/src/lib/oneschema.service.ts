import { Inject, Injectable, OnDestroy } from "@angular/core"
import { OneSchemaImporterClass, OneSchemaParams } from "@oneschema/importer"
import { OneSchemaParamsService } from "./oneschema.params"
import packageJson from "../../package.json"

@Injectable({
  providedIn: "root",
})
export class OneSchemaService extends OneSchemaImporterClass implements OnDestroy {
  constructor(@Inject(OneSchemaParamsService) private params: OneSchemaParams) {
    super(params)
    this.setClient("Angular", packageJson.version)
  }

  ngOnDestroy() {
    this.close(true)
  }
}
