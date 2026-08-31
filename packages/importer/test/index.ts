import oneSchemaImporter from "../src"

const statusEl = document.getElementById("status")!

function updateStatus(message: string, data?: Record<string, any>) {
  console.log("[Test]", message, "data:", data)
  statusEl.innerHTML = message
}

const importer = oneSchemaImporter({
  className: "oneschema-iframe",
  parent: document.getElementById("oneschema-container")!,
  baseUrl: "http://embed.localschema.co:9450",
  templateKey: "crm_test",
  clientId: "67bb2e5f-f0f7-42a6-a511-18b25e67b8c4",
  userJwt:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI8Q0xJRU5UX0lEPiIsInVzZXJfaWQiOiI8VVNFUl9JRD4iLCJjcmVhdGUiOnsic2Vzc2lvbiI6eyJmaWxlX2ZlZWRfaWQiOjB9fX0.not-a-real-signature",
  devMode: true,
  styles: {
    display: "flex",
    height: "100%",
    width: "100%",
    flex: "1",
    position: "initial",
  },
})

document.getElementById("launch-button")!.onclick = () => {
  importer.launch()
}

document.getElementById("close-button")!.onclick = () => {
  importer.close()
}

importer.on("page-loaded", (data) => {
  updateStatus("iframe page loaded.", data)
})

importer.on("launched", (data) => {
  updateStatus("launched.", data)
})

importer.on("success", (data) => {
  updateStatus("import success.", data)
  alert(data)
})

importer.on("cancel", () => {
  updateStatus("import cancelled.")
})

importer.on("error", (data) => {
  updateStatus("error.", data)
})

if ((module as any)?.hot) {
  ;(module as any)?.hot.accept()
}
