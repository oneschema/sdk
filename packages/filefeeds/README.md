<p align="center">
  <a href="https://www.oneschema.co/">
    <img src="https://uploads-ssl.webflow.com/62902d243ad8aef519be0d3e/62902d243ad8ae4014be0e97_oneschema-256.png" height="128">
    <h1 align="center">OneSchema FileFeeds</h1>
  </a>
</p>

> [!IMPORTANT]
> **This package is legacy.** `@oneschema/filefeeds` is in maintenance mode: it
> keeps working and still receives critical and security fixes, but no new
> features and no major updates are planned. If you are starting a new
> integration, contact OneSchema support before building on this package.

A tool for embedding [OneSchema FileFeeds](https://www.oneschema.co/filefeeds)
into your application.

This library will give you convenient bindings to add an iframe to your
application which can create new OneSchema FileFeeds and edit their transforms.

## Getting Started

### Installation

You can install this package with npm:

```bash
npm i --save @oneschema/filefeeds
```

or with a script tag:

```html
<script src="https://d3ah8o189k1llu.cloudfront.net/oneschema-filefeeds-0.4.latest.min.js"></script>
```

### Sample usage

```javascript
import oneschemaFileFeeds from "@oneschema/filefeeds"

const fileFeeds = oneschemaFileFeeds({
  userJwt: "YOUR_USER_JWT",
  devMode: true,
  className: "oneschema-filefeeds",
})

fileFeeds.launch()

fileFeeds.on("init-failed", (data) => {
  // handle failures.
})

fileFeeds.on("init-succeeded", (data) => {
  // handle embedding session updates.
})

fileFeeds.on("saved", (data) => {
  // handle FileFeeds transforms being saved.
})
```

## Documentation

Please see [📚 OneSchema's documentation](https://docs.oneschema.co/) for
[▶️ Getting Started](https://docs.oneschema.co/docs/filefeeds-getting-started),
[📒 API reference](https://docs.oneschema.co/docs/javascript#api-reference) and
other helpful guides.
