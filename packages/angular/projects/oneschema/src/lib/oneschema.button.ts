import { Component } from '@angular/core'
import { OneSchemaService } from './oneschema.service'

@Component({
  selector: 'oneschema-button',
  template: `<button (click)="launch()">Open OneSchema</button>`,
  styles: [],
})
export class OneSchemaButton {
  constructor(public oneschema: OneSchemaService) {}

  launch() {
    this.oneschema.launch()
  }
}
