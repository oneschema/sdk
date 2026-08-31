---
name: testing-sdk-harnesses
description: Run the oneschema/sdk local harnesses (packages/importer on :4242, packages/importer-react on :4243) against the staging embed backend and drive a real end-to-end import in a browser. Use when verifying importer SDK behavior (iframes, parent/parentId, status, React rerender warnings) without the local oneschema/oneschema stack.
---

# Testing the OneSchema JS/React SDK harnesses against staging

The default harnesses in `TESTING.md` point at a local backend (`embed.localschema.co:9450`) that
requires the separate `oneschema/oneschema` stack. When that stack is not running, point the
harness `baseUrl` at staging instead — no backend needs to run locally.

## Staging setup that worked

- `baseUrl`: `https://embed.devschema.co`
- Embed client id (ci org on devschema): `60fa33a3-55af-4258-9994-647a405b64dd`
- Template key: `crm_test`
- Staging embed CSP `frame-ancestors` already allows `http://localhost:4242`, `:4243`, `:4252`,
  `:4253`. Verify with `curl -sI 'https://embed.devschema.co/embed-launcher?embed_client_id=<id>'`
  and look at `content-security-policy` before assuming an allowed-domain problem.
- The External API on `https://api.devschema.co` authenticates with the **`X-API-KEY`** header, not
  `Authorization: Bearer`. A Bearer token returns `401 No auth credentials provided`.
- User JWTs are HS256 with claims `{ iss: <embed_client_id>, user_id: "<anything>" }` — same shape as
  `oneschema/browser-tests/tests/helpers/embed-jwt.ts`. Sign it in a tiny local server (e.g. port 4300) that reads the secret from the environment so the harness can `fetch()` a fresh token and the
  secret never lands in a file or in the bundle.

## Harnesses

```bash
cd packages/importer && yarn test        # serves test/index.html on :4242 (edit test/index.ts)
cd packages/importer-react && yarn test  # serves the React page on :4243
```

Run Parcel from the **package** directory — the workspace root has no `parcel` script, and
`yarn workspace @oneschema/importer test` from the root starts the same dev server (it does not run the
unit suite; that is `test:ci`). If a dev server dies with
`Error: Unable to deserialize cloned data due to invalid or unsupported version.`, delete the
package's `.parcel-cache`. `lsof` is not installed on the Devin box — find and kill harness servers
with `ss -ltnp` / `pkill -f`.

To exercise local core changes from the React package, temporarily change the import in
`packages/importer-react/src/OneSchemaImporter.tsx` from `@oneschema/importer` to `../../importer/src`
and **revert it before finishing** (`git checkout -- packages/importer-react/src`).

A useful harness shape for multi-instance work: several importer instances side by side in their own
containers, a visible status readout polled from `importer.status`, buttons for
launch/close/destroy per instance, an "inspect iframes" button that prints
`[...document.querySelectorAll('iframe[id^=_oneschema-iframe]')].map(f => f.id + ' -> ' + f.parentElement.id)`,
and a log panel that mirrors `console.warn` / `console.error` plus SDK events. Mirroring the console
into the page is what makes warnings visible in a screen recording without opening devtools.

## Uploading a file into the embed iframe (automation limitation)

The upload step lives inside a **cross-origin** iframe, so the file `<input>` is not reachable from
the top document, and clicking the drop zone does not open a usable native file chooser under browser
automation. Workaround that worked: attach over CDP to the iframe target and inject the file with
`Runtime.evaluate` (find the Chrome debug port with
`ps aux | grep -o 'remote-debugging-port=[0-9]*'`, list targets at `http://127.0.0.1:<port>/json`,
pick the `type: "iframe"` targets whose URL contains the embed host, then set
`input.files` from a `DataTransfer` and dispatch `input`/`change`). Node 24 has a global `WebSocket`,
so no npm dependency is needed. All subsequent steps (header row, mapping, review, Import) are
clickable by **coordinates** in the top page — coordinate clicks are routed into the iframe fine.
Note that mouse-wheel scrolling _inside_ the OOPIF may not work; prefer a narrow CSV whose columns
all auto-map (e.g. exactly `First Name,Last Name,Email,Phone` for `crm_test`) so no scrolling is
needed on the mapping screen.

Iframe targets are not distinguishable by URL; identify which instance is which by injecting into one
and observing which panel advances in the UI.

## Testing promise-based `launch()` (0.8 API) and its failure paths

`launch()`/`launchSession()` return `Promise<OneSchemaLaunchInfo>` and reject with
`OneSchemaLaunchFailure`. To make the behaviour visible in a recording, have the harness log the
**elapsed ms since the button click** on every line, plus `instanceof OneSchemaLaunchFailure`,
`OneSchemaLaunchError[failure.error]`, `embedInitId`, `status`, and a running counter of SDK `error`
events and `window.onunhandledrejection` hits in the page header.

Recipes for each failure path:

- **`LaunchError`**: reuse the real client/template but corrupt the JWT signature; staging answers
  `launch-error` in ~100ms with a 422 and a message, so this also proves the rejection is prompt
  rather than waiting for `initTimeoutMs`.
- **`Timeout`**: run a tiny local HTTP server (e.g. `:4400`) that serves a page which loads but never
  posts the init acknowledgement, point that instance's `baseUrl` at it, and set
  `initTimeoutMs: 2000`. Expect rejection at ~2000ms, a `console.error` about a blocked iframe, and
  **no** SDK `error` event.
- **`Cancelled`**: staging can resolve a launch in **under 200ms**, so a `close()` scheduled 300ms
  after `launch()` arrives too late and the promise resolves instead. Use a delay of ~25ms (or call
  `close()` in the same tick) and assert the log shows `status=launching` at close time.

For the React wrapper's swallowed rejections, add a **canary button** that does
`Promise.reject(new Error("canary"))` first: it proves the page's unhandled-rejection listener works,
so a later count that stays at the canary baseline is real evidence rather than a silent detector.
Note Parcel's dev overlay pops up on an unhandled rejection — dismiss it by clicking its `×`
(pressing Escape did not work) before continuing.

## Verifying iframe-URL construction

When the change is about which query params the SDK puts on the embed URL, log `iframe.src`
**verbatim** for every instance and assert on the exact string rather than on behaviour. Check
explicitly for the stringified-undefined shape (`dev_mode=undefined`): dropping a key from
`DEFAULT_PARAMS` without an `!== undefined` guard produces it, and a casual "no default" check still
passes. Note a DOM dump shows `&amp;` for `&` purely from HTML escaping.

## Diagnosing a launch that times out

Add a raw `window.addEventListener("message")` observer that logs `messageType` and `embedInitId` for
every reply **before** the SDK's `embedInitId` gating. That is what separates "the embed posted
nothing" from "the SDK dropped a reply it did not recognise". Useful baseline observations from
staging: `init-received`, the legacy misspelled `init-recieved`, `launched` and `complete` all echo
the SDK's `embedInitId`, while `page-loaded`, `user-activity` and the generic `error` reply carry
none.

A `devMode: true` launch against staging has been seen to reject with `Timeout` at `initTimeoutMs`
even though the embed had visibly rendered, and then succeed in ~300ms on every later attempt. Run
any `devMode: true` case at least twice before reporting a timeout as a real finding.

Also useful when a launch failure is under test: with `devMode` unset the embed posts a generic
`error` (`severity: "fatal"`) _in addition to_ `launch-error`, so the harness's SDK-error counter
reads 1 on that path; under `devMode: true` it posts none.

## Devin Secrets Needed

- `CI_OS_API_KEY` — External API key for the `ci` org on devschema (used with `X-API-KEY`).
- `OS_E2E_TESTS_CI_DEVSCHEMA_EMBED_SECRET_KEY` (repo `oneschema/oneschema`) — embed secret for
  signing the user JWT.

## Cleanup

Revert every harness edit before finishing:
`git checkout -- packages/importer/test packages/importer-react/test packages/importer-react/src`
and delete any scratch plan/notes files, then confirm `git status --porcelain` is clean.
