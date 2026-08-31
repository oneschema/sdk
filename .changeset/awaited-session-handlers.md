---
"@oneschema/importer": major
---

Await the `success` and `cancel` handlers before ending an import session

A handler returning a promise now holds the resume token clear and `autoClose` until it settles, so an `async` handler that ships the rows to the host's own backend finishes with the importer still open instead of racing the SDK's own cleanup. A handler that throws or rejects is reported as an `error` event carrying the exception as `error.cause`, rather than surfacing as an unhandled rejection, and the cleanup runs either way — with the default bound in place, no handler can leave the importer open with a resume token for a session the user already finished. A terminal message the embed repeats while a handler is still running is ignored, so the handler cannot be run twice for one session.

`handlerTimeoutMs` (default `30000`) bounds the wait. A handler that has not settled by the deadline gets an `error` event, the session is cleaned up without it, and the handler's eventual failure is still reported when it arrives. Raise it for handlers on slow or distant connections. `0` waits forever, which is supported but reintroduces the stranded-embed failure mode the bound exists for: with no bound, a handler that never settles does keep the importer open with its resume token.

Each handler is timed and reported on its own, so one handler's failure neither hides another's nor cuts short another's timeout.

Two consequences are observable for hosts that do not change any code: `autoClose` now runs after the `success`/`cancel` handler rather than before it, so a slow handler delays closing the importer, and an exception that used to reach the host's own error boundary is delivered to the `error` event instead.
