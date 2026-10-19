const assert = require("node:assert/strict")
const { test } = require("node:test")

const { version } = require("../package.json")
const { OneSchemaImporterClass, OneSchemaLaunchError } = require("../dist/main.js")

const invalidClientIdMessage =
  "OneSchema config error: clientId must be a non-empty string"

function createImporter(overrides = {}) {
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
    ...overrides,
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

for (const clientId of ["", " \t ", undefined, 123]) {
  test(`does not load the embed launcher with invalid clientId ${String(clientId)}`, (t) => {
    const consoleError = t.mock.method(console, "error")
    const { iframe, importer, messages } = createImporter({ clientId })
    const launchedEvents = []
    importer.on("launched", (status) => launchedEvents.push(status))

    assert.equal(iframe.src, undefined)
    assert.equal(importer.iframe, undefined)

    const expected = {
      success: false,
      error: OneSchemaLaunchError.LaunchError,
      message: invalidClientIdMessage,
    }

    assert.deepEqual(importer.launch(), expected)
    assert.equal(launchedEvents.length, 1)
    assert.deepEqual(launchedEvents[0], expected)
    assert.ok(
      consoleError.mock.calls.some(
        (call) => call.arguments[0] === invalidClientIdMessage,
      ),
    )
    assert.equal(messages.length, 0)

    importer.destroy()
  })
}

test("does not create an embed launcher iframe when constructed without a client ID", (t) => {
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const consoleError = t.mock.method(console, "error")
  const appendedElements = []
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
  }
  globalThis.document = {
    getElementById: () => null,
    createElement: () => ({
      style: {},
      dataset: {},
      setAttribute() {},
    }),
    body: {
      append: (element) => appendedElements.push(element),
    },
  }

  let importer
  try {
    importer = new OneSchemaImporterClass({
      baseUrl: "https://embed.test",
      clientId: undefined,
      manageDOM: true,
    })

    assert.equal(importer.iframe ?? undefined, undefined)
    assert.deepEqual(appendedElements, [])
    assert.ok(
      consoleError.mock.calls.some(
        (call) => call.arguments[0] === invalidClientIdMessage,
      ),
    )
  } finally {
    importer?.destroy()
    globalThis.document = previousDocument
    globalThis.window = previousWindow
  }
})

test("URL-encodes valid client IDs in the embed launcher URL", () => {
  const unchanged = createImporter()
  assert.equal(
    unchanged.iframe.src,
    "https://embed.test/embed-launcher?embed_client_id=client-id&dev_mode=true",
  )
  unchanged.importer.destroy()

  const encoded = createImporter({ clientId: "client id/one" })
  assert.equal(
    encoded.iframe.src,
    "https://embed.test/embed-launcher?embed_client_id=client%20id%2Fone&dev_mode=true",
  )
  encoded.importer.destroy()
})

test("launchSession returns the client ID failure", (t) => {
  const consoleError = t.mock.method(console, "error")
  const { importer } = createImporter({ clientId: "" })
  const launchedEvents = []
  importer.on("launched", (status) => launchedEvents.push(status))
  const expected = {
    success: false,
    error: OneSchemaLaunchError.LaunchError,
    message: invalidClientIdMessage,
  }

  assert.deepEqual(importer.launchSession({ sessionToken: "tok" }), expected)
  assert.equal(launchedEvents.length, 1)
  assert.deepEqual(launchedEvents[0], expected)
  assert.ok(
    consoleError.mock.calls.some((call) => call.arguments[0] === invalidClientIdMessage),
  )

  importer.destroy()
})
