import oneSchemaFileFeeds from "../src"

const statusEl = document.getElementById("status")!
const sessionIdEl = document.getElementById("session-id")!

function updateStatus(message: string, data?: Record<string, any>) {
  console.log("[Test]", message, "data:", data)
  statusEl.innerHTML = message
  if (data?.sessionId !== undefined) {
    sessionIdEl.innerHTML = data?.sessionId || "&mdash;"
  }
}

const fileFeeds = oneSchemaFileFeeds({
  className: "oneschema-iframe",
  parentId: "oneschema-container",
  baseUrl: "http://embed.localschema.co:9450",
  userJwt:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI4MDMyYWY0Yi1lMmQ5LTQwYWQtODE0Mi1lNjgwMTFkOTRkOWMiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-IiwiY3JlYXRlIjp7ImZpbGVfZmVlZCI6eyJuYW1lIjoiY3JtX3Rlc3RfMTcyNTQ5MTQ1ODA1OCIsInRlbXBsYXRlX2tleSI6ImNybV90ZXN0IiwiY3VzdG9tX21ldGFkYXRhIjp7fX19fQ.4izMP5MzlfxryMqpsJWW1o_fnpyMpG_EYLN12jObO-g",
  devMode: true,
  styles: {
    display: "flex",
    height: "100%",
    width: "100%",
    flex: "1",
    position: "initial",
  },
})

statusEl.innerHTML = "Loading in the background."

document.getElementById("launch-button")!.onclick = () => {
  fileFeeds.launch({ customizationOverrides: { backgroundPrimaryColor: "#FF00FF" } })
}

document.getElementById("hide-button")!.onclick = () => {
  fileFeeds.hide()
}

document.getElementById("destroy-button")!.onclick = () => {
  fileFeeds.destroy()
}

fileFeeds.on("page-loaded", (data) => {
  updateStatus("iframe page loaded.", data)
})

fileFeeds.on("init-started", (data) => {
  updateStatus("Initialization started.", data)
})

fileFeeds.on("init-failed", (data) => {
  updateStatus("Initialization failed.", data)
})

fileFeeds.on("init-succeeded", (data) => {
  updateStatus("Initialization succeeded.", data)
})

fileFeeds.on("destroyed", (data) => {
  updateStatus("Destroyed.", { sessionId: "", ...data })
})

fileFeeds.on("hidden", (data) => {
  updateStatus("Hidden.", data)
})

fileFeeds.on("shown", (data) => {
  updateStatus("Shown.", data)
})

fileFeeds.on("saved", (data) => {
  updateStatus("Saved.", data)
})

fileFeeds.on("cancelled", (data) => {
  updateStatus("Cancelled.", data)
})

fileFeeds.on("session-invalidated", (data) => {
  updateStatus("Session invalidated.", data)
})

// parcel
;(module as any)?.hot.accept()
