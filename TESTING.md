# Testing the SDK locally

Use this guide when you make changes to the SDK, or to the main OneSchema repo
that affect the SDK. Test the JavaScript SDK and React SDK; Vue and Angular are
thin skins on top of the JavaScript SDK and usually do not need separate testing
if the JavaScript SDK is already covered. The React SDK has additional logic and
a large share of our customers, so test it **in addition** to the JavaScript SDK.

## Prerequisites

Install dependencies once from the repository root:

```sh
yarn install
```

Local SDK tests point at a running OneSchema backend. Make sure the Ruby server,
webpack server, and csvdb are all running before launching a test page.

## JavaScript SDK

Navigate to `packages/importer` and run the test server:

```sh
cd packages/importer
yarn test
```

This opens `http://localhost:4242` and renders `importer/test/index.html`, which
loads `importer/test/index.ts`. By default, the test page points at the local
OneSchema backend (for example, `http://embed.localschema.co:9450`).

- Make sure `localhost:4242` is in the allowed domains for the org you are
  testing with.
- Edit `packages/importer/test/index.ts` to test specific interactions or
  parameters.
- If you see caching issues, run `yarn build`.

> SDK changes are hot-reloaded automatically, but the OneSchema app is not. If
> you make changes in the main OneSchema repo, restart `yarn test` so they are
> reflected in the test page.

## React SDK

Navigate to `packages/importer-react` and run the test server:

```sh
cd packages/importer-react
yarn test
```

This serves the React test page on `http://localhost:4243`.

To test local changes to the underlying importer package from the React test
page, change the import in `packages/importer-react/src/OneSchemaImporter.tsx`:

```ts
import oneschemaImporter, {
  OneSchemaError,
  OneSchemaErrorSeverity,
  OneSchemaLaunchParamOptions,
  OneSchemaLaunchStatus,
} from "../../importer/src"
```

> Revert the import change back to `@oneschema/importer` before committing or
> publishing.

## Angular SDK

Navigate to `packages/importer-angular` and run the unit tests:

```sh
cd packages/importer-angular
yarn test
```

Angular uses Karma/Jasmine. Because Angular is a thin wrapper on the JavaScript
SDK, the tests mainly verify that the package loads correctly. You will likely
need to update the params in
`packages/importer-angular/projects/oneschema/src/lib/oneschema.button.spec.ts`
with the same values you use for the JavaScript test page.

## Differences between the React and JavaScript SDKs

- Unlike a traditional React component, the OneSchema embedded iframe does **not**
  re-render if the params change. If you (or a customer) are setting params
  dynamically, make sure they are all set correctly before launching.
- The JavaScript SDK uses `importer.launch()` to open the importer. The React SDK
  manages launching internally through the `isOpen` prop: setting `isOpen={true}`
  launches the importer with the current params.
- In the JavaScript SDK, customers listen to events emitted by the SDK to handle
  `error`, `success`, `cancel`, and other events. In the React SDK, those events
  are passed as props (`onSuccess`, `onCancel`, `onError`, and so on). Instead of
  each handler closing the importer, the React SDK exposes an `onRequestClose`
  prop, which is called automatically after every `success`, `cancel`, or `error`
  event.
