import oneSchemaFileFeeds from "../src"

const statusEl = document.getElementById("status")!
const sessionTokenEl = document.getElementById("session-token")!

function getQueryParams() {
  const params = new URLSearchParams(window.location.search)
  const sessionToken = params.get("sessionToken")

  return { sessionToken }
}

const { sessionToken } = getQueryParams()

if (sessionToken) {
  sessionTokenEl.innerHTML = sessionToken
}

function updateStatus(message: string, data?: Record<string, any>) {
  console.log("[Test]", message, "data:", data)
  statusEl.innerHTML = message
  if (data?.sessionToken !== undefined) {
    sessionTokenEl.innerHTML = data?.sessionToken || "&mdash;"
  }
}

const fileFeeds = oneSchemaFileFeeds({
  className: "oneschema-iframe",
  parentId: "oneschema-container",
  baseUrl: "http://embed.localschema.co:9450",
  userJwt:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1ZmU4MTRjNi0zNDVlLTRhZTctYTI3YS01MDNhMzU0MzY2MjYiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-IiwiZmlsZV9mZWVkX2lkIjo1Mjk3Nn0.3c7z4LHsrzDVojLaBzUuK06w3Bf3y73hLQicP3sXgCA",
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
  fileFeeds.launch( sessionToken ? { sessionToken } : {})
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
  updateStatus("Destroyed.", { sessionToken: "", ...data })
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
