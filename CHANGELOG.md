# CHANGELOG

This log is intended to keep track of package changes, including
but not limited to API changes and file location changes. Minor behavioral
changes may not be included if they are not expected to break existing code.

## 0.2.8 (2022-10-11)

* Add `skipExportData` to Typescript definitions
* Will display upload error if using `devMode`

## 0.2.7 (2022-09-30)

* Add `launchSession` and Typescript definitons for its usage
* Moves `sessionToken` from config object into base option
* `launched` event and `onLaunched` now have a parameter (object with `success` (bolean) and `error` (enum))

## 0.2.6 (2022-09-27)

* Add languageCode option
* Update type definitions for contentOptions

## 0.2.5 (2022-09-21)

* Fix for noisy error messages related to `postMessage`

## 0.2.4 (2022-09-16)

* Fix race condition due to init messages
* Update type definitions for config

## 0.2.3 (2022-08-19)

* Emit `launched` event and add `onLaunched` prop which is called when UI is shown

## 0.2.2 (2022-08-18)

* Fix UI flickering

## 0.2.1 (2022-08-03)

* Makes iframe transparent

## 0.2.0 (2022-07-27)

* Updated initiliazing and launch functions to be object-based.
* Add `setStyles` function on base JS importer
* Add `manageDOM`/`setIframe` to base JS and `inline` prop to React for manual iframe creation
* Adds Angular SDK

## 0.1.7 / 0.1.8 (React) (2022-07-18)

* Bugfixes for server side rendering

## 0.1.6 / 0.1.7 (React) (2022-07-07)

* Safer handling of the close message to the iframe
* `style` prop added to React for styling the iframe

## 0.1.5 / 0.1.6 (React) (2022-07-06)

* Add support for serverside rendering

## 0.1.4 / 0.1.5 (React) (2022-06-27)

* Fix for loading based race condition

## 0.1.4 (React) (2022-06-24)

* Fix for default props not being used in React

## 0.1.3 (2022-06-22)

* default export for importing via script renamed to: `oneschemaImporter`
* Export class definition for Typescript
* React library

## 0.1.2 (2022-06-17)

* Exporting Typescript definitions
* Append the iframe to DOM when the importer is created

## 0.1.1 (2022-06-16)

* Renaming package to importer