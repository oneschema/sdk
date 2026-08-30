---
"@oneschema/importer": major
---

`launch()` and `launchSession()` return a promise that resolves with `{ correlationId, sessionToken, embedId }` once the embed reports the import session is running, instead of a synchronous `{ success }` object that only said the parameters were accepted.

The promise rejects with a `OneSchemaLaunchFailure` as soon as the failure is knowable: missing or invalid parameters, a destroyed instance, a launch the embed rejected, a `close()`, `destroy()` or newer `launch()` that abandoned the attempt, and the new `initTimeoutMs` expiring before the session started. `failure.error` is a `OneSchemaLaunchError`, `failure.cause` carries the embed's raw payload, and `failure.correlationId` is repeated on the `launched` event for the same attempt, so a single launch can be named in a support report.

`initTimeoutMs` (default `20000`, the previous fixed retry budget) is the deadline for the whole launch: the initialization message is retried until the embed acknowledges it, and the deadline keeps running until the session starts, so an embed that acknowledges but never reports a running session times out too. A blocked or unresponsive iframe now rejects the promise instead of emitting a `fatal` `error` event.

The `success` event payload is discriminated: `{ type: "local" | "file-upload", data }` for imports delivered to the host, and `{ type: "webhook", eventId, responses }` for webhook deliveries, replacing the untagged `Record<string, any>`.

Every call site must handle the rejection — `await` inside `try`/`catch`, or attach a `.catch()` when the promise is ignored. Every failure still fires the `launched` event, but an unhandled rejection is reported by the browser.
