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

With pnpm, install `eventemitter3` alongside it:

```bash
pnpm add @oneschema/importer eventemitter3
```

The importer class extends `EventEmitter` from `eventemitter3`, so that type is part of the published declarations. pnpm keeps each package's dependencies isolated instead of hoisting them, so your build cannot resolve `eventemitter3` unless it is declared in your project too. npm and yarn hoist it for you.

### Sample usage

```javascript
import oneschemaImporter from "@oneschema/importer"

const importer = oneschemaImporter({
  /* required here */
  clientId: "YOUR_CLIENT_ID",
  /* required here or at launch */
  templateKey: "YOUR_TEMPLATE_KEY",
  userJwt: "YOUR_USER_JWT",
  /* optional */
  importConfig: { type: "local" },
  devMode: true,
  className: "oneschema-importer",
})

importer.launch()
// OR
// pass overrides and values not specified at creation time:
importer.launch({
  templateKey: "YOUR_TEMPLATE_KEY",
  userJwt: "YOUR_USER_JWT",
  importConfig: { type: "local" },
})

importer.on("success", (data) => {
  // handle success
})

importer.on("cancel", () => {
  // handle cancel
})

importer.on("error", (error) => {
  // error is { message, severity }
})

// release the iframe and every listener when you are done with the instance
importer.destroy()
```

## API reference

The tables below are generated from the TypeScript types by
`yarn docs:api` — edit the JSDoc in `src/config.ts`, not the tables.

### Options set at initialization

<!-- BEGIN GENERATED importer-init-options -->

| Option         | Type                           | Required | Default                                     | Description                                                                                                                                   |
| -------------- | ------------------------------ | -------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `clientId`     | `string`                       | yes      |                                             | The client id from your OneSchema developer dashboard                                                                                         |
| `devMode`      | `boolean`                      |          | `!!(process.env.NODE_ENV !== "production")` | Whether to launch the importer in dev mode, which shows the iframe even when launching fails                                                  |
| `className`    | `string`                       |          | `"oneschema-iframe"`                        | CSS class for the iframe                                                                                                                      |
| `styles`       | `Partial<CSSStyleDeclaration>` |          |                                             | CSS Styles to be applied directly to the iframe                                                                                               |
| `languageCode` | `string`                       |          |                                             | Optional language code (like 'en' or 'zh') to force importer language By default, will use user's set language. Requires enterprise licensing |
| `parentId`     | `string`                       |          |                                             | The id of the DOM element the iframe should be appended to By default appends to document.body                                                |
| `saveSession`  | `boolean`                      |          | `true`                                      | Whether to save session information to local storage and enable resuming                                                                      |
| `autoClose`    | `boolean`                      |          | `true`                                      | Whether to close the importer when complete                                                                                                   |
| `manageDOM`    | `boolean`                      |          | `true`                                      | Whether the class should create and append the iframe to the DOM                                                                              |
| `baseUrl`      | `string`                       |          | `"https://embed.oneschema.co"`              | The base URL for the iframe. By default uses OneSchema's production instance                                                                  |

<!-- END GENERATED importer-init-options -->

### Options set at initialization or at launch

Pass either `userJwt` + `templateKey`, or a `sessionToken` created through the
API.

<!-- BEGIN GENERATED importer-launch-options -->

Launch with a user JWT and a template key:

| Option                   | Type                         | Required | Default | Description                                                                                  |
| ------------------------ | ---------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------- |
| `userJwt`                | `string`                     | yes      |         | The JSON web token for the user importing data                                               |
| `templateKey`            | `string`                     | yes      |         | The key for the template that data will be imported for. Setup inside OneSchema before using |
| `templateOverrides`      | `OneSchemaTemplateOverrides` |          |         | Template overrides to modify the behavior of the base template                               |
| `importConfig`           | `ImportConfig`               |          |         | The configuration for how data should be imported from OneSchema                             |
| `customizationKey`       | `string`                     |          |         | Key for a customization setup in OneSchema                                                   |
| `customizationOverrides` | `ImporterCustomization`      |          |         | Customization options for how OneSchema will behave                                          |
| `eventWebhookKeys`       | `string[]`                   |          |         | Event webhooks that should be used during an import session                                  |

Or, instead of those, with a session token created through the API:

| Option         | Type     | Required | Default | Description                                                              |
| -------------- | -------- | -------- | ------- | ------------------------------------------------------------------------ |
| `sessionToken` | `string` | yes      |         | A token for a session created through the API for initializing OneSchema |

<!-- END GENERATED importer-launch-options -->

### Events

<!-- BEGIN GENERATED importer-events -->

| Event           | Listener arguments      | Description                                                                                                                             |
| --------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `page-loaded`   | `Record<string, never>` | The embedded importer page finished loading behind the scenes                                                                           |
| `launched`      | `OneSchemaLaunchStatus` | The import session was launched, or launching it failed                                                                                 |
| `success`       | `OneSchemaImportResult` | The user finished importing. For `local` imports the data is the payload, for `webhook` imports it summarizes the delivery              |
| `cancel`        | none                    | The user cancelled the import                                                                                                           |
| `error`         | `OneSchemaError`        | Something went wrong. `severity` is `fatal` when the session cannot continue                                                            |
| `user-activity` | none                    | The user interacted with the importer. Throttled to once every 30 seconds, and useful for resetting idle timers in the host application |

<!-- END GENERATED importer-events -->

## Documentation

Please see [📚 OneSchema's documentation](https://docs.oneschema.co/) for [📒 API reference](https://docs.oneschema.co/docs/javascript#api-reference) and other helpful guides.
