const assert = require("node:assert/strict")
const { mock, test } = require("node:test")

const { version } = require("../package.json")
const {
  OneSchemaImporterClass,
  OneSchemaLaunchError,
  OneSchemaLaunchFailure,
} = require("../dist/main.js")

// launch() rejects on failure, and most tests here only care about the state
// left behind, so the rejection is kept but not left floating.
function launch(importer, params) {
  const launched = importer.launch(params)
  launched.catch(() => {})
  return launched
}

function createImporter(params) {
  const listeners = []
  globalThis.window = {
    addEventListener(_type, listener) {
      listeners.push(listener)
    },
    removeEventListener() {},
    location: { origin: "https://host.test" },
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
  launch(importer)
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
  launch(first.importer)
  first.iframe.onload()

  const second = createImporter()
  launch(second.importer)

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

  launch(second.importer)
  second.iframe.onload()

  assert.equal(second.messages.length, 1)

  second.importer.destroy()
})

test("defaults the file-upload format without touching the caller's config", () => {
  const { iframe, importer, messages } = createImporter()
  const importConfig = { type: "file-upload", url: "https://upload.test/file" }

  launch(importer, { importConfig })
  iframe.onload()

  assert.equal(messages[0].payload.importConfig.format, "csv")
  assert.deepEqual(importConfig, {
    type: "file-upload",
    url: "https://upload.test/file",
  })

  importer.destroy()
})

test("rejects and stays idle when launch params are invalid", async () => {
  const importer = new OneSchemaImporterClass({
    baseUrl: "https://embed.test",
    clientId: "client-id",
    manageDOM: false,
  })

  const failures = []
  importer.on("launched", (status) => failures.push(status))

  const failure = await importer.launch().then(
    () => assert.fail("launch should not resolve without a userJwt"),
    (error) => error,
  )

  assert.ok(failure instanceof OneSchemaLaunchFailure)
  assert.equal(failure.error, OneSchemaLaunchError.MissingJwt)
  assert.equal(importer.status, "idle")
  assert.equal(failures.length, 1)
  assert.equal(failures[0].correlationId, failure.correlationId)

  importer.destroy()
})

test("resolves with the running session once the embed launches", async () => {
  const { iframe, importer, post } = createImporter()

  const launched = importer.launch()
  iframe.onload()
  post({ messageType: "launched", sessionToken: "session-token", embedId: "embed-id" })

  assert.deepEqual(await launched, {
    sessionToken: "session-token",
    embedId: "embed-id",
  })
  assert.equal(importer.status, "launched")

  importer.destroy()
})

test("rejects as soon as the embed reports a launch error", async () => {
  mock.timers.enable({ apis: ["setTimeout"] })

  try {
    const { iframe, importer, post } = createImporter({ autoClose: false })

    const launched = importer.launch()
    iframe.onload()
    post({
      messageType: "launch-error",
      message: { message: "invalid template", status: 422, data: { code: "bad" } },
    })

    const failure = await launched.then(
      () => assert.fail("launch should not resolve after launch-error"),
      (error) => error,
    )

    assert.equal(failure.error, OneSchemaLaunchError.LaunchError)
    assert.equal(failure.message, "invalid template")
    assert.equal(failure.status, 422)
    assert.deepEqual(failure.data, { code: "bad" })
    assert.deepEqual(failure.cause, {
      message: "invalid template",
      status: 422,
      data: { code: "bad" },
    })

    importer.destroy()
  } finally {
    mock.timers.reset()
  }
})

test("rejects with a timeout when the embed never acknowledges init", async () => {
  mock.timers.enable({ apis: ["setTimeout"] })

  try {
    const { iframe, importer, messages } = createImporter({
      autoClose: false,
      initTimeoutMs: 1000,
    })

    const launched = importer.launch()
    iframe.onload()

    assert.equal(messages.length, 1)

    // Each tick only runs the timers already scheduled, and every retry
    // schedules the next one.
    mock.timers.tick(500)
    mock.timers.tick(500)
    mock.timers.tick(500)

    const failure = await launched.then(
      () => assert.fail("launch should not resolve without an acknowledgement"),
      (error) => error,
    )

    assert.equal(failure.error, OneSchemaLaunchError.Timeout)
    assert.equal(messages.length, 2)
    assert.equal(importer.status, "idle")

    importer.destroy()
  } finally {
    mock.timers.reset()
  }
})

test("rejects the launch in flight when the importer is closed", async () => {
  const { iframe, importer } = createImporter()

  const launched = importer.launch()
  iframe.onload()
  importer.close()

  const failure = await launched.then(
    () => assert.fail("launch should not resolve after close"),
    (error) => error,
  )

  assert.equal(failure.error, OneSchemaLaunchError.Cancelled)

  importer.destroy()
})

test("tags the import result with how the data was delivered", async () => {
  const results = []
  const { iframe, importer, post } = createImporter({ autoClose: false })
  importer.on("success", (result) => results.push(result))

  launch(importer)
  iframe.onload()
  post({ messageType: "complete", data: { rows: [] } })
  post({ messageType: "complete", eventId: "event-id", responses: [{ status: 200 }] })

  launch(importer, {
    importConfig: { type: "file-upload", url: "https://upload.test/file" },
  })
  post({ messageType: "complete", data: { count: 2 } })

  assert.deepEqual(results, [
    { type: "local", data: { rows: [] } },
    { type: "webhook", eventId: "event-id", responses: [{ status: 200 }] },
    { type: "file-upload", data: { count: 2 } },
  ])

  importer.destroy()
})

test("returns to idle and stops retrying when the embed rejects the launch", () => {
  mock.timers.enable({ apis: ["setTimeout"] })

  try {
    const { iframe, importer, messages, post } = createImporter({
      autoClose: false,
    })

    launch(importer)
    iframe.onload()

    assert.equal(importer.status, "launching")
    assert.equal(messages.length, 1)

    post({ messageType: "launch-error", message: "invalid template" })

    assert.equal(importer.status, "idle")

    // The retry scheduled before the rejection must not post again.
    mock.timers.tick(5000)

    assert.equal(messages.length, 1)

    importer.destroy()
  } finally {
    mock.timers.reset()
  }
})

test("can relaunch after the embed acknowledged the rejected launch", () => {
  const { iframe, importer, messages, post } = createImporter({
    autoClose: false,
  })

  launch(importer)
  iframe.onload()

  post({ messageType: "init-received" })
  post({ messageType: "launch-error", message: "invalid template" })

  assert.equal(importer.status, "idle")

  launch(importer)

  assert.equal(messages.length, 2)
  assert.equal(importer.status, "launching")

  importer.destroy()
})

test("reports where the instance is in its lifecycle", () => {
  const { iframe, importer } = createImporter()

  assert.equal(importer.status, "idle")

  launch(importer)
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
