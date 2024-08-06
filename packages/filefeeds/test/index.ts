import oneSchemaFileFeeds from "../src"

const statusEl = document.getElementById("status")!
const sessionIdEl = document.getElementById("session-id")!

function log(message: string, data?: Record<string, any>) {
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
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI2N2JiMmU1Zi1mMGY3LTQyYTYtYTUxMS0xOGIyNWU2N2I4YzQiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-IiwiY3JlYXRlIjp7InNlc3Npb24iOnsiZmlsZV9mZWVkX2lkIjoyOTM3Nn19fQ.BgpLx_kmW2HWMu2dzcw1pMKBm3LNsXXJzAgmZt1rNuA",
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
  fileFeeds.launch()
}

document.getElementById("hide-button")!.onclick = () => {
  fileFeeds.hide()
}

document.getElementById("destroy-button")!.onclick = () => {
  fileFeeds.destroy()
}

fileFeeds.on("page-loaded", (data) => {
  log("iframe page loaded.", data)
})

fileFeeds.on("init-started", (data) => {
  log("Initialization started.", data)
})

fileFeeds.on("init-failed", (data) => {
  log("Initialization failed.", data)
})

fileFeeds.on("init-succeeded", (data) => {
  log("Initialization succeeded.", data)
})

fileFeeds.on("destroyed", (data) => {
  log("Destroyed.", { sessionId: "", ...data })
})

fileFeeds.on("hidden", (data) => {
  log("Hidden.", data)
})

fileFeeds.on("shown", (data) => {
  log("Shown.", data)
})

fileFeeds.on("saved", (data) => {
  log("Transforms saved.", data)
})

fileFeeds.on("reverted", (data) => {
  log("Transforms reverted.", data)
})

fileFeeds.on("session-invalidated", (data) => {
  log("Session invalidated.", data)
})

// parcel
;(module as any)?.hot.accept()
