import oneSchemaImporter from "../src"

const importer = oneSchemaImporter({
  clientId: "8032af4b-e2d9-40ad-8142-e68011d94d9c",
  className: "oneschema-iframe",
  parentId: "oneschema-container",
  baseUrl: "http://embed.localschema.co:9450",
  templateKey: "crm_test",
  userJwt:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI4MDMyYWY0Yi1lMmQ5LTQwYWQtODE0Mi1lNjgwMTFkOTRkOWMiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-In0.UHcGqI6HutinJNCxO32dWNDBbfUJVVqrvmA_GLpLf50",
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
