import React, { useCallback, useState } from "react"
import { createRoot } from "react-dom/client"

import OneSchemaImporter from "../src"

function TestApp() {
  const [isOpen, setIsOpen] = useState(false)

  const [status, setStatus] = useState("Not started")
  const updateStatus = useCallback((message: string, data?: Record<string, any>) => {
    setStatus(message)
    console.log("[Test]", message, data)
  }, [])

  return (
    <>
      <header style={{ padding: "0 1em" }}>
        <h1>OneSchema Importer React SDK Test</h1>

        <p style={{ margin: "0.5em 0" }}>
          <button onClick={() => setIsOpen(!isOpen)}>{!isOpen ? "Show" : "Hide"}</button>
        </p>

        <p style={{ margin: "0.5em 0" }}>
          Status: <code>{status}</code>
        </p>
      </header>

      <section style={{ display: "flex", flex: 1, outline: "2px solid gray" }}>
        <OneSchemaImporter
          baseUrl="http://embed.localschema.co:9450"
          clientId="67bb2e5f-f0f7-42a6-a511-18b25e67b8c4"
          userJwt="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI2N2JiMmU1Zi1mMGY3LTQyYTYtYTUxMS0xOGIyNWU2N2I4YzQiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-IiwiY3JlYXRlIjp7InNlc3Npb24iOnsiZmlsZV9mZWVkX2lkIjoyOTM3Nn19fQ.BgpLx_kmW2HWMu2dzcw1pMKBm3LNsXXJzAgmZt1rNuA"
          templateKey="crm_test"
          devMode
          style={{
            border: "0",
            display: "flex",
            height: "100%",
            width: "100%",
            flex: "1",
          }}
          isOpen={isOpen}
          onRequestClose={() => {
            updateStatus("Requested to close")
            setIsOpen(false)
          }}
          onPageLoad={() => updateStatus("iframe page loaded.")}
          onLaunched={(data) => updateStatus("Launched.", data)}
          onSuccess={(data) => updateStatus("Import succeeded.", data)}
          onCancel={() => updateStatus("Import cancelled.")}
          onError={(data) => updateStatus("Import failed.", data)}
        />
      </section>
    </>
  )
}

const container = document.getElementById("root")
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
)

if ((module as any)?.hot) {
  ;(module as any)?.hot.accept()
}
