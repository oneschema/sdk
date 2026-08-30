import { EventEmitter } from "eventemitter3"
import { version } from "../package.json"
import {
  BaseFileUploadImportConfig,
  DEFAULT_PARAMS,
  OneSchemaError,
  OneSchemaErrorSeverity,
  OneSchemaEventMap,
  OneSchemaImporterStatus,
  OneSchemaImportResult,
  OneSchemaInitMessage,
  OneSchemaInitSessionMessage,
  OneSchemaInitSimpleMessage,
  OneSchemaLaunchError,
  OneSchemaLaunchInfo,
  OneSchemaLaunchParams,
  OneSchemaLaunchSessionParams,
  OneSchemaLaunchStatus,
  OneSchemaParams,
  OneSchemaSharedInitParams,
} from "./config"
import { OneSchemaLaunchFailure } from "./launch-failure"
import { merged } from "./shared/utils"

const LAUNCH_RETRY_DELAY_MS = 500

const CANCELLED_MESSAGE =
  "OneSchema launch was cancelled before the import session started"

let correlationCount = 0

function correlationId(): string {
  return `${Date.now().toString(36)}-${++correlationCount}`
}

let iframeCount = 0

const IMPORTER_EMBED_MARKER = "importer.oneschema.co"

const DESTROYED_MESSAGE =
  "OneSchema importer instance was destroyed, create a new one to import again"

const DEFAULT_LAUNCH_ERROR_MESSAGE = "OneSchema failed to launch the import session"

/**
 * The embed sends the launch failure as `{ message, data, status }`, but older
 * embed versions send a plain string instead.
 */
function parseLaunchErrorDetail(
  detail: unknown,
): Pick<OneSchemaLaunchStatus, "message" | "status" | "data"> {
  if (typeof detail === "string") {
    return { message: detail }
  }

  if (detail && typeof detail === "object") {
    const { message, status, data } = detail as Record<string, unknown>
    return {
      message: typeof message === "string" ? message : DEFAULT_LAUNCH_ERROR_MESSAGE,
      status: typeof status === "number" ? status : undefined,
      data,
    }
  }

  return { message: DEFAULT_LAUNCH_ERROR_MESSAGE }
}

/**
 * OneSchemaImporter class manages the iframe used for importing data in your
 * application and emits events based on what happens.
 */
export class OneSchemaImporterClass extends EventEmitter<OneSchemaEventMap> {
  #params: OneSchemaParams
  iframe?: HTMLIFrameElement

  #client = "Importer"
  #version = version
  #coreVersion = version

  #resumeTokenKey = ""
  #hasAttemptedLaunch = false
  #destroyed = false
  #onWindowMessage = (event: MessageEvent) => this.#iframeEventListener(event)
  #hasLaunched = false
  #hasCancelled = false
  #launchGeneration = 0
  #initMessage?: OneSchemaInitMessage
  #hasAppReceivedInitMessage = false
  // NOTE: This describes the iframe, which persists across launches, so it is
  // not reset in close().
  #hasReceivedFrameMessage = false
  #iframeIsLoaded = false
  #launchOnLoad = false
  #pendingLaunch?: {
    correlationId: string
    resolve: (info: OneSchemaLaunchInfo) => void
    reject: (failure: OneSchemaLaunchFailure) => void
  }
  #launchDeadline?: ReturnType<typeof setTimeout>
  #launchCorrelationId?: string

  constructor(params: OneSchemaParams) {
    super()

    this.#params = merged(DEFAULT_PARAMS, params)

    // Limit usage to browser only.
    if (typeof window === "undefined") {
      return
    }

    window.addEventListener("message", this.#onWindowMessage)

    if (this.#params.manageDOM) {
      const iframe = document.createElement("iframe")
      iframe.id = `_oneschema-iframe-${++iframeCount}`
      this.setIframe(iframe)
      this.setParent(this.#resolveParent())
    }
  }

  #resolveParent(): HTMLElement {
    if (this.#params.parent) {
      return this.#params.parent
    }

    if (this.#params.parentId) {
      console.warn(
        "OneSchema: parentId is deprecated, pass parent as an HTMLElement instead",
      )
      const parent = document.getElementById(this.#params.parentId)
      if (parent) {
        return parent
      }

      console.error(
        `OneSchema config error: no element with id "${this.#params.parentId}" exists yet, appending the importer to document.body instead`,
      )
    }

    return document.body
  }

  /**
   * Where this instance is in its lifecycle:
   *
   * - `idle`: created and never launched, closed, or launched and failed, and
   *   ready to launch again
   * - `launching`: `launch()` was called and the import session is starting
   * - `launched`: the import session is running and the iframe is shown
   * - `destroyed`: `destroy()` was called and the instance is inert
   */
  get status(): OneSchemaImporterStatus {
    if (this.#destroyed) {
      return "destroyed"
    }

    if (this.#hasLaunched) {
      return "launched"
    }

    return this.#hasAttemptedLaunch ? "launching" : "idle"
  }

  /**
   * Set the name and version of the client, used for logging/debugging
   * @param client
   * @param version
   */
  setClient(client: string, version: string) {
    this.#client = client
    this.#version = version
  }

  /**
   * Set the iframe to be used by the OneSchema importer
   * Should only be used in conjunction with the param of manageDOM false
   * @param iframe
   */
  setIframe(iframe: HTMLIFrameElement) {
    if (this.#destroyed) {
      console.error(DESTROYED_MESSAGE)
      return
    }

    // just in case..
    if (this.iframe) {
      this.close()
      this.#releaseIframe()
    }

    this.iframe = iframe
    this.iframe.setAttribute("allowtransparency", "true")

    const queryParams = []
    queryParams.push(`embed_client_id=${this.#params.clientId}`)
    queryParams.push(`dev_mode=${this.#params.devMode}`)
    if (this.#params.languageCode) {
      queryParams.push(`lng=${this.#params.languageCode}`)
    }

    this.iframe.src = `${this.#params.baseUrl}/embed-launcher?${queryParams.join("&")}`
    this.setClassName(this.#params.className || "")
    if (this.#params.styles) {
      this.setStyles(this.#params.styles)
    }

    this.#iframeIsLoaded = false
    this.iframe.onload = () => {
      this.#iframeIsLoaded = true
      if (this.#launchOnLoad) {
        this.#launchOnLoad = false
        this.#initSession()
      }
    }

    this.#hide()
  }

  /**
   * Will change the CSS class of the iframe.
   *
   * @param className the new CSS class
   */
  setClassName(className: string) {
    if (this.iframe) {
      this.iframe.className = className
    }
  }

  /**
   * Will change the styles of the iframe.
   *
   * @param styles the styles to apply
   */
  setStyles(styles: Partial<CSSStyleDeclaration>) {
    if (this.iframe) {
      // we save display because we use it for whether
      // the iframe is shown or not
      const display = this.iframe.style.display
      Object.assign(this.iframe.style, styles)
      this.iframe.style.display = display
    }
  }

  /**
   * Will change the parent container of the iframe
   * NOTE: will reload the URL, discarding any session in progress
   * @param parent DOM element to append to
   */
  setParent(parent: HTMLElement) {
    if (this.iframe) {
      parent.append(this.iframe)
    }
  }

  /**
   * Launch will show the OneSchema window and initialize the importer session
   * @param launchParams optionally pass in parameter overrides or values not passed into constructor
   */
  launch(
    launchParams?: Partial<OneSchemaLaunchParams> & Partial<OneSchemaLaunchSessionParams>,
  ): Promise<OneSchemaLaunchInfo> {
    if (this.#destroyed) {
      console.error(DESTROYED_MESSAGE)
      return this.#rejectLaunch(OneSchemaLaunchError.Destroyed, DESTROYED_MESSAGE)
    }

    const mergedParams = merged(this.#params, launchParams)
    let importConfig = mergedParams.importConfig
    if (importConfig && importConfig.type === "file-upload" && !importConfig.format) {
      importConfig = {
        ...(importConfig as BaseFileUploadImportConfig),
        format: "csv",
      }
    }

    const attempt = correlationId()
    const baseMessage: OneSchemaSharedInitParams = {
      version: this.#version,
      client: this.#client,
      manualClose: true,
      correlationId: attempt,
    }

    let message: Partial<OneSchemaInitMessage>

    if (mergedParams.sessionToken) {
      message = {
        ...baseMessage,
        messageType: "init-session",
        sessionToken: mergedParams.sessionToken,
      }
    } else {
      message = {
        ...baseMessage,
        messageType: "init",
        userJwt: mergedParams.userJwt,
        templateKey: mergedParams.templateKey,
        importConfig,
        customizationKey: mergedParams.customizationKey,
        customizationOverrides: mergedParams.customizationOverrides,
        templateOverrides: mergedParams.templateOverrides,
        eventWebhookKeys: mergedParams.eventWebhookKeys,
      }
      if (!message.userJwt) {
        const msg = "OneSchema config error: missing userJwt"
        console.error(msg)
        return this.#rejectLaunch(OneSchemaLaunchError.MissingJwt, msg)
      }

      if (!message.templateKey) {
        const msg = "OneSchema config error: missing templateKey"
        console.error(msg)
        return this.#rejectLaunch(OneSchemaLaunchError.MissingTemplate, msg)
      }

      if (mergedParams.saveSession) {
        try {
          this.#resumeTokenKey = `OneSchema-session-${mergedParams.userJwt}-${mergedParams.templateKey}`
          const resumeToken = window.localStorage.getItem(this.#resumeTokenKey)
          if (resumeToken) {
            message.resumeToken = resumeToken
          }
        } catch {
          /* local storage is not available, don't sweat it */
        }
      }
    }

    // A launch already in flight is abandoned rather than joined: its params
    // are not the ones the caller just passed.
    this.#cancelPendingLaunch()

    this.#initMessage = message as OneSchemaInitMessage
    this.#hasAttemptedLaunch = true

    this.#launchCorrelationId = attempt
    const launched = new Promise<OneSchemaLaunchInfo>((resolve, reject) => {
      this.#pendingLaunch = { correlationId: attempt, resolve, reject }
    })

    // The deadline is armed here rather than alongside the retry loop: until
    // the iframe fires its load handler nothing posts to the embed at all, and
    // a launch that never leaves that state still has to fail.
    this.#armLaunchDeadline()
    this.#launch()
    return launched
  }

  /**
   * Report a launch failure the caller can see before anything was posted to
   * the embed: the `launched` event and the rejection share a correlation id.
   */
  #rejectLaunch(
    error: OneSchemaLaunchError,
    message: string,
    detail: { status?: number; data?: unknown } = {},
  ): Promise<OneSchemaLaunchInfo> {
    const failure = new OneSchemaLaunchFailure(error, message, correlationId(), detail)
    this.emit("launched", {
      success: false,
      error,
      message,
      correlationId: failure.correlationId,
      ...detail,
    })
    return Promise.reject(failure)
  }

  #armLaunchDeadline() {
    this.#clearLaunchDeadline()

    const timeout = this.#params.initTimeoutMs ?? 0
    if (timeout <= 0) {
      return
    }

    this.#launchDeadline = setTimeout(() => this.#timeoutLaunch(), timeout)
  }

  #clearLaunchDeadline() {
    if (this.#launchDeadline !== undefined) {
      clearTimeout(this.#launchDeadline)
      this.#launchDeadline = undefined
    }
  }

  #timeoutLaunch() {
    this.#launchDeadline = undefined
    if (this.#hasLaunched || this.#destroyed) {
      return
    }

    const msg = this.#hasReceivedFrameMessage
      ? "OneSchema failed to respond for initialization"
      : `OneSchema iframe was blocked: no message was ever received from ${this.iframe?.src}, so the OneSchema embed page never ran. The browser most likely blocked the iframe — check this page's console for a Content-Security-Policy "frame-ancestors" violation, and verify that this page's origin (${window.location.origin}) is on the allowed domains list for OneSchema client ID ${this.#params.clientId}.`
    console.error(msg)
    const correlation = this.#settlePendingLaunchFailure(
      OneSchemaLaunchError.Timeout,
      msg,
    )
    this.emit("launched", {
      success: false,
      error: OneSchemaLaunchError.Timeout,
      message: msg,
      correlationId: correlation,
    })
    this.#failLaunch()
    if (this.#params.devMode) {
      // Display the iframe for debugging purposes.
      this.#show()
    } else if (this.#params.autoClose) {
      this.close()
    }
  }

  #cancelPendingLaunch() {
    this.#settlePendingLaunchFailure(OneSchemaLaunchError.Cancelled, CANCELLED_MESSAGE)
  }

  /**
   * Fail the launch in flight, if there is one. Returns the correlation id of
   * the attempt so the `launched` event can carry it too.
   */
  #settlePendingLaunchFailure(
    error: OneSchemaLaunchError,
    message: string,
    detail: { status?: number; data?: unknown; cause?: unknown } = {},
  ): string | undefined {
    this.#clearLaunchDeadline()

    const pending = this.#pendingLaunch
    if (!pending) {
      return undefined
    }

    this.#pendingLaunch = undefined
    pending.reject(
      new OneSchemaLaunchFailure(error, message, pending.correlationId, detail),
    )
    return pending.correlationId
  }

  /**
   * DEPRECATED: use `launch` instead.
   * Launch session will show the OneSchema window and initialize the importer session with the given session token
   * @param launchParams optionally pass in parameter overrides or values not passed into constructor
   */
  launchSession(
    launchParams?: Partial<OneSchemaLaunchSessionParams>,
  ): Promise<OneSchemaLaunchInfo> {
    return this.launch(launchParams)
  }

  // Moving the iframe in the DOM reloads it, so the launch waits on the load
  // handler set in setIframe rather than replacing it.
  #launch() {
    if (this.#iframeIsLoaded) {
      this.#initSession()
    } else {
      this.#launchOnLoad = true
    }
  }

  #initSession() {
    this.#hasCancelled = false
    // Both flags belong to the attempt that set them: a launch replacing an
    // acknowledged or already running one still has to post its own init
    // message, and the retry loop stops on either flag.
    this.#hasAppReceivedInitMessage = false
    this.#hasLaunched = false
    this.#initWithRetry(++this.#launchGeneration)
  }

  // A terminal launch failure ends the attempt: bumping the generation strands
  // the scheduled retry so it cannot keep posting, or overlap the loop of a
  // later launch, and the instance is idle again rather than stuck launching.
  #failLaunch() {
    this.#launchGeneration++
    this.#hasAttemptedLaunch = false
    this.#hasAppReceivedInitMessage = false
  }

  // The embed acknowledges the init message with "init-received", so the
  // message is repeated LAUNCH_RETRY_DELAY_MS apart until it does. The loop is
  // bounded by the launch deadline rather than a retry count.
  #initWithRetry(generation: number) {
    if (
      generation !== this.#launchGeneration ||
      this.#hasLaunched ||
      this.#hasCancelled ||
      this.#hasAppReceivedInitMessage
    ) {
      return
    }

    this.#iframeEventEmit(this.#initMessage || {})
    setTimeout(() => this.#initWithRetry(generation), LAUNCH_RETRY_DELAY_MS)
  }

  #resetSession(
    launchParams?: Partial<OneSchemaLaunchParams> & Partial<OneSchemaLaunchSessionParams>,
  ) {
    if (this.#resumeTokenKey) {
      try {
        window.localStorage.removeItem(this.#resumeTokenKey)
      } catch {
        /* local storage is not available, don't sweat it */
      }
    }
    this.close()
    setTimeout(() => {
      // The relaunch is the embed's, not a caller's, so its failure is only
      // reportable through the launched event.
      this.launch(launchParams).catch(() => undefined)
    })
  }

  /**
   * Close will stop the importing session and hide the OneSchema window
   * @param clean equivalent to calling `destroy()`
   */
  close(clean?: boolean) {
    if (this.#destroyed) {
      return
    }

    if (clean) {
      this.destroy()
      return
    }

    this.#hide()
    if (this.iframe && this.#iframeIsLoaded) {
      this.#iframeEventEmit({ messageType: "close" })
    }

    this.#cancelPendingLaunch()

    this.#launchOnLoad = false
    this.#hasAttemptedLaunch = false
    this.#hasAppReceivedInitMessage = false
    this.#hasLaunched = false
    this.#hasCancelled = true
  }

  /**
   * Destroy will close the importing session and release everything this
   * instance holds: its window message listener, its event listeners and, when
   * `manageDOM` is true, its iframe. The instance is inert afterwards and
   * cannot be launched again.
   *
   * Safe to call more than once.
   */
  destroy() {
    if (this.#destroyed) {
      return
    }

    this.close()
    this.#destroyed = true

    if (typeof window !== "undefined") {
      window.removeEventListener("message", this.#onWindowMessage)
    }

    this.removeAllListeners()
    this.#releaseIframe()
  }

  #releaseIframe() {
    if (!this.iframe) {
      return
    }

    this.iframe.onload = null
    if (this.#params.manageDOM) {
      this.iframe.remove()
    }

    this.iframe = undefined
    this.#iframeIsLoaded = false
    this.#launchOnLoad = false
  }

  #iframeEventEmit(message: Record<string, any>) {
    // NOTE: Deep-clone via JSON round-trip to strip non-structurally-cloneable
    // wrappers (e.g. Vue reactive Proxies) before passing to postMessage.
    const payload = JSON.parse(
      JSON.stringify({
        version: this.#version,
        client: this.#client,
        coreVersion: this.#coreVersion,
        "@from": `${this.#client}#${this.#version}`,
        "@to": IMPORTER_EMBED_MARKER,
        ...message,
      }),
    )
    this.iframe?.contentWindow?.postMessage(payload, this.#params.baseUrl!)
  }

  emitErrorEvent(error: OneSchemaError) {
    this.emit("error", error)
  }

  // The embed reports a `complete` payload of rows for both local and
  // file-upload imports, and only the init message this instance sent says
  // which one was configured.
  #importResult(data: {
    data?: Record<string, unknown>
    eventId?: string
    responses?: unknown[]
  }): OneSchemaImportResult {
    if (!data.data) {
      return {
        type: "webhook",
        eventId: data.eventId,
        responses: data.responses,
      }
    }

    const importType = (this.#initMessage as OneSchemaInitSimpleMessage)?.importConfig
      ?.type
    return {
      type: importType === "file-upload" ? "file-upload" : "local",
      data: data.data,
    }
  }

  // Terminal replies only belong to a launch that is still waiting for one.
  // Embeds released before 0.8 do not echo the correlation id, so a reply
  // without one is attributed to that launch.
  #isStaleLaunchReply(replyCorrelationId: unknown): boolean {
    const pending = this.#pendingLaunch
    return (
      !pending ||
      (typeof replyCorrelationId === "string" &&
        replyCorrelationId !== pending.correlationId)
    )
  }

  #hide() {
    if (this.iframe) {
      this.iframe.style.display = "none"
    }
  }

  #show() {
    if (this.iframe) {
      this.iframe.style.display = "initial"
    }
  }

  #iframeEventListener({ source, data }: MessageEvent) {
    if (this.#destroyed || source !== this.iframe?.contentWindow) {
      return
    }
    this.#hasReceivedFrameMessage = true

    switch (data.messageType) {
      case "page-loaded": {
        this.emit("page-loaded", {})
        return
      }

      // spell-checker: disable
      // NOTE: Was misspelled as "init-recieved" in older versions.
      // spell-checker: enable
      // The correct spelling added in 2024-10.
      case "init-received": {
        this.#hasAppReceivedInitMessage = true
        return
      }

      case "launched": {
        const pending = this.#pendingLaunch
        if (!pending || this.#isStaleLaunchReply(data.correlationId)) {
          return
        }

        this.#hasLaunched = true
        let sessionToken = data.sessionToken
        const embedId = data.embedId
        if (this.#resumeTokenKey && sessionToken) {
          try {
            window.localStorage.setItem(this.#resumeTokenKey, sessionToken)
          } catch {
            /* local storage is not available, don't sweat it */
          }
        }
        // if sessionToken is undefined, then we init with one
        // and want to echo it back out
        if (!sessionToken) {
          sessionToken =
            (this.#initMessage as OneSchemaInitSimpleMessage)?.resumeToken ||
            (this.#initMessage as OneSchemaInitSessionMessage)?.sessionToken
        }
        this.#pendingLaunch = undefined
        this.#clearLaunchDeadline()
        const info: OneSchemaLaunchInfo = {
          correlationId: pending.correlationId,
          sessionToken,
          embedId,
        }
        this.emit("launched", { success: true, ...info })
        this.#show()
        pending.resolve(info)
        return
      }

      case "launch-error": {
        if (this.#isStaleLaunchReply(data.correlationId)) {
          return
        }

        const detail = parseLaunchErrorDetail(data.message)
        const correlation = this.#settlePendingLaunchFailure(
          OneSchemaLaunchError.LaunchError,
          detail.message || DEFAULT_LAUNCH_ERROR_MESSAGE,
          { ...detail, cause: data.message },
        )
        this.emit("launched", {
          success: false,
          error: OneSchemaLaunchError.LaunchError,
          correlationId: correlation,
          ...detail,
        })
        this.#failLaunch()
        if (this.#params.devMode) {
          this.#show()
        } else if (this.#params.autoClose) {
          this.close()
        }
        return
      }

      case "complete": {
        this.emit("success", this.#importResult(data))
        if (this.#resumeTokenKey) {
          try {
            window.localStorage.removeItem(this.#resumeTokenKey)
          } catch {
            /* local storage is not available, don't sweat it */
          }
        }

        if (this.#params.autoClose) {
          this.close()
        }

        return
      }

      case "cancel": {
        this.emit("cancel")
        if (this.#resumeTokenKey) {
          try {
            window.localStorage.removeItem(this.#resumeTokenKey)
          } catch {
            /* local storage is not available, don't sweat it */
          }
        }

        if (this.#params.autoClose) {
          this.close()
        }

        return
      }

      case "reset-embed": {
        this.#resetSession(data.embedSessionConfig)
        return
      }

      case "error": {
        this.emitErrorEvent({
          message: data.message,
          severity: OneSchemaErrorSeverity.Fatal,
        })
        if (this.#params.autoClose) {
          this.close()
        }
        return
      }

      // This is temporary and will be removed when we revamp errors.
      case "nonclosing-error": {
        this.emitErrorEvent({
          message: data.message,
          severity: OneSchemaErrorSeverity.Error,
        })
        return
      }

      case "error-v2": {
        const severity = data.severity || OneSchemaErrorSeverity.Error
        this.emitErrorEvent({
          message: data.message,
          severity,
        })
        if (severity === OneSchemaErrorSeverity.Fatal && this.#params.autoClose) {
          this.close()
        }
        return
      }

      case "user-activity": {
        this.emit("user-activity")
        return
      }
    }
  }
}

/**
 * @param params the settings for the importing session
 * @returns an instance of the OneSchemaImporter
 */
export default function oneSchemaImporter(
  params: OneSchemaParams,
): OneSchemaImporterClass {
  return new OneSchemaImporterClass(params)
}
