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
        clientId="67bb2e5f-f0f7-42a6-a511-18b25e67b8c4"
        userJwt="eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI2N2JiMmU1Zi1mMGY3LTQyYTYtYTUxMS0xOGIyNWU2N2I4YzQiLCJ1c2VyX2lkIjoxMjM0fQ.MaxfODdhWqVamNgK7l8mZrR-A4B2uGDuPWLOreu7dQI"
        templateKey="crm_test"
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
