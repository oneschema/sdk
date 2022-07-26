import { Component } from '@angular/core'
import { OneSchemaService } from './oneschema.service'

@Component({
  selector: 'lib-oneschema-button',
  template: `<button (click)="oneschema.launch()">Open OneSchema</button>`,
  styles: [],
})
export class OneSchemaButton {
  constructor(public oneschema: OneSchemaService) {}
}
