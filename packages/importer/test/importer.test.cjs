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
  const storage = new Map()
  globalThis.window = {
    addEventListener(_type, listener) {
      listeners.push(listener)
    },
    removeEventListener() {},
    location: { origin: "https://host.test" },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
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

  const post = (data, origin = "https://embed.test") =>
    listeners.forEach((listener) =>
      listener({ source: iframe.contentWindow, origin, data }),
    )

  // The embed echoes the embed init id of the init message it is replying to,
  // so a reply that stands for a real embed carries the id of the latest one.
  const reply = (data) =>
    post({
      embedInitId: messages[messages.length - 1].payload.embedInitId,
      ...data,
    })

  return { iframe, importer, messages, post, reply, storage }
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
  assert.equal(failures[0].embedInitId, failure.embedInitId)

  importer.destroy()
})

test("resolves with the running session once the embed launches", async () => {
  const { iframe, importer, reply } = createImporter()
  const statuses = []
  importer.on("launched", (status) => statuses.push(status))

  const launched = importer.launch()
  iframe.onload()
  reply({ messageType: "launched", sessionToken: "session-token", embedId: "embed-id" })

  const info = await launched

  assert.equal(info.sessionToken, "session-token")
  assert.equal(info.embedId, "embed-id")
  assert.equal(typeof info.embedInitId, "string")
  assert.equal(statuses.length, 1)
  assert.equal(statuses[0].embedInitId, info.embedInitId)
  assert.equal(importer.status, "launched")

  importer.destroy()
})

test("rejects as soon as the embed reports a launch error", async () => {
  mock.timers.enable({ apis: ["setTimeout"] })

  try {
    const { iframe, importer, reply } = createImporter({ autoClose: false })

    const launched = importer.launch()
    iframe.onload()
    reply({
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

test("still deadlines a launch when initTimeoutMs cannot be one", async () => {
  mock.timers.enable({ apis: ["setTimeout"] })

  try {
    const { importer, messages } = createImporter({
      autoClose: false,
      initTimeoutMs: 0,
    })

    const launched = importer.launch()

    mock.timers.tick(20000)

    const failure = await launched.then(
      () => assert.fail("launch should not resolve without a loaded iframe"),
      (error) => error,
    )

    assert.equal(failure.error, OneSchemaLaunchError.Timeout)
    assert.deepEqual(messages, [])
    assert.equal(importer.status, "idle")

    importer.destroy()
  } finally {
    mock.timers.reset()
  }
})

test("rejects with a timeout when the iframe never loads", async () => {
  mock.timers.enable({ apis: ["setTimeout"] })

  try {
    const { importer, messages } = createImporter({
      autoClose: false,
      initTimeoutMs: 1000,
    })

    const launched = importer.launch()

    assert.deepEqual(messages, [])

    mock.timers.tick(1000)

    const failure = await launched.then(
      () => assert.fail("launch should not resolve without a loaded iframe"),
      (error) => error,
    )

    assert.equal(failure.error, OneSchemaLaunchError.Timeout)
    assert.deepEqual(messages, [])
    assert.equal(importer.status, "idle")

    importer.destroy()
  } finally {
    mock.timers.reset()
  }
})

test("ignores a terminal reply from an abandoned launch", async () => {
  const { iframe, importer, post, messages } = createImporter({ autoClose: false })
  const statuses = []
  importer.on("launched", (status) => statuses.push(status))

  const abandoned = launch(importer)
  iframe.onload()
  const abandonedId = messages[0].payload.embedInitId

  const current = importer.launch()
  const currentId = messages[messages.length - 1].payload.embedInitId

  assert.notEqual(abandonedId, currentId)

  post({
    messageType: "launch-error",
    embedInitId: abandonedId,
    message: "too late",
  })
  post({
    messageType: "launched",
    embedInitId: abandonedId,
    sessionToken: "stale-token",
  })

  assert.equal(
    (await abandoned.then(null, (error) => error)).error,
    OneSchemaLaunchError.Cancelled,
  )
  assert.equal(importer.status, "launching")

  post({
    messageType: "launched",
    embedInitId: currentId,
    sessionToken: "session-token",
  })

  const info = await current

  assert.equal(info.sessionToken, "session-token")
  assert.equal(info.embedInitId, currentId)
  assert.deepEqual(
    statuses.map((status) => status.embedInitId),
    [currentId],
  )

  importer.destroy()
})

test("ignores a reply that names no launch attempt at all", async () => {
  const { iframe, importer, post, messages } = createImporter({ autoClose: false })
  const statuses = []
  const results = []
  importer.on("launched", (status) => statuses.push(status))
  importer.on("success", (result) => results.push(result))

  launch(importer)
  iframe.onload()

  const current = importer.launch()
  const currentId = messages[messages.length - 1].payload.embedInitId
  let settled = false
  current.then(
    () => (settled = true),
    () => (settled = true),
  )

  post({ messageType: "launched", sessionToken: "stale-token" })
  post({ messageType: "complete", data: { rows: [] } })
  await Promise.resolve()

  assert.equal(settled, false)
  assert.equal(importer.status, "launching")
  assert.deepEqual(statuses, [])
  assert.deepEqual(results, [])

  post({
    messageType: "launched",
    embedInitId: currentId,
    sessionToken: "session-token",
  })

  assert.equal((await current).sessionToken, "session-token")

  importer.destroy()
})

test("ignores a reply that did not come from the embed origin", async () => {
  const { iframe, importer, post, messages } = createImporter({ autoClose: false })
  const statuses = []
  importer.on("launched", (status) => statuses.push(status))

  const current = importer.launch()
  iframe.onload()
  const currentId = messages[messages.length - 1].payload.embedInitId
  let settled = false
  current.then(
    () => (settled = true),
    () => (settled = true),
  )

  post(
    { messageType: "launched", embedInitId: currentId, sessionToken: "evil-token" },
    "https://evil.test",
  )
  await Promise.resolve()

  assert.equal(settled, false)
  assert.equal(importer.status, "launching")
  assert.deepEqual(statuses, [])

  post({
    messageType: "launched",
    embedInitId: currentId,
    sessionToken: "session-token",
  })

  assert.equal((await current).sessionToken, "session-token")

  importer.destroy()
})

test("posts init for a launch that replaces an acknowledged one", async () => {
  const { iframe, importer, post, reply, messages } = createImporter({
    autoClose: false,
  })

  launch(importer)
  iframe.onload()
  reply({ messageType: "init-received" })

  const current = importer.launch()

  assert.equal(messages.length, 2)
  const currentId = messages[1].payload.embedInitId
  assert.notEqual(currentId, messages[0].payload.embedInitId)

  post({ messageType: "launched", embedInitId: currentId })

  assert.equal((await current).embedInitId, currentId)

  importer.destroy()
})

test("posts init for a launch that replaces a running session", async () => {
  const { iframe, importer, post, messages } = createImporter({ autoClose: false })

  const first = importer.launch()
  iframe.onload()
  post({ messageType: "launched", embedInitId: messages[0].payload.embedInitId })
  await first
  assert.equal(importer.status, "launched")

  const replacement = importer.launch()

  assert.equal(messages.length, 2)
  assert.equal(importer.status, "launching")

  const replacementId = messages[1].payload.embedInitId
  post({ messageType: "launched", embedInitId: replacementId })

  assert.equal((await replacement).embedInitId, replacementId)

  importer.destroy()
})

test("keeps retrying init when a replaced launch is acknowledged late", async (t) => {
  const clock = t.mock.timers
  clock.enable({ apis: ["setTimeout"] })

  const { iframe, importer, post, messages } = createImporter({ autoClose: false })

  launch(importer)
  iframe.onload()
  const abandonedId = messages[0].payload.embedInitId

  const current = importer.launch()
  const currentId = messages[1].payload.embedInitId

  post({ messageType: "init-received", embedInitId: abandonedId })
  clock.tick(500)

  assert.equal(messages.length, 3)
  assert.equal(messages[2].payload.embedInitId, currentId)

  post({ messageType: "init-received", embedInitId: currentId })
  clock.tick(500)

  assert.equal(messages.length, 3)

  post({ messageType: "launched", embedInitId: currentId })
  assert.equal((await current).embedInitId, currentId)

  importer.destroy()
})

test("ignores a completion from a session a later launch replaced", async () => {
  const { iframe, importer, post, messages } = createImporter({ autoClose: true })
  const results = []
  importer.on("success", (result) => results.push(result))

  const first = importer.launch()
  iframe.onload()
  const firstId = messages[0].payload.embedInitId
  post({ messageType: "launched", embedInitId: firstId })
  await first

  const replacement = importer.launch()
  const replacementId = messages[1].payload.embedInitId

  post({ messageType: "complete", embedInitId: firstId, data: { rows: [] } })

  assert.deepEqual(results, [])
  assert.equal(importer.status, "launching")

  post({ messageType: "launched", embedInitId: replacementId })
  await replacement

  post({ messageType: "complete", embedInitId: replacementId, data: { rows: [] } })

  assert.deepEqual(results, [{ type: "local", data: { rows: [] } }])

  importer.destroy()
})

test("ignores a terminal reply that arrives after the launch was closed", async () => {
  const { iframe, importer, post, messages } = createImporter({ autoClose: false })
  const statuses = []
  importer.on("launched", (status) => statuses.push(status))

  const launched = launch(importer)
  iframe.onload()
  const attempt = messages[0].payload.embedInitId

  importer.close()
  assert.equal(
    (await launched.then(null, (error) => error)).error,
    OneSchemaLaunchError.Cancelled,
  )

  post({
    messageType: "launched",
    embedInitId: attempt,
    sessionToken: "late-token",
  })

  assert.equal(importer.status, "idle")
  assert.equal(iframe.style.display, "none")
  assert.deepEqual(
    statuses.map((status) => status.success),
    [],
  )

  importer.destroy()
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

test("rejects the launch in flight when the importer is destroyed", async () => {
  const { iframe, importer } = createImporter()

  const launched = importer.launch()
  iframe.onload()
  importer.destroy()

  const failure = await launched.then(
    () => assert.fail("launch should not resolve after destroy"),
    (error) => error,
  )

  assert.equal(failure.error, OneSchemaLaunchError.Cancelled)
})

// A handler is awaited, so the cleanup that follows it lands a few microtasks
// (or, when a timeout is involved, a few milliseconds) later.
function drain(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const RESUME_TOKEN_KEY = "OneSchema-session-user-jwt-template-key"

async function launchWithHandler(params) {
  const created = createImporter({ saveSession: true, ...params })
  const { iframe, importer, reply } = created

  const launched = importer.launch()
  iframe.onload()
  reply({ messageType: "launched", sessionToken: "saved-token" })
  await launched

  return created
}

test("waits for an async success handler before ending the session", async () => {
  let release
  const { iframe, importer, reply, storage } = await launchWithHandler()
  importer.on("success", () => new Promise((resolve) => (release = resolve)))

  reply({ messageType: "complete", data: { rows: [] } })
  await drain()

  assert.equal(storage.get(RESUME_TOKEN_KEY), "saved-token")
  assert.equal(iframe.style.display, "initial")

  release()
  await drain()

  assert.equal(storage.get(RESUME_TOKEN_KEY), undefined)
  assert.equal(iframe.style.display, "none")

  importer.destroy()
})

test("awaits a cancel handler on the same terms as a success handler", async () => {
  let release
  const { iframe, importer, reply } = await launchWithHandler()
  importer.on("cancel", () => new Promise((resolve) => (release = resolve)))

  reply({ messageType: "cancel" })
  await drain()

  assert.equal(iframe.style.display, "initial")

  release()
  await drain()

  assert.equal(iframe.style.display, "none")

  importer.destroy()
})

test("reports a failing success handler as an error and still ends the session", async () => {
  const errors = []
  const { iframe, importer, reply, storage } = await launchWithHandler()
  importer.on("error", (error) => errors.push(error))
  importer.on("success", () => {
    throw new Error("host handler blew up")
  })

  reply({ messageType: "complete", data: { rows: [] } })
  await drain()

  assert.equal(errors.length, 1)
  assert.match(errors[0].message, /host handler blew up/)
  assert.equal(errors[0].severity, "error")
  assert.equal(errors[0].cause.message, "host handler blew up")
  assert.equal(storage.get(RESUME_TOKEN_KEY), undefined)
  assert.equal(iframe.style.display, "none")

  importer.destroy()
})

test("ends the session without a handler that outlives handlerTimeoutMs", async () => {
  let reject
  const errors = []
  const { iframe, importer, reply, storage } = await launchWithHandler({
    handlerTimeoutMs: 10,
  })
  importer.on("error", (error) => errors.push(error))
  importer.on("success", () => new Promise((_resolve, fail) => (reject = fail)))

  reply({ messageType: "complete", data: { rows: [] } })
  await drain(30)

  assert.equal(errors.length, 1)
  assert.match(errors[0].message, /handlerTimeoutMs \(10ms\)/)
  assert.equal(storage.get(RESUME_TOKEN_KEY), undefined)
  assert.equal(iframe.style.display, "none")

  // The handler is abandoned, not ignored: how it eventually ended is still
  // reported rather than surfacing as an unhandled rejection.
  reject(new Error("host handler blew up late"))
  await drain()

  assert.equal(errors.length, 2)
  assert.match(errors[1].message, /host handler blew up late/)

  importer.destroy()
})

test("waits without a bound when handlerTimeoutMs is zero", async () => {
  let release
  const errors = []
  const { iframe, importer, reply } = await launchWithHandler({ handlerTimeoutMs: 0 })
  importer.on("error", (error) => errors.push(error))
  importer.on("success", () => new Promise((resolve) => (release = resolve)))

  reply({ messageType: "complete", data: { rows: [] } })
  await drain(30)

  assert.deepEqual(errors, [])
  assert.equal(iframe.style.display, "initial")

  release()
  await drain()

  assert.equal(iframe.style.display, "none")

  importer.destroy()
})

test("reports every failing handler and times them apart", async () => {
  let rejectLate
  const errors = []
  const { importer, reply } = await launchWithHandler({ handlerTimeoutMs: 10 })
  importer.on("error", (error) => errors.push(error))
  importer.on("success", async () => {
    throw new Error("first handler blew up")
  })
  importer.on("success", () => new Promise((_resolve, fail) => (rejectLate = fail)))

  reply({ messageType: "complete", data: { rows: [] } })
  await drain(30)

  // The first handler failing must not swallow the second's timeout.
  assert.deepEqual(
    errors.map((error) => error.message),
    [
      'OneSchema "success" handler failed: first handler blew up',
      'OneSchema "success" handler failed: OneSchema "success" handler did not settle within handlerTimeoutMs (10ms)',
    ],
  )

  rejectLate(new Error("second handler blew up late"))
  await drain()

  assert.match(errors[2].message, /second handler blew up late/)

  importer.destroy()
})

test("runs a handler with the context it was registered with", async () => {
  const contexts = []
  const host = { name: "host" }
  const { importer, reply } = await launchWithHandler()
  importer.on(
    "success",
    function handler() {
      contexts.push(this)
    },
    host,
  )
  importer.once(
    "success",
    function onceHandler() {
      contexts.push(this)
    },
    host,
  )

  reply({ messageType: "complete", data: { rows: [] } })
  await drain()

  assert.deepEqual(contexts, [host, host])
  assert.equal(importer.listenerCount("success"), 1)

  importer.destroy()
})

test("ignores a terminal message the embed repeats while a handler runs", async () => {
  let release
  const results = []
  const { importer, reply } = await launchWithHandler({ autoClose: false })
  importer.on("success", (result) => {
    results.push(result)
    return new Promise((resolve) => (release = resolve))
  })

  reply({ messageType: "complete", data: { rows: [1] } })
  await drain()
  reply({ messageType: "complete", data: { rows: [2] } })
  await drain()

  release()
  await drain()

  assert.deepEqual(results, [{ type: "local", data: { rows: [1] } }])

  importer.destroy()
})

test("tags the import result with how the data was delivered", async () => {
  const results = []
  const { iframe, importer, reply } = createImporter({ autoClose: false })
  importer.on("success", (result) => results.push(result))

  // Each delivery needs its own launch: a session stops accepting terminal
  // messages once it has handed one to the host.
  launch(importer)
  iframe.onload()
  reply({ messageType: "launched" })
  reply({ messageType: "complete", data: { rows: [] } })
  await drain()

  launch(importer)
  reply({ messageType: "launched" })
  reply({ messageType: "complete", eventId: "event-id", responses: [{ status: 200 }] })
  await drain()

  launch(importer, {
    importConfig: { type: "file-upload", url: "https://upload.test/file" },
  })
  reply({ messageType: "launched" })
  reply({ messageType: "complete", data: { count: 2 } })
  await drain()

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
    const { iframe, importer, messages, reply } = createImporter({
      autoClose: false,
    })

    launch(importer)
    iframe.onload()

    assert.equal(importer.status, "launching")
    assert.equal(messages.length, 1)

    reply({ messageType: "launch-error", message: "invalid template" })

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
  const { iframe, importer, messages, reply } = createImporter({
    autoClose: false,
  })

  launch(importer)
  iframe.onload()

  reply({ messageType: "init-received" })
  reply({ messageType: "launch-error", message: "invalid template" })

  assert.equal(importer.status, "idle")

  launch(importer)

  assert.equal(messages.length, 2)
  assert.equal(importer.status, "launching")

  importer.destroy()
})

test("stores a resume token only for a launch that asked to save the session", async () => {
  const { iframe, importer, reply, storage } = createImporter({
    autoClose: false,
    saveSession: true,
  })

  const saved = importer.launch()
  iframe.onload()
  reply({ messageType: "launched", sessionToken: "saved-token" })
  await saved

  const key = "OneSchema-session-user-jwt-template-key"
  assert.equal(storage.get(key), "saved-token")

  const session = importer.launchSession({ sessionToken: "host-token" })
  reply({ messageType: "launched", sessionToken: "replacement-token" })
  await session

  assert.equal(storage.get(key), "saved-token")

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
