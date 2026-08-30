<p align="center">
  <a href="https://www.oneschema.co/">
    <img src="https://uploads-ssl.webflow.com/62902d243ad8aef519be0d3e/62902d243ad8ae4014be0e97_oneschema-256.png" height="128">
    <h1 align="center">OneSchema Importer</h1>
  </a>
</p>

A tool for embedding OneSchema into your application with Angular.
This library contains an Angular module and service to help you use OneSchema
with your application.

## Getting Started

### Installation

You can install this package with npm:

```bash
npm i --save @oneschema/angular
```

With pnpm, install `eventemitter3` alongside it:

```bash
pnpm add @oneschema/angular eventemitter3@^4.0.7
```

The importer class this service wraps extends `EventEmitter` from
`eventemitter3`, so that type is part of the published declarations. pnpm keeps
each package's dependencies isolated instead of hoisting them, so your build
cannot resolve `eventemitter3` unless it is declared in your project too. npm
and yarn hoist it for you.

### Compatibility

`@oneschema/angular` depends on `@oneschema/importer` directly, as the React
and Vue wrappers do, so installing the wrapper installs the matching core and
there is no second package to keep in step. If your application also imports
`@oneschema/importer` itself, declare it as your own dependency with a range
that admits the one this wrapper requires (currently `^0.7.7`), so your
package manager resolves a single copy of the core.

The package is published in the Angular Package Format with partial-Ivy
bundles, which the Angular linker in your application's build fully compiles
ahead of time. It supports Angular 15 and newer (`@angular/core` and
`@angular/common` `>=15`); the packaged bundles are verified by building
scratch applications on Angular 15, 20 and 22, and the library itself is built
and unit tested against Angular 16.

### Sample usage

Add the OneSchemaModule to your `app.module`:

```javascript
import { BrowserModule } from "@angular/platform-browser"
import { NgModule } from "@angular/core"
import { AppComponent } from "./app.component"

// Import the module from the OneSchema package
import { OneSchemaModule } from "@oneschema/angular"

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,

    // Import the module into the application, with configuration
    OneSchemaModule.forRoot({
      clientId: "CLIENT_ID",
      templateKey: "TEMPLATE_KEY",
      userJwt: "USER_JWT",
      styles: {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
      },
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
export class OneSchemaButtonComponent implements OnDestroy {
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

  onError(error: any) {
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

To style the iframe, either pass in `styles` prop to the module, add CSS to your global stylesheet, or to a component with [ViewEncapsulation.None](https://angular.io/guide/view-encapsulation). The iframe's class will be what is passed to the module as the `className` prop or `oneschema-iframe` by default. Sample CSS for the iframe to take up the full viewport is:

```css
.oneschema-iframe {
  position: fixed;
  right: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
}
```

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
export class OneSchemaIframeComponent implements AfterViewInit {
  @ViewChild('oneschema') iframe?: ElementRef<HTMLIFrameElement>

  constructor(public oneschema: OneSchemaService) {}

  ngAfterViewInit() {
    this.oneschema.setIframe(this.iframe!.nativeElement)
  }
}
```

## Documentation

Please see [📚 OneSchema's documentation](https://docs.oneschema.co/) for [📒 API reference](https://docs.oneschema.co/docs/angular#api-reference) and other helpful guides.
