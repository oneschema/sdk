import { Component } from '@angular/core'
import { OneSchemaService } from './oneschema.service'

@Component({
  selector: 'lib-oneschema-button',
  template: `<button id="oneschema-launch-button" (click)="oneschema.launch()">
    Open OneSchema
  </button>`,
  styles: [],
})
// This class name is part of the published @oneschema/angular API.
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class OneSchemaButton {
  constructor(public oneschema: OneSchemaService) {}
}
