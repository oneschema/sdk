const assert = require("node:assert/strict")
const { test } = require("node:test")

const { version } = require("../package.json")
const { OneSchemaImporterClass } = require("../dist/main.js")

function createImporter(params) {
  const listeners = []
  global.window = {
    addEventListener(_type, listener) {
      listeners.push(listener)
    },
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
    ...params,
  })

  importer.setIframe(iframe)

  const post = (data) =>
    listeners.forEach((listener) => listener({ source: iframe.contentWindow, data }))

  return { iframe, importer, messages, post }
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

test("waits for its own iframe to load before initializing", () => {
  const first = createImporter()
  first.importer.launch()
  first.iframe.onload()

  const second = createImporter()
  second.importer.launch()

  assert.deepEqual(second.messages, [])

  second.iframe.onload()

  assert.equal(second.messages.length, 1)
  assert.equal(first.messages.length, 1)

  first.importer.destroy()
  second.importer.destroy()
})

test("releases only its own iframe on destroy", () => {
  const first = createImporter()
  const second = createImporter()

  first.importer.destroy()

  assert.equal(first.importer.iframe, undefined)
  assert.equal(second.importer.iframe, second.iframe)

  second.importer.launch()
  second.iframe.onload()

  assert.equal(second.messages.length, 1)

  second.importer.destroy()
})

test("defaults the file-upload format without touching the caller's config", () => {
  const { iframe, importer, messages } = createImporter()
  const importConfig = { type: "file-upload", url: "https://upload.test/file" }

  importer.launch({ importConfig })
  iframe.onload()

  assert.equal(messages[0].payload.importConfig.format, "csv")
  assert.deepEqual(importConfig, {
    type: "file-upload",
    url: "https://upload.test/file",
  })

  importer.destroy()
})

test("stays idle when launch params are invalid", () => {
  const importer = new OneSchemaImporterClass({
    baseUrl: "https://embed.test",
    clientId: "client-id",
    manageDOM: false,
  })

  assert.equal(importer.launch().success, false)
  assert.equal(importer.status, "idle")

  importer.destroy()
})

test("returns to idle when the embed rejects the launch", () => {
  const { iframe, importer, post } = createImporter({ autoClose: false })

  importer.launch()
  iframe.onload()

  assert.equal(importer.status, "launching")

  post({ messageType: "launch-error", message: "invalid template" })

  assert.equal(importer.status, "idle")

  importer.destroy()
})

test("reports where the instance is in its lifecycle", () => {
  const { iframe, importer } = createImporter()

  assert.equal(importer.status, "idle")

  importer.launch()
  iframe.onload()

  assert.equal(importer.status, "launching")

  importer.close()

  assert.equal(importer.status, "idle")

  importer.destroy()

  assert.equal(importer.status, "destroyed")
})

test("keeps the core version separate from the wrapper identity", () => {
  const { iframe, importer, messages } = createImporter()
  importer.setClient("React", "0.7.4")

  const payload = postInitMessage(importer, iframe, messages)

  assert.equal(payload.version, "0.7.4")
  assert.equal(payload.coreVersion, version)
  assert.equal(payload["@from"], "React#0.7.4")
})
