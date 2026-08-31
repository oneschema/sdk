# Migrating to 0.8

`0.8` is one hop from `0.7.7`. It carries every breaking change we intend to make in this cycle, so a host migrates once: nothing removed here is kept as a shim, and nothing is deprecated first and removed later.

The theme is that the SDK now tells you what actually happened. `launch()` resolves when the import session is running and rejects, with a typed error, as soon as a failure is knowable; the `success` payload says how the data was delivered; your `success` and `cancel` handlers are awaited before the importer cleans up; and the wrappers can own the importer's visibility so your application does not have to.

`@oneschema/filefeeds` and `@oneschema/filefeeds-react` are legacy, frozen at `0.5.3`, and unaffected by any of this.

Run the codemod first — it does the mechanical renames — then work through the sections below for the call sites TypeScript flags. See [Codemod](#codemod) at the end.

## At a glance

| `0.7.7`                                           | `0.8`                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `const { success } = importer.launch()`           | `await importer.launch()`, rejecting with `OneSchemaLaunchFailure`               |
| `onSuccess: (data) => …`, `data` untyped          | `onSuccess: (result) => …`, narrow on `result.type` before reading `result.data` |
| an `async` handler ran unawaited                  | `success` and `cancel` are awaited, bounded by `handlerTimeoutMs`                |
| a blocked iframe reported a `fatal` `error` event | `launch()` rejects with `OneSchemaLaunchError.Timeout` after `initTimeoutMs`     |
| `parentId: "container"`                           | `parent: document.getElementById("container") ?? undefined`                      |
| `document.getElementById("_oneschema-iframe")`    | `importer.iframe`                                                                |
| `importer._hasAttemptedLaunch`                    | `importer.status`                                                                |
| `devMode` defaulted from `process.env.NODE_ENV`   | `devMode` defaults to `false`; pass it explicitly                                |
| React `isOpen` required                           | `isOpen` optional; omit it and launch through the component's `ref`              |

## Core importer

### `launch()` and `launchSession()` return a promise

They used to return `{ success }` synchronously, where `success: true` meant "the init message was queued" — a rejected JWT or a blocked iframe still looked like a successful launch until an event arrived later. They now return a promise that resolves with `OneSchemaLaunchInfo` (`embedInitId`, plus `sessionToken` and `embedId` once the embed reports them) when the session is actually running.

```javascript
// 0.7.7
const { success } = importer.launch()
if (!success) {
  showError()
}

// 0.8
try {
  const { sessionToken } = await importer.launch()
} catch (failure) {
  showError(failure.message)
}
```

Failures reject with `OneSchemaLaunchFailure`, an `Error` subclass carrying `error` (a `OneSchemaLaunchError`), `embedInitId`, and `status`/`data`/`cause` when the failure came from an API call or an embed payload:

```javascript
import { OneSchemaLaunchError } from "@oneschema/importer"

try {
  await importer.launch()
} catch (failure) {
  if (failure.error === OneSchemaLaunchError.Timeout) {
    // the iframe was blocked, or the embed never acknowledged the launch
  }
}
```

Every failure the embed or the launch deadline produces still fires the `launched` event, so an event-driven host keeps working — but the promise rejects either way, and an unhandled rejection is reported by the browser. Attach a handler even when the event is what you act on:

```javascript
importer.launch().catch(() => {
  // the launched event already reported this
})
```

The one exception is a launch the host abandons itself, through `close()`, `destroy()` or a newer `launch()`: it rejects with `OneSchemaLaunchError.Cancelled` and fires no `launched` event, since the host already knows it ended the attempt.

`initTimeoutMs` (default `20000`) bounds the whole launch. A launch that is still pending at the deadline rejects with `OneSchemaLaunchError.Timeout` — previously a blocked iframe surfaced as a `fatal` `error` event after the retry schedule ran out. The deadline cannot be turned off: `0`, a negative number and a non-finite number all fall back to the default, because a launch that never settles cannot be reported.

### The `success` payload is discriminated

`OneSchemaImportResult` was `Record<string, any>` and the payload's shape depended on the import strategy. It is now a union tagged with how the data was delivered:

```typescript
importer.on("success", (result) => {
  switch (result.type) {
    case "local":
    case "file-upload":
      return saveRows(result.data)
    case "webhook":
      return console.log(result.eventId, result.responses)
  }
})
```

Read `result.data` instead of the untagged payload, and branch on `result.type` rather than checking which keys are present. The tag comes from the configured `importConfig.type`, so a `local` import that reports no rows still arrives as `local`. `launchSession()` has no import config, so a server-created session falls back to the payload's shape and reports a file-upload delivery as `local`.

### `success` and `cancel` handlers are awaited

A handler returning a promise now holds the resume token and `autoClose` until it settles, bounded by `handlerTimeoutMs` (default `30000`; raise it for handlers that ship rows to a slow or distant backend, and `0` waits forever). Two things are observable in an existing integration:

- `autoClose` runs after the handler instead of before it, so a slow handler delays closing the importer.
- An exception a handler used to throw into the host's own error boundary is delivered to the `error` event instead, with the thrown value on `error.cause`.

```javascript
importer.on("success", async (result) => {
  if (result.type === "webhook") {
    return
  }

  await fetch("/import", { method: "POST", body: JSON.stringify(result.data) })
  // the importer closes after this resolves
})
```

A handler that has not settled by `handlerTimeoutMs` gets an `error` event and the session is cleaned up without it.

### `parentId` is gone

Pass the element itself. `parentId` was resolved once, at construction, so it silently fell back to `document.body` whenever the container was not in the DOM yet — the single most common cause of "the importer rendered in the wrong place".

```javascript
// 0.7.7
oneschemaImporter({ clientId, parentId: "oneschema-container" })

// 0.8
oneschemaImporter({
  clientId,
  parent: document.getElementById("oneschema-container") ?? undefined,
})
```

### Each instance owns its iframe

Instances no longer share a single `_oneschema-iframe` element. Anything that looked that element up by id should hold `importer.iframe` instead, and `destroy()` removes the iframe the instance created along with its window message listener.

### `status` replaces the underscore-prefixed internals

`_hasAttemptedLaunch`, `_launch`, `_initWithRetry` and `_resetSession` are no longer part of the published surface. `importer.status` — `"idle"`, `"launching"`, `"launched"` or `"destroyed"` — is the supported way to ask where an instance is in its lifecycle.

### `devMode` defaults to `false`

It used to default to `!!(process.env.NODE_ENV !== "production")`, evaluated in your bundle at import time, which both guessed at your intent and threw `ReferenceError: process is not defined` when the ESM build was loaded without a `process` shim (CDN, import maps, Deno, workers). Pass it explicitly, wired to your own build condition, if you want the iframe shown when a launch fails:

```javascript
oneschemaImporter({ clientId, devMode: import.meta.env.DEV })
```

### The embed must be on the matching version

The SDK stamps each launch attempt with an `embedInitId` and requires the embed to echo it, so a reply from an abandoned attempt cannot settle the attempt in flight, and it only accepts messages from the `baseUrl` origin. Both sides ship together: point `baseUrl` at a OneSchema deployment that carries the `0.8` protocol — the default production `baseUrl` does. A self-hosted or pinned embed that does not echo the field cannot be correlated, and every launch against it will time out.

[LAUNCH-SEQUENCE.md](packages/importer/LAUNCH-SEQUENCE.md) diagrams the whole handshake, including the deadline and how overlapping launches are told apart.

## `@oneschema/react`

`isOpen` is now optional. Omit it and the component is uncontrolled: launch it through the component's `ref`, and the importer closes itself when the import completes, the user cancels, or a fatal error occurs.

```jsx
const importer = useRef(null)

const launch = async () => {
  try {
    await importer.current.launch()
  } catch (failure) {
    console.error(failure)
  }
}

return (
  <>
    <button onClick={launch}>Import</button>
    <OneSchemaImporter
      ref={importer}
      clientId={clientId}
      userJwt={token}
      templateKey={templateKey}
      onSuccess={saveRows}
    />
  </>
)
```

The ref exposes `launch(launchParams?)`, which returns the importer's promise, `close(clean?)`, and a `status` getter.

Supplying `isOpen` keeps the controlled behavior unchanged, including `onRequestClose`, which is only called in that mode. The mode is fixed when the component mounts: switch a component between controlled and uncontrolled by remounting it, not by dropping the prop.

`onSuccess` and `onCancel` may return promises, which the importer awaits before it closes the session. Their listeners are registered once per importer and read through a ref, so an inline handler no longer causes listeners to be torn off and re-registered mid-emit — the reason an `onSuccess` defined in the render body could miss a `success` that landed on the same commit. Nothing changes in your code for this; if you added a `useCallback` purely to stabilize a handler's identity, it is no longer needed.

The duplicate-launch warning keys off the importer's `status` rather than the serialized launch params, so it no longer fires for a re-render that changed nothing.

## `@oneschema/vue`

Vue was already uncontrolled — the plugin hands you the core importer — so the change is `launch()`'s promise. Register handlers once in `setup` rather than inside the launch function, and handle the rejection:

```vue
<script setup lang="ts">
import { useOneSchemaImporter } from "@oneschema/vue"

const importer = useOneSchemaImporter()

importer.on("success", async (result) => {
  if (result.type !== "webhook") {
    await saveRows(result.data)
  }
})

const launch = () => importer.launch().catch(console.error)
</script>
```

The plugin destroys its importer when the app unmounts, releasing the window message listener and, under `manageDOM`, the iframe. `useOneSchemaImporter()` throws when the plugin was never installed instead of returning `undefined` typed as an importer.

## `@oneschema/angular`

`OneSchemaService` still extends the importer, so the change is `launch()`'s promise. Call it from a component method that handles the rejection rather than from a template expression, which would leave it unhandled:

```typescript
launch() {
  this.oneschema.launch().catch((failure) => console.error(failure))
}
```

`@oneschema/angular` depends on `@oneschema/importer` directly. If your application imports the core itself, widen your own dependency range to admit the version this wrapper requires.

## Codemod

An unpublished [jscodeshift](https://github.com/facebook/jscodeshift) transform handles the mechanical part. There is no package to install: check the repository out at the release tag and run the transform from disk, so you execute a reviewed revision rather than whatever `main` holds today (`jscodeshift` loads the transform into your Node process, so read it before you run it).

```bash
git clone --depth 1 --branch @oneschema/importer@0.8.0 \
  https://github.com/oneschema/sdk.git /tmp/oneschema-sdk

npx jscodeshift@0.15.2 \
  -t /tmp/oneschema-sdk/scripts/codemod-0.8.cjs \
  --parser=tsx \
  src/
```

It only touches what it can attribute to the importer: `parentId` inside the options object of a factory imported from an `@oneschema` package, `parentId` on a component imported from one, and `launch()`/`launchSession()` on a local bound to one. Anything else keeps its `parentId` or its `launch()` and gets a `TODO`. It rewrites `parentId` to `parent: document.getElementById(…) ?? undefined` (as an option and as a React prop, since `parent` is `HTMLElement | undefined` and `getElementById` can return `null`), unwraps the exact `const { success } = importer.launch(…)` into an `await` inside a `try`/`catch` where the enclosing function is already `async`, awaits a discarded `launch()` in an `async` function, and gives a discarded one in a synchronous function a `.catch()` that logs the failure for you to replace. Everything it cannot decide safely — a `success` payload read without a `type` check, a destructured `launch()` in a non-`async` function or one binding more than `success`, a launch call whose receiver it cannot attribute, a `_`-prefixed member — is left in place with a `TODO(oneschema-0.8)` comment. Every rewrite and every `TODO` is listed in the run's summary, so a plain-JavaScript codebase still gets the list of call sites to walk. Add `--dry --print` to preview without writing.

TypeScript flags the rest once the old types are gone, so a typed codebase does not need the codemod to find its call sites — only to save the typing.

## Checklist

- [ ] every `launch()` and `launchSession()` call site awaits the promise or attaches a `.catch()`
- [ ] `success` handlers narrow on `result.type`
- [ ] `parentId` replaced with `parent`
- [ ] `devMode` passed explicitly if you relied on it in development
- [ ] `handlerTimeoutMs` raised if your `success` handler can legitimately take longer than 30 seconds
- [ ] `baseUrl` points at a deployment carrying the `0.8` protocol
- [ ] React: `isOpen` kept only where you want controlled visibility, and `onRequestClose` removed where you do not
