# Launch sequence

The reference for what `@oneschema/importer` and the embed exchange from construction until the user can pick a file. Every arrow is a `window.postMessage` between the host page and the embed iframe, except the host-facing calls and events, which are the SDK's own API. Keep this diagram in step with `src/importer.ts` — it is the expected behavior a bug report is measured against.

## Happy path

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Host as Host page
    participant SDK as OneSchemaImporter
    participant Embed as Embed iframe (/embed-launcher)

    Host->>SDK: new OneSchemaImporter(params)
    SDK->>SDK: create iframe, hidden (manageDOM), status "idle"
    SDK->>Embed: load /embed-launcher?embed_client_id&dev_mode&lng
    Embed-->>SDK: onload
    Embed-->>SDK: page-loaded
    SDK-->>Host: "page-loaded" event

    Host->>SDK: launch(params)
    SDK->>SDK: status "launching", arm initTimeoutMs deadline
    Note over SDK: nothing is posted until the iframe has loaded
    SDK->>Embed: init (or init-session), with embedInitId
    loop every LAUNCH_RETRY_DELAY_MS until acknowledged
        SDK->>Embed: init (same embedInitId)
    end
    Embed-->>SDK: init-received (echoing embedInitId)
    SDK->>SDK: stop retrying

    Embed->>Embed: validate the JWT, create or resume the session
    Embed-->>SDK: launched (embedInitId, sessionToken, embedId)
    SDK->>SDK: status "launched", clear the deadline, persist the resume token
    SDK-->>Host: "launched" event { success: true, embedInitId, sessionToken, embedId }
    SDK->>Embed: show the iframe
    SDK-->>Host: launch() resolves with OneSchemaLaunchInfo
    Embed-->>User: upload pane, ready for a file
```

## What the deadline covers

`initTimeoutMs` (20 s by default) is armed by `launch()` and cleared only when the launch settles, so it bounds the whole sequence above, not just the acknowledgement:

```mermaid
sequenceDiagram
    autonumber
    participant Host as Host page
    participant SDK as OneSchemaImporter
    participant Embed as Embed iframe

    Host->>SDK: launch(params)
    SDK->>SDK: arm initTimeoutMs

    alt the iframe never loads (blocked, offline, CSP)
        Note over SDK,Embed: no init message is ever posted
        SDK-->>Host: "launched" { success: false, embedInitId, error: Timeout }
        SDK-->>Host: launch() rejects with OneSchemaLaunchError.Timeout
    else the embed never acknowledges
        loop until the deadline
            SDK->>Embed: init
        end
        SDK-->>Host: "launched" { success: false, embedInitId, error: Timeout }
        SDK-->>Host: launch() rejects with OneSchemaLaunchError.Timeout
    else the embed acknowledges but no session starts
        Embed-->>SDK: init-received
        Note over SDK: retries stop, the deadline keeps running
        SDK-->>Host: "launched" { success: false, embedInitId, error: Timeout }
        SDK-->>Host: launch() rejects with OneSchemaLaunchError.Timeout
    else the embed rejects the launch
        Embed-->>SDK: launch-error (message)
        SDK-->>Host: "launched" { success: false, embedInitId, error: LaunchError, status, data }
        SDK-->>Host: launch() rejects with OneSchemaLaunchError.LaunchError
    end
```

A launch that fails before anything is posted — a missing `userJwt` or `templateKey`, or a destroyed instance — rejects synchronously with `MissingJwt`, `MissingTemplate`, `MissingSessionToken` or `Destroyed`, and fires the same `launched` failure event.

## Overlapping launches

Only one launch is in flight per instance. `close()`, `destroy()` and a newer `launch()` abandon the pending one: its promise rejects with `OneSchemaLaunchError.Cancelled` and no `launched` event fires, because the host caused it. Replies from the abandoned attempt are then attributed by embed init id, so they cannot settle or disturb the current one:

```mermaid
sequenceDiagram
    autonumber
    participant Host as Host page
    participant SDK as OneSchemaImporter
    participant Embed as Embed iframe

    Host->>SDK: launch(A)
    SDK->>Embed: init (embedInitId A)
    Host->>SDK: launch(B)
    SDK-->>Host: launch(A) rejects with Cancelled
    SDK->>Embed: init (embedInitId B)

    Embed-->>SDK: init-received (A)
    SDK->>SDK: ignored, B keeps retrying
    Embed-->>SDK: launched (A)
    SDK->>SDK: ignored, no event and no state change
    Embed-->>SDK: init-received (B)
    Embed-->>SDK: launched (B)
    SDK-->>Host: "launched" { success: true, embedInitId: B }
    Embed-->>SDK: complete (A)
    SDK->>SDK: ignored, A's session was replaced
```

Every reply the embed sends echoes the `embedInitId` of the init message it answers, and a reply that names a different attempt — or names none at all — is dropped rather than attributed to the attempt in flight, since it may carry the session of a launch this one replaced. A reply is only read at all when it comes from this instance's iframe _and_ from the `baseUrl` origin the init messages are posted to.

## Once the session is running

The launch sequence ends where the import does not: the running session reports `user-activity`, `error`, `complete` (the tagged `success` event) and `cancel`, and `reset-embed` restarts it in place. Those are documented in [README.md](README.md) rather than here.
