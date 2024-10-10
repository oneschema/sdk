# CHANGELOG for OneSchema FileFeeds SDKs

Note: Please see [CHANGELOG.md](./CHANGELOG.md) for history
of OneSchema Importer packages.

This log is intended to keep track of package changes, including
but not limited to API changes and file location changes. Minor behavioral
changes may not be included if they are not expected to break existing code.

## 0.5.1 (2024-10-10)

- Auto-resume can be toggled via the `saveSession` init parameter. When set as `true`, the session is eligible to be automatically resumed if not closed through normal means

## 0.5.0 (2024-10-03)

- Support `session_token` as an init and launch parameter. When the `session token` 
  for an existing, valid  session is passed in along with a corresponding jwt, the 
  specified session will be resumed. `Session token` will be provided in the 
  `init succeeded` and `saved` event data payloads, and `session id`
  will no longer be returned.
- By default, OneSchema will save the session token and resume in case the session 
  was not closed through normal means (usually the browser closing or refreshing). 
  It will not resume if the user cancels the session or if it ends.

## 0.4.0 (2024-09-06)

- Support `customization_key` and `customization_overrides` as launch parameters

## 0.3.0 (2024-08-29)

- Support `cancelled` event. (React: `onCancel` callback.)
- React: `inline` prop is defaulted to true.
  When upgrading to this version, if you still need the non-`inline` behavior,
  you could set `inline={false}` explicitly. Or, you could switch to the
  `inline` rendering (which is more native to React environment) and adjust your
  style attribute and CSS rules to achieve the desired looks.

## 0.2.0 (2024-08-06)

Packages: `filefeeds, filefeeds-react`

- FileFeeds React SDK: Initial release.
- FileFeeds JS SDK: Export data types for event callbacks.

## 0.1.0 (2024-08-05)

Packages: `filefeeds`

- FileFeeds JS SDK: Initial release.
