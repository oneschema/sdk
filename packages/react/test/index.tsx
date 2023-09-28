import React, { useState } from "react"
import { createRoot } from "react-dom/client"
import OneSchemaImporter from "../src"

function ImportTester() {
  const [isOpen, setIsOpen] = useState(false)

  const handleData = (data: any) => {
    console.log(data)
  }

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Start!</button>
      <OneSchemaImporter
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        clientId="8032af4b-e2d9-40ad-8142-e68011d94d9c"
        userJwt="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI4MDMyYWY0Yi1lMmQ5LTQwYWQtODE0Mi1lNjgwMTFkOTRkOWMiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-In0.UHcGqI6HutinJNCxO32dWNDBbfUJVVqrvmA_GLpLf50"
        templateKey="crm_test"
        onLaunched={(result) => console.log("onlaunch", result)}
        onSuccess={handleData}
        onCancel={() => console.log("cancelled")}
        onError={(message) => console.log(message)}
        baseUrl="http://embed.localschema.co:9450"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
        }}
        // devMode={false}
      />
    </div>
  )
}

const container = document.getElementById("root")
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <ImportTester />
  </React.StrictMode>,
)

if ((module as any)?.hot) {
  ;(module as any)?.hot.accept()
}
