<p align="center">
  <a href="https://www.oneschema.co/">
    <img src="https://uploads-ssl.webflow.com/62902d243ad8aef519be0d3e/62902d243ad8ae4014be0e97_oneschema-256.png" height="128">
    <h1 align="center">OneSchema Importer</h1>
  </a>
</p>

A tool for embedding OneSchema into your application with Vue. This library contains a Vue plugin which will allow you to add an iframe to your application which can open OneSchema and import data into your application.

## Getting Started

### Installation

You can install this package with npm:

```bash
npm i --save @oneschema/vue
```

### Configure the SDK
Create an instance of the `OneSchemaPlugin` by calling `createOneSchemaImporter` and passing it to Vue's `app.use()`

```javascript
import { createOneSchemaImporter } from '@oneschema/vue'

const app = createApp(App)

app.use(
  createOneSchemaImporter({
    clientId: '<CLIENT_ID>',
    ...initParams
  })
)

app.mount('#app')
```

### Sample usage
Once the OneSchema plugin has been registered, you can call the `useOneSchemaImporter` function to obtain the `OneSchemaImporterClass` instance.

```js-vue
<script setup lang="ts">
  import { useOneSchemaImporter } from "@oneschema/vue"

  const importer = useOneSchemaImporter();

  const launchOneSchema = function () {
    importer.launch();

    importer.on('success', (data) => {
      // TODO: handle success
      console.log(data);
    });

    importer.on('cancel', () => {
      // TODO: handle cancel
    });

    importer.on('error', (message) => {
      // TODO: handle errors
      console.log(message);
    });
  };
</script>
<template>
  <button @click="launchOneSchema">Launch embed</button>
</template>

<style>
  .oneschema-iframe {
    width: 100vw;
    height: 100vh;
    border: none;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 10000; /* adjust as needed */
  }
</style> 
```

## Documentation

Please see [📚 OneSchema's documentation](https://docs.oneschema.co/) for [📒 API reference](https://docs.oneschema.co/docs/react#api-reference) and other helpful guides.
