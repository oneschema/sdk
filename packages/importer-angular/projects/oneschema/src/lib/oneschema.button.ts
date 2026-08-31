import { Component } from '@angular/core'
import { OneSchemaService } from './oneschema.service'

@Component({
  selector: 'lib-oneschema-button',
  template: `<button id="oneschema-launch-button" (click)="launch()">
    Open OneSchema
  </button>`,
  styles: [],
})
// This class name is part of the published @oneschema/angular API.
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class OneSchemaButton {
  constructor(public oneschema: OneSchemaService) {}

  launch() {
    // Launch failures reach the host through the launched and error events, so
    // the rejection has no other reader here.
    this.oneschema.launch().catch(() => undefined)
  }
}
