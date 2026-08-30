<p align="center">
  <a href="https://www.oneschema.co/">
    <img src="https://uploads-ssl.webflow.com/62902d243ad8aef519be0d3e/62902d243ad8ae4014be0e97_oneschema-256.png" height="128">
    <h1 align="center">OneSchema Importer</h1>
  </a>
</p>

A tool for embedding OneSchema into your application with React. This library contains a React component which will allow you to add an iframe to your application which can open OneSchema and import data into your application.

## Getting Started

### Installation

You can install this package with npm:

```bash
npm i --save @oneschema/react @oneschema/importer
```

`@oneschema/importer` is a peer dependency, so your project decides which core version the component uses.

With pnpm, install `eventemitter3` alongside them:

```bash
pnpm add @oneschema/react @oneschema/importer eventemitter3@^4.0.7
```

The importer class this component wraps extends `EventEmitter` from `eventemitter3`, so that type is part of the published declarations. pnpm keeps each package's dependencies isolated instead of hoisting them, so your build cannot resolve `eventemitter3` unless it is declared in your project too. npm and yarn hoist it for you.

### Sample usage

```javascript
import React, { useState } from "react"
import OneSchemaImporter from "@oneschema/react"

function OneSchemaExample() {
  const [isOpen, setIsOpen] = useState(false)

  const handleData = (data) => {
    console.log(data)
  }

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Import</button>

      <OneSchemaImporter
        /* managing state from your application */
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        /* required config values */
        clientId={clientId}
        userJwt={token}
        templateKey={templateKey}
        /* optional config values */
        importConfig={{ type: "local", metadataOnly: false }}
        devMode={process.env.NODE_ENV !== "production"}
        className="oneschema-importer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
        }}
        inline={false}
        /* handling results */
        onSuccess={handleData}
        onCancel={() => console.log("cancelled")}
        onError={(error) => console.log(error)}
      />
    </div>
  )
}
```

## API reference

The tables below are generated from the TypeScript types by `yarn docs:api` —
edit the JSDoc in `src/OneSchemaImporter.tsx` and the importer's `src/config.ts`,
not the tables.

### Props

Every option of [`@oneschema/importer`](https://www.npmjs.com/package/@oneschema/importer)
can also be passed as a prop; they are forwarded to the importer as launch
params.

<!-- BEGIN GENERATED react-props -->

| Prop             | Type                                      | Required | Default | Description                                                                                                                                                                                             |
| ---------------- | ----------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isOpen`         | `boolean`                                 | yes      |         | Whether to show the iframe or not                                                                                                                                                                       |
| `inline`         | `boolean`                                 |          | `true`  | Whether the iframe should be rendered in the component tree. When false, the iframe is appended to document.body                                                                                        |
| `clientId`       | `string`                                  | yes      |         | The client id from your OneSchema developer dashboard                                                                                                                                                   |
| `className`      | `string`                                  |          |         | CSS class for the iframe                                                                                                                                                                                |
| `devMode`        | `boolean`                                 |          |         | Whether to launch the importer in dev mode, which shows the iframe even when launching fails                                                                                                            |
| `languageCode`   | `string`                                  |          |         | Language code (like 'en' or 'zh') to force the importer language. By default, uses the user's set language. Requires enterprise licensing                                                               |
| `saveSession`    | `boolean`                                 |          |         | Whether to save session information to local storage and enable resuming                                                                                                                                |
| `baseUrl`        | `string`                                  |          |         | The base URL for the iframe. By default uses OneSchema's production instance                                                                                                                            |
| `style`          | `React.CSSProperties`                     |          |         | CSS styles that should be applied to the iframe                                                                                                                                                         |
| `onRequestClose` | `() => void`                              |          |         | Handler for when the importer wants to close should set isOpen prop to false                                                                                                                            |
| `onSuccess`      | `(data: OneSchemaImportResult) => void`   |          |         | Handler for when the importing flow completes successfully                                                                                                                                              |
| `onCancel`       | `() => void`                              |          |         | Handler for when the importing flow is cancelled by user                                                                                                                                                |
| `onError`        | `(error: OneSchemaError) => void`         |          |         | Handler for when an error occurs during the import                                                                                                                                                      |
| `onPageLoad`     | `() => void`                              |          |         | Handler for when the embedded Importer page is loaded behind the scenes.                                                                                                                                |
| `onLaunched`     | `(result: OneSchemaLaunchStatus) => void` |          |         | Handler for when the importer is launched (aka is ready to be shown) Or when launching fails, based on result                                                                                           |
| `onUserActivity` | `() => void`                              |          |         | Handler for when user activity is detected inside the importer iframe. Useful for resetting session idle timers in the host application. This event is throttled (fired at most once every 30 seconds). |

<!-- END GENERATED react-props -->

### Launch props

These are forwarded to the importer when `isOpen` becomes true.

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

Each event below is exposed as the matching `on*` prop.

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

Please see [📚 OneSchema's documentation](https://docs.oneschema.co/) for [📒 API reference](https://docs.oneschema.co/docs/react#api-reference) and other helpful guides.
