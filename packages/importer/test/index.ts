import oneSchemaImporter from "../src"

const importer = oneSchemaImporter({
  // clientId: "67bb2e5f-f0f7-42a6-a511-18b25e67b8c4",
  // className: "oneschema-iframe",
  // parentId: "oneschema-container",
  // baseUrl: "http://embed.localschema.co:9450",
  // templateKey: "crm_test",
  // userJwt:
  //   "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI2N2JiMmU1Zi1mMGY3LTQyYTYtYTUxMS0xOGIyNWU2N2I4YzQiLCJ1c2VyX2lkIjoxMjM0fQ.MaxfODdhWqVamNgK7l8mZrR-A4B2uGDuPWLOreu7dQI",
  clientId: "8032af4b-e2d9-40ad-8142-e68011d94d9c",
  templateKey: "crm_test",
  importConfig: { type: "local" },
  userJwt:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI4MDMyYWY0Yi1lMmQ5LTQwYWQtODE0Mi1lNjgwMTFkOTRkOWMiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-In0.UHcGqI6HutinJNCxO32dWNDBbfUJVVqrvmA_GLpLf50",
  baseUrl: "http://embed.localschema.co:9450",
  devMode: false,
})

function start() {
  importer.launch()
}

importer.on("launched", (data) => {
  console.log(data)
})

importer.on("success", (data) => {
  console.log(data)
  alert("success!")
})

importer.on("cancel", () => {
  alert("cancel!")
})

importer.on("error", () => {
  alert("error!")
})

const startbutton = document.getElementById("start-button")
if (startbutton) {
  startbutton.onclick = start
}

if ((module as any)?.hot) {
  ;(module as any)?.hot.accept()
}
