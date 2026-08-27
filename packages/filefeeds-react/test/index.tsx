import React, { useCallback, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import OneSchemaFileFeeds from "../src"

function TestApp() {
  const userJwt =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI8Q0xJRU5UX0lEPiIsInVzZXJfaWQiOiI8VVNFUl9JRD4iLCJmaWxlX2ZlZWRfaWQiOjB9.not-a-real-signature"
  const resumeTokenKey = `OneSchemaFileFeeds-session-${userJwt}`

  const [preloadIframe, setPreloadIframe] = useState(true)
  const [showEmbed, setShowEmbed] = useState(false)

  const [resumeToken, setResumeToken] = useState<string | null>(null)

  const [status, setStatus] = useState("Not started")
  const updateStatus = useCallback((message: string, data?: Record<string, any>) => {
    setResumeToken(window.localStorage.getItem(resumeTokenKey))

    setStatus(message)
    console.log("[Test]", message, data)
  }, [])

  const [sessionToken, setSessionToken] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("sessionToken")
    if (token) {
      setSessionToken(token)
    }
  }, [])

  return (
    <>
      <header style={{ padding: "0 1em" }}>
        <h1>OneSchema FileFeeds React SDK Test</h1>

        <p style={{ margin: "0.5em 0" }}>
          <button onClick={() => setPreloadIframe(!preloadIframe)}>
            {!preloadIframe ? "Preload" : "Destroy"}
          </button>
          &nbsp;
          <button onClick={() => setShowEmbed(!showEmbed)}>
            {!showEmbed ? "Show" : "Hide"}
          </button>
        </p>

        <p style={{ margin: "0.5em 0" }}>
          <span>
            Status: <code>{status}</code>
          </span>
          &nbsp; / &nbsp;
          <span>
            Session Token: <code>{sessionToken ?? "—"}</code>
          </span>
          &nbsp; / &nbsp;
          <span>
            Resume Token (local storage): <code>{resumeToken ?? "—"}</code>
          </span>
        </p>
      </header>

      <section style={{ display: "flex", flex: 1, outline: "2px solid gray" }}>
        {preloadIframe && (
          <OneSchemaFileFeeds
            baseUrl="http://embed.localschema.co:9450"
            userJwt={userJwt}
            sessionToken={sessionToken ?? undefined}
            saveSession={true}
            devMode
            style={{
              border: "0",
              display: "flex",
              height: "100%",
              width: "100%",
              flex: "1",
            }}
            isOpen={showEmbed}
            onRequestClose={() => {
              updateStatus("Requested to close")
              setShowEmbed(false)
            }}
            onPageLoad={(data) => updateStatus("iframe page loaded.", data)}
            onSessionInvalidate={(data) => updateStatus("Session invalidated.", data)}
            onInitStart={(data) => updateStatus("Initialization failed.", data)}
            onInitFail={(data) => updateStatus("Initialization failed.", data)}
            onInitSucceed={(data) => {
              setSessionToken(data.sessionToken)
              updateStatus("Initialization succeeded.", data)
            }}
            onDestroy={(data) => {
              setSessionToken(null)
              updateStatus("Destroyed.", data)
            }}
            onHide={(data) => updateStatus("Hidden.", data)}
            onShow={(data) => updateStatus("Shown.", data)}
            onSave={(data) => updateStatus("Saved.", data)}
            onCancel={(data) => updateStatus("Cancelled.", data)}
          />
        )}
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
