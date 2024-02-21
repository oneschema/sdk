import { Component } from "@angular/core"
import { OneSchemaService } from "./oneschema.service"

@Component({
  selector: "lib-oneschema-button",
  template: `<button id="oneschema-launch-button" (click)="click()">
    Open OneSchema
  </button>`,
  styles: [],
})
export class OneSchemaButton {
  constructor(public oneschema: OneSchemaService) {
    const click = () => {
      oneschema.launch()
    }
  }
}
