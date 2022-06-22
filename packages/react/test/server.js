const express = require("express")
const path = require("path")

const app = express()
const port = 4242

app.use(express.static(path.join(__dirname, "dist")))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
