<p align="center">
  <a href="https://www.oneschema.co/">
    <img src="https://uploads-ssl.webflow.com/62902d243ad8aef519be0d3e/62902d243ad8ae4014be0e97_oneschema-256.png" height="128">
    <h1 align="center">OneSchema Importer</h1>
  </a>
</p>

A tool for embedding OneSchema into your application. This library will give you convenient bindings to add an iframe to your application which can open OneSchema and import data into your application.

## Getting Started

### Installation

You can install this package with npm:

```bash
npm i --save @oneschema/importer
```

or with a script tag:

```html
<script src="https://d3ah8o189k1llu.cloudfront.net/oneschema-importer-0.3.latest.min.js"></script>
```

### Sample usage

```javascript
import oneschemaImporter from "@oneschema/importer"

const importer = oneschemaImporter({
  /* required here */
  clientID: 'YOUR_CLIENT_ID',
  /* required here or at launch */
  templateKey: 'YOUR_TEMPLATE_KEY',
  userJwt: 'YOUR_USER_JWT',
  /* optional */
  importConfig: { type: "local" }
  devMode: true,
  className: 'oneschema-importer',
})

importer.launch()
// OR
// pass overrides and values not specified at creation time:
importer.launch({
  templateKey: 'YOUR_TEMPLATE_KEY',
  userJwt: 'YOUR_USER_JWT',
  importConfig: { type: "local" }
})

importer.on("success", (data) => {
  // handle success
})

importer.on("cancel", () => {
  // handle cancel
})

importer.on("error", (message) => {
  // handle error
})
```

## Documentation

Please see [📚 OneSchema's documentation](https://docs.oneschema.co/) for [📒 API reference](https://docs.oneschema.co/docs/javascript#api-reference) and other helpful guides.
