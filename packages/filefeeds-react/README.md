<p align="center">
  <a href="https://www.oneschema.co/">
    <img src="https://uploads-ssl.webflow.com/62902d243ad8aef519be0d3e/62902d243ad8ae4014be0e97_oneschema-256.png" height="128">
    <h1 align="center">OneSchema Importer</h1>
  </a>
</p>

A tool for embedding OneSchema into your application with React. This library contains a React component which will allow you to add an iframe to your application which can open OneSchema and import data into your application.

## Getting Started

### Installation

You can install this package with npm:

```bash
npm i --save @oneschema/filefeeds-react
```

### Sample usage

```javascript
import React, { useState } from "react"
import OneSchemaImporter from "@oneschema/filefeeds-react"

function OneSchemaExample() {
  const [isOpen, setIsOpen] = useState(false)

  const handleData = (data) => {
    console.log(data)
  }

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Import</button>

      <OneSchemaImporter
        /* managing state from your application */
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        /* required config values */
        clientId={clientId}
        userJwt={token}
        templateKey={templateKey}
        /* optional config values */
        importConfig={{ type: "local", metadataOnly: false }}
        devMode={process.env.NODE_ENV !== "production"}
        className="oneschema-importer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
        }}
        inline={false}
        /* handling results */
        onSuccess={handleData}
        onCancel={() => console.log("cancelled")}
        onError={(error) => console.log(error)}
      />
    </div>
  )
}
```

## Documentation

Please see [📚 OneSchema's documentation](https://docs.oneschema.co/) for [📒 API reference](https://docs.oneschema.co/docs/#TBD) and other helpful guides.
