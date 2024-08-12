import oneSchemaImporter from "../src"

const importer = oneSchemaImporter({
  className: "oneschema-iframe",
  parentId: "oneschema-container",
  baseUrl: "http://embed.localschema.co:9450",
  templateKey: "crm_test",
  clientId: "67bb2e5f-f0f7-42a6-a511-18b25e67b8c4",
  userJwt:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI2N2JiMmU1Zi1mMGY3LTQyYTYtYTUxMS0xOGIyNWU2N2I4YzQiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-IiwiY3JlYXRlIjp7InNlc3Npb24iOnsiZmlsZV9mZWVkX2lkIjoyOTM3Nn19fQ.BgpLx_kmW2HWMu2dzcw1pMKBm3LNsXXJzAgmZt1rNuA",
  devMode: true,
})

function start() {
  importer.launch()
}

importer.on("launched", (data) => {
  console.log("we have launched", data)
})

importer.on("success", (data) => {
  console.log(data)
  alert("success!")
})

importer.on("cancel", () => {
  console.log("cancel")
})

importer.on("error", (e) => {
  console.log(e)
  alert("error!")
})

const startbutton = document.getElementById("start-button")
if (startbutton) {
  startbutton.onclick = start
}

if ((module as any)?.hot) {
  ;(module as any)?.hot.accept()
}
