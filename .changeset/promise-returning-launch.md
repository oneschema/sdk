---
"@oneschema/importer": major
---

`launch()` and `launchSession()` return a promise that resolves with `{ embedInitId, sessionToken, embedId }` once the embed reports the import session is running, instead of a synchronous `{ success }` object that only said the parameters were accepted.

The promise rejects with a `OneSchemaLaunchFailure` as soon as the failure is knowable: missing or invalid parameters, a destroyed instance, a launch the embed rejected, a `close()`, `destroy()` or newer `launch()` that abandoned the attempt, and the new `initTimeoutMs` expiring before the session started. `failure.error` is a `OneSchemaLaunchError`, `failure.cause` carries the embed's raw payload, and `failure.embedInitId` is repeated on the `launched` event for the same attempt, so a single launch can be named in a support report.

`initTimeoutMs` (default `20000`, the previous fixed retry budget) is the deadline for the whole launch: the initialization message is retried until the embed acknowledges it, and the deadline keeps running until the session starts, so an embed that acknowledges but never reports a running session times out too. A blocked or unresponsive iframe now rejects the promise instead of emitting a `fatal` `error` event.

The `success` event payload is discriminated: `{ type: "local" | "file-upload", data }` for imports delivered to the host, and `{ type: "webhook", eventId, responses }` for webhook deliveries, replacing the untagged `Record<string, any>`.

`embedInitId` names one launch attempt and is minted before the embed's first request, so it exists even when no session is ever created. The embed echoes it on every reply, and a reply naming another attempt — or naming none — is dropped: a launch that replaced another can otherwise be resolved with the replaced session's token. An embed deployment that does not echo the field cannot be correlated, and no SDK-side fallback is provided.

Messages are now accepted only from the `baseUrl` origin, matching the `targetOrigin` the importer has always posted to, so a frame that navigated away from the embed cannot answer for it.

Every call site must handle the rejection — `await` inside `try`/`catch`, or attach a `.catch()` when the promise is ignored. Every failure the embed or the launch deadline produces still fires the `launched` event, but an unhandled rejection is reported by the browser. A launch the host abandons itself — `close()`, `destroy()` or a newer `launch()` — only rejects, with `OneSchemaLaunchError.Cancelled`.
