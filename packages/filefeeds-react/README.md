<p align="center">
  <a href="https://www.oneschema.co/">
    <img src="https://uploads-ssl.webflow.com/62902d243ad8aef519be0d3e/62902d243ad8ae4014be0e97_oneschema-256.png" height="128">
    <h1 align="center">OneSchema FileFeeds</h1>
  </a>
</p>

A tool for embedding [OneSchema FileFeeds](https://www.oneschema.co/filefeeds)
into your application with React.

This library contains a React component which will allow you to add an iframe to
your application which can create new OneSchema FileFeeds and edit their
transforms.

## Getting Started

### Installation

You can install this package with npm:

```bash
npm i --save @oneschema/filefeeds-react
```

### Sample usage

```javascript
import React, { useState } from "react"
import OneSchemaFileFeeds from "@oneschema/filefeeds-react"

function OneSchemaFileFeedsExample() {
  const [isOpen, setIsOpen] = useState(false)

  const handleData = (data) => {
    console.log(data)
  }

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open the file feed transforms</button>

      <OneSchemaFileFeeds
        /* managing state from your application */
        isOpen={isOpen}
        /* required config values */
        userJwt={userJwt}
        /* optional config values */
        devMode={process.env.NODE_ENV !== "production"}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
        }}
        inline={false}
        /* handling results */
        onInitFail={(data) => updateStatus("Initialization failed.", data)}
        onInitSucceed={(data) => {
          setSessionId(data.sessionId)
          updateStatus("Initialization succeeded.", data)
        }}
        onSave={(data) => updateStatus("Saved.", data)}
      />
    </div>
  )
}
```

## Documentation

Please see [📚 OneSchema's documentation](https://docs.oneschema.co/) for
[▶️ Getting Started](https://docs.oneschema.co/docs/filefeeds-getting-started),
[📒 API reference](https://docs.oneschema.co/docs/javascript#api-reference) and
other helpful guides.
