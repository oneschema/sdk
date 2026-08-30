const assert = require("node:assert/strict")
const { test } = require("node:test")

const { version } = require("../package.json")
const { OneSchemaImporterClass } = require("../dist/main.js")

function createImporter() {
  global.window = {
    addEventListener() {},
    removeEventListener() {},
  }

  const messages = []
  const iframe = {
    contentWindow: {
      postMessage(payload, targetOrigin) {
        messages.push({ payload, targetOrigin })
      },
    },
    dataset: {},
    style: {},
    setAttribute() {},
  }
  const importer = new OneSchemaImporterClass({
    baseUrl: "https://embed.test",
    clientId: "client-id",
    manageDOM: false,
    templateKey: "template-key",
    userJwt: "user-jwt",
  })

  importer.setIframe(iframe)

  return { iframe, importer, messages }
}

function postInitMessage(importer, iframe, messages) {
  importer.launch()
  iframe.onload()
  importer.close(true)
  return messages[0].payload
}

test("posts the core package version on init messages", () => {
  const { iframe, importer, messages } = createImporter()

  const payload = postInitMessage(importer, iframe, messages)

  assert.equal(payload.messageType, "init")
  assert.equal(payload.coreVersion, version)
})

test("keeps the core version separate from the wrapper identity", () => {
  const { iframe, importer, messages } = createImporter()
  importer.setClient("React", "0.7.4")

  const payload = postInitMessage(importer, iframe, messages)

  assert.equal(payload.version, "0.7.4")
  assert.equal(payload.coreVersion, version)
  assert.equal(payload["@from"], "React#0.7.4")
})
