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

With pnpm, install `eventemitter3` alongside it:

```bash
pnpm add @oneschema/vue eventemitter3@^4.0.7
```

The importer class this component wraps extends `EventEmitter` from `eventemitter3`, so that type is part of the published declarations. pnpm keeps each package's dependencies isolated instead of hoisting them, so your build cannot resolve `eventemitter3` unless it is declared in your project too. npm and yarn hoist it for you.

### Configure the SDK

Create an instance of the `OneSchemaPlugin` by calling `createOneSchemaImporter` and passing it to Vue's `app.use()`

```javascript
import { createApp } from "vue"
import { createOneSchemaImporter } from "@oneschema/vue"
import App from "./App.vue"

const app = createApp(App)

app.use(
  createOneSchemaImporter({
    clientId: "<CLIENT_ID>",
    ...initParams,
  }),
)

app.mount("#app")
```

### Sample usage

Once the OneSchema plugin has been registered, you can call the `useOneSchemaImporter` function to obtain the `OneSchemaImporterClass` instance. The importer manages its own visibility: it closes itself when the import completes, the user cancels, or a fatal error occurs. Register the handlers once, in setup, rather than per launch — registering them inside the launch handler adds another copy of each on every launch.

```vue
<script setup lang="ts">
import { useOneSchemaImporter } from "@oneschema/vue"

const importer = useOneSchemaImporter()

const launchOneSchema = async function () {
  try {
    const { embedId } = await importer.launch()
    console.log(embedId)
  } catch (failure) {
    // TODO: handle the launch failure
    console.error(failure)
  }
}

importer.on("success", async (data) => {
  // the importer stays open until this resolves
  console.log(data)
})

importer.on("cancel", () => {
  // TODO: handle cancel
})

importer.on("error", (error) => {
  // TODO: handle errors
  console.log(error)
})
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

## Migrating from 0.7

[MIGRATING-0.8.md](https://github.com/oneschema/sdk/blob/main/MIGRATING-0.8.md) walks through the 0.7.7 → 0.8 hop for this package and the core importer it wraps, with a codemod for the mechanical parts.

## Documentation

Please see [📚 OneSchema's documentation](https://docs.oneschema.co/) for [📒 API reference](https://docs.oneschema.co/docs/vue#api-reference) and other helpful guides.
