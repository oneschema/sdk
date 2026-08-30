import { EventEmitter } from "eventemitter3"
import { version } from "../package.json"
import {
  DEFAULT_PARAMS,
  FileUploadImportConfig,
  OneSchemaError,
  OneSchemaErrorSeverity,
  OneSchemaEventMap,
  OneSchemaImporterStatus,
  OneSchemaInitMessage,
  OneSchemaInitSessionMessage,
  OneSchemaInitSimpleMessage,
  OneSchemaLaunchError,
  OneSchemaLaunchParams,
  OneSchemaLaunchSessionParams,
  OneSchemaLaunchStatus,
  OneSchemaParams,
  OneSchemaSharedInitParams,
} from "./config"
import { merged } from "./shared/utils"

const MAX_LAUNCH_RETRY = 40

const LAUNCH_RETRY_DELAY_MS = 500

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
  #initMessage?: OneSchemaInitMessage
  #hasAppReceivedInitMessage = false
  // NOTE: This describes the iframe, which persists across launches, so it is
  // not reset in close().
  #hasReceivedFrameMessage = false
  #iframeIsLoaded = false
  #launchOnLoad = false

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
   * - `idle`: created and never launched, or closed and ready to launch again
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
  ): OneSchemaLaunchStatus {
    if (this.#destroyed) {
      console.error(DESTROYED_MESSAGE)
      return {
        success: false,
        error: OneSchemaLaunchError.Destroyed,
        message: DESTROYED_MESSAGE,
      }
    }

    this.#hasAttemptedLaunch = true

    const mergedParams = merged(this.#params, launchParams)
    const baseMessage: OneSchemaSharedInitParams = {
      version: this.#version,
      client: this.#client,
      manualClose: true,
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
        importConfig: mergedParams.importConfig,
        customizationKey: mergedParams.customizationKey,
        customizationOverrides: mergedParams.customizationOverrides,
        templateOverrides: mergedParams.templateOverrides,
        eventWebhookKeys: mergedParams.eventWebhookKeys,
      }
      if (!message.userJwt) {
        console.error("OneSchema config error: missing userJwt")
        this.emit("launched", {
          success: false,
          error: OneSchemaLaunchError.MissingJwt,
        })
        return { success: false, error: OneSchemaLaunchError.MissingJwt }
      }

      if (!message.templateKey) {
        console.error("OneSchema config error: missing templateKey")
        this.emit("launched", {
          success: false,
          error: OneSchemaLaunchError.MissingTemplate,
        })
        return { success: false, error: OneSchemaLaunchError.MissingTemplate }
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

    if (
      mergedParams.importConfig &&
      mergedParams.importConfig.type === "file-upload" &&
      !mergedParams.importConfig.format
    ) {
      ;(mergedParams.importConfig as FileUploadImportConfig).format = "csv"
    }

    this.#initMessage = message as OneSchemaInitMessage
    this.#launch()
    return { success: true }
  }

  /**
   * DEPRECATED: use `launch` instead.
   * Launch session will show the OneSchema window and initialize the importer session with the given session token
   * @param launchParams optionally pass in parameter overrides or values not passed into constructor
   */
  launchSession(
    launchParams?: Partial<OneSchemaLaunchSessionParams>,
  ): OneSchemaLaunchStatus {
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
    this.#initWithRetry()
  }

  // The embed acknowledges the init message with "init-received", so the
  // message is repeated until it does: MAX_LAUNCH_RETRY attempts,
  // LAUNCH_RETRY_DELAY_MS apart, before the launch is declared fatally failed.
  #initWithRetry(count = 1) {
    if (this.#hasLaunched || this.#hasCancelled || this.#hasAppReceivedInitMessage) {
      return
    }

    if (count > MAX_LAUNCH_RETRY) {
      const msg = this.#hasReceivedFrameMessage
        ? "OneSchema failed to respond for initialization"
        : `OneSchema iframe was blocked: no message was ever received from ${this.iframe?.src}, so the OneSchema embed page never ran. The browser most likely blocked the iframe — check this page's console for a Content-Security-Policy "frame-ancestors" violation, and verify that this page's origin (${window.location.origin}) is on the allowed domains list for OneSchema client ID ${this.#params.clientId}.`
      console.error(msg)
      this.emitErrorEvent({
        message: msg,
        severity: OneSchemaErrorSeverity.Fatal,
      })
      if (this.#params.devMode) {
        // Display the iframe for debugging purposes.
        this.#show()
      } else if (this.#params.autoClose) {
        this.close()
      }

      return
    }

    this.#iframeEventEmit(this.#initMessage || {})
    setTimeout(() => this.#initWithRetry(count + 1), LAUNCH_RETRY_DELAY_MS)
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
      this.launch(launchParams)
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
        this.emit("launched", {
          success: true,
          sessionToken,
          embedId,
        })
        this.#show()
        return
      }

      case "launch-error": {
        const detail = parseLaunchErrorDetail(data.message)
        this.emit("launched", {
          success: false,
          error: OneSchemaLaunchError.LaunchError,
          ...detail,
        })
        if (this.#params.devMode) {
          // In dev mode the embed does not follow up with an "error" message,
          // so this is the only chance the host gets to hear why.
          this.emitErrorEvent({
            message: detail.message || DEFAULT_LAUNCH_ERROR_MESSAGE,
            severity: OneSchemaErrorSeverity.Fatal,
          })
          this.#show()
        } else if (this.#params.autoClose) {
          this.close()
        }
        return
      }

      case "complete": {
        if (data.data) {
          // for frontend pass through
          this.emit("success", data.data)
        } else {
          // for webhook imports, eventId and responses are used
          this.emit("success", {
            eventId: data.eventId,
            responses: data.responses,
          })
        }
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
