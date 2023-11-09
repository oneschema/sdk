# CHANGELOG

This log is intended to keep track of package changes, including
but not limited to API changes and file location changes. Minor behavioral
changes may not be included if they are not expected to break existing code.

## 0.4.9 (2023-11-08)

- Fix bug in 0.4.9 where importer would not properly reopen after closing

## 0.4.8 (2023-10-25) [NOT STABLE]

- Stop `_initWithRetry` if the postMessage has been recieved by OneSchema app.

## 0.4.7 (2023-10-16)

- Add template override for mapping validations

## 0.4.6 (2023-10-11)

- Add picklist related keys to `OneSchemaCustomization` for use in customization overrides.

## 0.4.5 (2023-10-09)

- Make sure keys in `OneSchemaTemplateOverries` are optional
- Have a `console.warn` upon changing launch params after an importer has launched in
  React SDK.

## 0.4.4 (2023-09-28)

- Enable `onLaunched` to surface internal server errors (such as 422s).
- Enable customization of headers in CSV file upload imports.
- Change `importExperience` to `importErrorUX` for `CustomizationOverrides`

## 0.4.3 (2023-08-29)

- Add support for creating new validation hooks in through template overrides

## 0.4.2 (2023-08-17)

- Update type definitions `MappingStrategy` in `OneSchemaCustomization` to split `historical` into `historical_user` and `historical_org`.
- Mark `historical` as deprecated in `MappingStrategy`.

## 0.4.1 (2023-07-31)

- Fix typo in `OneSchemaTemplateColumnToUpdate`: `must_exit` to`must_exist`

## 0.4.0 (2023-07-27)

- Update type definitions for OneSchemaTemplateOverrides

## 0.3.15 (2023-07-24)

- Update type definitions for customizations to include aiSuggestedMappings
- Update type definitions for OneSchemaLaunchStatus to include `embedId`
- Include `embedId` in onLaunched response

## 0.3.14 (2023-06-16)

- Update type definitions for customizations to include text overrides
- Update type definitions for file upload import config to include headers

## 0.3.13 (2023-03-28)

- Add support for file upload import config

## 0.3.12 (2023-03-22)

- Add support for template groups

## 0.3.11 (2023-02-23)

- Emit session token in the launched event

## 0.3.10 (2023-02-21)

- Update Typescript definitions for skipHeaderRow in customization overrides

## 0.3.9 (2023-02-14)

- Update event webhooks field to `eventWebhookKeys`

## 0.3.8 (2023-02-13)

- Add support for event webhooks

## 0.3.7 (2023-02-04)

- Revert parentId from React
- Fix bug with `inline` mode in React

## 0.3.6 (2023-02-03)

- Add support for parentId in React SDK.

## 0.3.5 (2023-01-18)

- Add support for template overrides.

## 0.3.4 (2023-01-10)

- Change resume session to default on and remove session saving on cancel.

## 0.3.3 (2023-01-5)

- Adds support for saving and resuming session.

## 0.3.2 (2022-12-14)

- Include data to the "success" event for webhook imports

## 0.3.1 (2022-12-13)

- Add `fileSizeLimit` to Typescript definitions for `customizationOverrides
- Add support for `customizationKey` param to specify which customization to use
- Deprecate `launchSession` (use `launch` instead)

## 0.3.0 (2022-11-15)

- Updates to how config is specified with some breaking changes:
  - Add `customizationOverrides` and `importConfig` to params
  - Remove `config` and `webhookKey` from params. To migrate:
    - For most `config` values, pass them into `customizationOverride` or set on the [Customizations page](https://app.oneschema.co/customizations).
    - For `skipExportData` set `importConfig` to `{ type: "local", metadataOnly: true }`
    - For `webhookKey` set `importConfig` as `{ type: "webhook", key: webhookKey}`
  - Remove `parentId` and `blockImportIfErrors`

## 0.2.10 (React) (2022-11-09)

- Fix Typescript definitions

## 0.2.9 (2022-10-25)

- Added messaging around SDK version and client to iframe

## 0.2.8 (2022-10-11)

- Add `skipExportData` to Typescript definitions
- Will display upload error if using `devMode`

## 0.2.7 (2022-09-30)

- Add `launchSession` and Typescript definitons for its usage
- Moves `sessionToken` from config object into base option
- `launched` event and `onLaunched` now have a parameter (object with `success` (bolean) and `error` (enum))

## 0.2.6 (2022-09-27)

- Add languageCode option
- Update type definitions for contentOptions

## 0.2.5 (2022-09-21)

- Fix for noisy error messages related to `postMessage`

## 0.2.4 (2022-09-16)

- Fix race condition due to init messages
- Update type definitions for config

## 0.2.3 (2022-08-19)

- Emit `launched` event and add `onLaunched` prop which is called when UI is shown

## 0.2.2 (2022-08-18)

- Fix UI flickering

## 0.2.1 (2022-08-03)

- Makes iframe transparent

## 0.2.0 (2022-07-27)

- Updated initiliazing and launch functions to be object-based.
- Add `setStyles` function on base JS importer
- Add `manageDOM`/`setIframe` to base JS and `inline` prop to React for manual iframe creation
- Adds Angular SDK

## 0.1.7 / 0.1.8 (React) (2022-07-18)

- Bugfixes for server side rendering

## 0.1.6 / 0.1.7 (React) (2022-07-07)

- Safer handling of the close message to the iframe
- `style` prop added to React for styling the iframe

## 0.1.5 / 0.1.6 (React) (2022-07-06)

- Add support for serverside rendering

## 0.1.4 / 0.1.5 (React) (2022-06-27)

- Fix for loading based race condition

## 0.1.4 (React) (2022-06-24)

- Fix for default props not being used in React

## 0.1.3 (2022-06-22)

- default export for importing via script renamed to: `oneschemaImporter`
- Export class definition for Typescript
- React library

## 0.1.2 (2022-06-17)

- Exporting Typescript definitions
- Append the iframe to DOM when the importer is created

## 0.1.1 (2022-06-16)

- Renaming package to importer
