import oneSchemaFileFeeds from "../src"

const baseUrl =
  process.env.ONESCHEMA_EMBED_BASE_URL || "http://embed.localschema.co:9450/"

/* spell-checker: disable */
const userJwt =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1ZmU4MTRjNi0zNDVlLTRhZTctYTI3YS01MDNhMzU0MzY2MjYiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-IiwiZmlsZV9mZWVkX2lkIjo1Mjk3Nn0.3c7z4LHsrzDVojLaBzUuK06w3Bf3y73hLQicP3sXgCA"
/* spell-checker: enable */
/* TODO: Replace hard-coded userJwt with something like this:
const { ONESCHEMA_DEV_ENV_CLIENT_ID, ONESCHEMA_DEV_ENV_CLIENT_SECRET } = process.env
const userJwt = jwt.sign(
  { iss: ONESCHEMA_DEV_ENV_CLIENT_ID, user_id: "<USER_ID>", file_feed_id: "1" },
  ONESCHEMA_DEV_ENV_CLIENT_SECRET!,
  { algorithm: "RS256" },
)
*/

const statusEl = document.getElementById("status")!
const sessionTokenEl = document.getElementById("session-token")!
const resumeTokenEl = document.getElementById("resume-token")!

const { sessionToken } = Object.fromEntries(new URLSearchParams(window.location.search))

if (sessionToken) {
  sessionTokenEl.innerHTML = sessionToken
}

const resumeTokenKey = `OneSchemaFileFeeds-session-${userJwt}`

const fileFeeds = oneSchemaFileFeeds({
  parentId: "oneschema-container",
<<<<<<< HEAD
  baseUrl,
  userJwt,
=======
  baseUrl: "https://embed.oneschema.co",
  userJwt:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1NTdiMTlmNS1mOGVhLTRiMzktOTRiNy00OTU1MDgwYmJiNjEiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-IiwiZmlsZV9mZWVkX2lkIjo0ODd9.6y4VCV2imYv6_UcWk-Nc1WpKDhvp3vuqe4j8NoJ5fU4",
  sessionToken: "526a3914-aaa6-4177-b48a-1e5d9748a6fc",
>>>>>>> e7f2299 (enable autoclose)
  devMode: true,
  styles: {
    display: "flex",
    height: "100%",
    width: "100%",
    flex: "1",
    position: "initial",
  },
  saveSession: true,
})

function getResumeToken(key: string) {
  return window.localStorage.getItem(key) || "&mdash;"
}

function updateStatus(message: string, data?: Record<string, any>) {
  console.log("[Test]", message, "data:", data)
  statusEl.innerHTML = message
  if (data?.sessionToken !== undefined) {
    sessionTokenEl.innerHTML = data?.sessionToken || "&mdash;"
  }
  resumeTokenEl.innerHTML = getResumeToken(resumeTokenKey)
}

statusEl.innerHTML = "Loading in the background."
resumeTokenEl.innerHTML = getResumeToken(resumeTokenKey)

document.getElementById("launch-button")!.onclick = () => {
  fileFeeds.launch(sessionToken ? { sessionToken } : {})
<<<<<<< HEAD
=======
  // fileFeeds.launch({})
>>>>>>> e7f2299 (enable autoclose)
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
  updateStatus("Destroyed.", { sessionToken: null, ...data })
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
