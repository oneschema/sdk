import React, { useCallback, useState } from "react"
import { createRoot } from "react-dom/client"

import OneSchemaFileFeeds from "../src"

function TestApp() {
  const [isOpen, setIsOpen] = useState(false)

  const [status, setStatus] = useState("Not started")
  const updateStatus = useCallback((message: string, data?: Record<string, any>) => {
    setStatus(message)
    console.log("[Test]", message, data)
  }, [])

  const [sessionId, setSessionId] = useState<number | null>(null)

  return (
    <>
      <header style={{ padding: "0 1em" }}>
        <h1>OneSchema FileFeeds React SDK Test</h1>

        <p>
          <button onClick={() => setIsOpen(true)}>Launch</button>
          <button onClick={() => setIsOpen(false)}>Hide</button>
          <span style={{ display: "inline-block", padding: "0 1em" }}>
            Session ID: <code>{sessionId ?? "—"}</code>
          </span>
          <span style={{ display: "inline-block", padding: "0 1em" }}>
            Status: <code>{status}</code>
          </span>
        </p>
      </header>

      <section style={{ display: "flex", flex: 1, outline: "2px solid gray" }}>
        <OneSchemaFileFeeds
          baseUrl="http://embed.localschema.co:9450"
          userJwt="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI2N2JiMmU1Zi1mMGY3LTQyYTYtYTUxMS0xOGIyNWU2N2I4YzQiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-IiwiY3JlYXRlIjp7InNlc3Npb24iOnsiZmlsZV9mZWVkX2lkIjoyOTM3Nn19fQ.BgpLx_kmW2HWMu2dzcw1pMKBm3LNsXXJzAgmZt1rNuA"
          inline
          style={{
            border: "0",
            display: "flex",
            height: "100%",
            width: "100%",
            flex: "1",
          }}
          isOpen={isOpen}
          onPageLoad={(data) => updateStatus("iframe page loaded.", data)}
          onSessionInvalidate={(data) => updateStatus("Session invalidated.", data)}
          onInitStart={(data) => updateStatus("Initialization failed.", data)}
          onInitFail={(data) => updateStatus("Initialization failed.", data)}
          onInitSucceed={(data) => {
            setSessionId(data.sessionId)
            updateStatus("Initialization succeeded.", data)
          }}
          onDestroy={(data) => {
            setSessionId(null)
            updateStatus("Destroyed.", data)
          }}
          onHide={(data) => updateStatus("Hidden.", data)}
          onShow={(data) => updateStatus("Shown.", data)}
          onSave={(data) => updateStatus("Saved.", data)}
          onRevert={(data) => updateStatus("Reverted.", data)}
        />
      </section>
    </>
  )
}

const root = createRoot(document.getElementById("root")!)
root.render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
)

if ((module as any)?.hot) {
  ;(module as any)?.hot.accept()
}
