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
pnpm add @oneschema/importer eventemitter3@^4.0.7
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

// launch() resolves once the import session is running, and rejects with a
// OneSchemaLaunchFailure as soon as the failure is knowable
try {
  const { embedInitId, sessionToken, embedId } = await importer.launch()
} catch (failure) {
  // failure is { error, message, embedInitId, status, data, cause }
}

// OR
// pass overrides and values not specified at creation time:
try {
  await importer.launch({
    templateKey: "YOUR_TEMPLATE_KEY",
    userJwt: "YOUR_USER_JWT",
    importConfig: { type: "local" },
  })
} catch (failure) {
  // handle the launch failure
}

importer.on("success", (result) => {
  // result.type is "local", "file-upload" or "webhook"
  if (result.type === "webhook") {
    // result.eventId, result.responses
  } else {
    // result.data
  }
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

Each instance owns its own iframe, so several importers can coexist on a page. Mount one in a specific container by passing `parent`:

```javascript
const importer = oneschemaImporter({
  clientId: "YOUR_CLIENT_ID",
  parent: document.querySelector("#import-container"),
})
```

### Launch status

`importer.status` reports where an instance is in its lifecycle: `idle` before the first launch, after `close()` and after a launch fails, `launching` while the import session is starting, `launched` once the embed is running, and `destroyed` after `destroy()`.

`launch()` returns a promise that resolves with `{ embedInitId, sessionToken, embedId }` only once the embed reports the import session is running. It rejects with a `OneSchemaLaunchFailure` as soon as the failure is knowable — invalid or missing parameters, a destroyed instance, a launch the embed rejected, a `close()`/`destroy()` or a newer `launch()` that abandoned it, and `initTimeoutMs` expiring before the session started. `failure.error` is a `OneSchemaLaunchError`, `failure.status` and `failure.data` are the HTTP status and error body when OneSchema's API rejected the launch, and `failure.cause` is the raw payload or exception the failure came from. A failure the host did not ask for also fires a `launched` event carrying the same `embedInitId`, so a support report can name one launch; a `Cancelled` rejection does not, since `close()`, `destroy()` and a newer `launch()` are the host's own doing.

`embedInitId` identifies one launch attempt, not one iframe: a launch that replaces another reuses the iframe and gets a new id. The embed echoes it on every reply, and the importer drops a reply that names a different attempt or names none, so a replacement launch is never resolved with the session of the launch it replaced. Replies are also only accepted from the `baseUrl` origin, the one the importer posts to. See [LAUNCH-SEQUENCE.md](LAUNCH-SEQUENCE.md).

`initTimeoutMs` (20 seconds by default) is the deadline for the whole launch, not only for the acknowledgement: the importer re-sends its initialization message every 500 ms until the embed acknowledges it, and the deadline keeps running after that until the session starts. So an iframe the browser blocked, and an embed that acknowledges the initialization but never reports a running session, both reject with `OneSchemaLaunchError.Timeout`. Raise `initTimeoutMs` for hosts on slow or distant connections; it cannot be turned off, since `0` or any other value that cannot be a deadline falls back to the default rather than leaving `launch()` pending forever.

### Handling the end of a session

The `success` and `cancel` handlers are awaited: an `async` handler holds the resume token and `autoClose` until it settles, so the importer stays open while the host is still shipping the rows, and a handler that throws or rejects is reported as an `error` event with the exception as `error.cause` instead of an unhandled rejection.

```js
importer.on("success", async (result) => {
  await fetch("/imports", { method: "POST", body: JSON.stringify(result.data) })
})
```

`handlerTimeoutMs` (30 seconds by default) bounds that wait. A handler that has not settled by the deadline gets an `error` event, the session is cleaned up without it, and the eventual failure is still reported when it arrives. Raise it for handlers that talk to a slow or distant backend. `0` waits forever, which brings back the failure mode the bound exists for: a handler that never settles leaves the importer open with a resume token for a session the user already finished.

## API reference

The tables below are generated from the TypeScript types by
`yarn docs:api` — edit the JSDoc in `src/config.ts`, not the tables.

### Options set at initialization

<!-- BEGIN GENERATED importer-init-options -->

| Option             | Type                           | Required | Default                        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------ | -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clientId`         | `string`                       | yes      |                                | The client id from your OneSchema developer dashboard                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `devMode`          | `boolean`                      |          | `false`                        | Whether to launch the importer in dev mode, which shows the iframe even when launching fails. Defaults to `false`; wire it to your own build condition to enable it during development                                                                                                                                                                                                                                                                                                                                                                                                            |
| `className`        | `string`                       |          | `"oneschema-iframe"`           | CSS class for the iframe                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `styles`           | `Partial<CSSStyleDeclaration>` |          |                                | CSS Styles to be applied directly to the iframe                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `languageCode`     | `string`                       |          |                                | Optional language code (like 'en' or 'zh') to force importer language By default, will use user's set language. Requires enterprise licensing                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `parent`           | `HTMLElement`                  |          |                                | The DOM element the iframe should be appended to By default appends to document.body                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `saveSession`      | `boolean`                      |          | `true`                         | Whether to save session information to local storage and enable resuming                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `autoClose`        | `boolean`                      |          | `true`                         | Whether to close the importer when complete                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `manageDOM`        | `boolean`                      |          | `true`                         | Whether the class should create and append the iframe to the DOM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `baseUrl`          | `string`                       |          | `"https://embed.oneschema.co"` | The base URL for the iframe. By default uses OneSchema's production instance                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `initTimeoutMs`    | `number`                       |          | `20000`                        | How long a launch may stay pending before `launch()` rejects with `OneSchemaLaunchError.Timeout`, in milliseconds. The deadline covers the whole launch, not only the init acknowledgement. Raise it for hosts on slow or distant connections. The deadline cannot be turned off: `0`, a negative number and a non-finite number all fall back to the default, because a launch that never settles cannot be reported. Defaults to 20000                                                                                                                                                          |
| `handlerTimeoutMs` | `number`                       |          | `30000`                        | How long the importer waits for the `success` and `cancel` handlers of the host to settle before it clears the resume token and applies `autoClose`, in milliseconds. Raise it for handlers that ship rows to a slow or distant backend: a handler that has not settled by the deadline gets an `error` event and the session is cleaned up without it. `0` waits forever, which reintroduces the stranded-embed failure mode where a handler that never settles leaves the importer open with a stale resume token. A negative or non-finite number falls back to the default. Defaults to 30000 |

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

| Event           | Listener arguments      | Description                                                                                                                                                                                                                                                                                                                     |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page-loaded`   | `Record<string, never>` | The embedded importer page finished loading behind the scenes                                                                                                                                                                                                                                                                   |
| `launched`      | `OneSchemaLaunchEvent`  | The import session was launched, or launching it failed                                                                                                                                                                                                                                                                         |
| `success`       | `OneSchemaImportResult` | The user finished importing. For `local` imports the data is the payload, for `webhook` imports it summarizes the delivery. Awaited: a handler returning a promise holds the resume token and `autoClose` until it settles, bounded by `handlerTimeoutMs`, and a handler that throws or rejects is reported as an `error` event |
| `cancel`        | none                    | The user cancelled the import. Awaited on the same terms as `success`                                                                                                                                                                                                                                                           |
| `error`         | `OneSchemaError`        | Something went wrong. `severity` is `fatal` when the session cannot continue                                                                                                                                                                                                                                                    |
| `user-activity` | none                    | The user interacted with the importer. Throttled to once every 30 seconds, and useful for resetting idle timers in the host application                                                                                                                                                                                         |

<!-- END GENERATED importer-events -->

## Migrating from 0.7

[MIGRATING-0.8.md](https://github.com/oneschema/sdk/blob/main/MIGRATING-0.8.md) walks through the whole 0.7.7 → 0.8 hop, package by package, with a codemod for the mechanical parts. In short:

- `parentId` is gone in favor of `parent`, which takes the element itself. `parentId` was resolved once when the importer was constructed, so it silently fell back to `document.body` when the container was not in the DOM yet.
- Each importer instance now creates and removes its own iframe instead of sharing a single `_oneschema-iframe` element. Anything that looked that element up by id should keep a reference to `importer.iframe` instead.
- The internal `_hasAttemptedLaunch` field is gone; use `importer.status` instead.
- `launch()` and `launchSession()` return a promise instead of a `{ success }` object. Replace `const { success } = importer.launch()` with `await importer.launch()` in a `try`/`catch`, or attach a `.catch()`. Every failure the embed or the launch deadline produces still fires the `launched` event, so event-driven hosts keep working, but an unhandled rejection is reported by the browser — attach a handler even when the event is what you act on. A launch the host abandons itself — `close()`, `destroy()` or a newer `launch()` — only rejects its promise with `OneSchemaLaunchError.Cancelled`; it fires no `launched` event, since the host already knows it ended the attempt.
- A blocked or unresponsive iframe no longer emits a `fatal` `error` event for the launch itself; it rejects the `launch()` promise with `OneSchemaLaunchError.Timeout` once `initTimeoutMs` has passed without the session starting. The `error` event still carries everything the embed reports once a session is running.
- The `success` and `cancel` handlers are now awaited, bounded by `handlerTimeoutMs`. Two things are observable: `autoClose` runs after the handler instead of before it, so a slow handler delays closing the importer, and an exception a handler used to throw into the host's own error boundary is delivered to the `error` event instead.
- The `success` event payload is tagged: `{ type: "local" | "file-upload", data }` for imports the host receives, and `{ type: "webhook", eventId, responses }` for webhook deliveries. Read `result.data` instead of the untagged payload, and branch on `result.type` rather than checking which keys are present.

## Documentation

Please see [📚 OneSchema's documentation](https://docs.oneschema.co/) for [📒 API reference](https://docs.oneschema.co/docs/javascript#api-reference) and other helpful guides.

[LAUNCH-SEQUENCE.md](LAUNCH-SEQUENCE.md) diagrams what the SDK and the embed exchange from construction until the user can pick a file, including the launch deadline and how overlapping launches are told apart.
