# CHANGELOG for OneSchema FileFeeds SDKs

Note: Please see [CHANGELOG.md](./CHANGELOG.md) for history
of OneSchema Importer packages.

This log is intended to keep track of package changes, including
but not limited to API changes and file location changes. Minor behavioral
changes may not be included if they are not expected to break existing code.

## Next

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