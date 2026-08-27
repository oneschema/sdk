import { AfterViewInit, Component, ElementRef, ViewChild, OnDestroy } from '@angular/core'
import { OneSchemaService } from './oneschema.service'

// These components are not used/exported
// but exist to show how lib might be used...

@Component({
  selector: 'oneschema-button',
  template: `<button (click)="launch()">Open OneSchema</button>`,
  styles: [],
})
export class OneSchemaButtonComponent {
  constructor(public oneschema: OneSchemaService) {}

  launch() {
    this.oneschema.launch()
  }
}

@Component({
  selector: 'oneschema-listener',
  template: ``,
  styles: [],
})
export class OneSchemaListenerComponent implements OnDestroy {
  constructor(public oneschema: OneSchemaService) {
    this.oneschema.on('success', this.onSuccess)
    this.oneschema.on('error', this.onError)
    this.oneschema.on('cancel', this.onCancel)
  }

  onSuccess(_data: unknown) {
    // handle success
  }

  onError(_error: unknown) {
    // handle error
  }

  onCancel() {
    // handle cancel
  }

  ngOnDestroy() {
    this.oneschema.off('success', this.onSuccess)
    this.oneschema.off('error', this.onError)
    this.oneschema.off('cancel', this.onCancel)
  }
}

@Component({
  selector: 'oneschema-iframe',
  template: ` <iframe #oneschema></iframe>`,
  styles: [
    `
      iframe {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
      }
    `,
  ],
})
export class OneSchemaIframeComponent implements AfterViewInit {
  @ViewChild('oneschema') iframe?: ElementRef<HTMLIFrameElement>

  constructor(public oneschema: OneSchemaService) {}

  ngAfterViewInit() {
    this.oneschema.setIframe(this.iframe!.nativeElement)
  }
}
