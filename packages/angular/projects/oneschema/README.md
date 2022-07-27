<p align="center">
  <a href="https://www.oneschema.co/">
    <img src="https://uploads-ssl.webflow.com/62902d243ad8aef519be0d3e/62902d243ad8ae4014be0e97_oneschema-256.png" height="128">
    <h1 align="center">OneSchema Importer</h1>
  </a>
</p>

A tool for embedding OneSchema into your application with Angular. This library contains an Angular module and service to help you use OneSchema with your application.

## Getting Started

### Installation

You can install this package with npm:

```bash
npm i --save @oneschema/angular @oneschema/importer
```

### Sample usage

Add the OneSchemaModule to your `app.module`:

```javascript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';

// Import the module from the OneSchema package
import { OneSchemaModule } from '@oneschema/angular';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,

    // Import the module into the application, with configuration
    OneSchemaModule.forRoot({
      clientId: 'CLIENT_ID',
      templateKey: 'TEMPLATE_KEY',
      userJwt: 'USER_JWT',
      styles: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
      }
    }),
  ],

  bootstrap: [AppComponent],
})
export class AppModule {}
```

Create a button to open the OneSchema importer and listen to events:

```javascript
import { Component } from '@angular/core'
import { OneSchemaService } from './oneschema.service'

@Component({
  selector: 'oneschema-button',
  template: `<button (click)="launch()">Open OneSchema</button>`,
  styles: [],
})
export class OneSchemaButton implements OnDestroy {
  constructor(public oneschema: OneSchemaService) {
    this.oneschema.on('success', this.onSuccess)
    this.oneschema.on('error', this.onError)
    this.oneschema.on('cancel', this.onCancel)
  }

  launch() {
    this.oneschema.launch()
  }

  onSuccess(data: any) {
    // handle success
  }

  onError(message: string) {
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
```

To style the iframe, either pass in `styles` prop to the module, add CSS to your global stylesheet, or to a component with [ViewEncapsulation.None](https://angular.io/guide/view-encapsulation). 
The iframe's class be what is passed to the module as the `className` prop or `oneschema-iframe` by default.

### Advanced usage

Manage the iframe yourself by adding `inline` to your OneSchemaModule configuration and then making an iframe in a component:
```javascript
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core'
import { OneSchemaService } from '@oneschema/angular'

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
export class OneSchemaIframe implements AfterViewInit {
  @ViewChild('oneschema') iframe?: ElementRef<HTMLIFrameElement>

  constructor(public oneschema: OneSchemaService) {}

  ngAfterViewInit() {
    this.oneschema.setIframe(this.iframe!.nativeElement)
  }
}
```
