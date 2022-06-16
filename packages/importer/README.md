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
npm i --save @oneschema/sdk
```

or with a script tag:

```html
<script src="oneschemasdk-latest.min.js"></script>
```

### Sample usage

```javascript
import oneSchemaImporter from "@oneschema/sdk"

const importer = oneSchemaImporter(clientId, {
  className: "my-iframe-class",
  parentId: "my-iframe-container",
})

importer.launch({
  templateKey: "test_template",
  userJwt: token,
  options: {
    enableManageColumns: true,
    autofixAfterMapping: true,
    blockImportIfErrors: true,
  },
})

importer.on("success", (data) => {
  console.log(data)
  alert("success!")
  importer.close()
})

importer.on("cancel", () => {
  alert("cancel")
  importer.close()
})

importer.on("error", (message) => {
  console.log(message)
  alert("error!")
})
```

## Documentation

Please see [📚 OneSchema's documentation](https://docs.oneschema.co/) for API reference and other helpful guides.
