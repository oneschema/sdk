import { EventEmitter } from "eventemitter3"
import { version } from "../package.json"
import {
  DEFAULT_PARAMS,
  FileUploadImportConfig,
  OneSchemaError,
  OneSchemaErrorSeverity,
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

const MAX_LAUNCH_RETRY = 10

const IMPORTER_EMBED_MARKER = "importer.oneschema.co"

/**
 * OneSchemaImporter class manages the iframe used for importing data in your
 * application and emits events based on what happens.
 */
export class OneSchemaImporterClass extends EventEmitter {
  #params: OneSchemaParams
  iframe?: HTMLIFrameElement

  #client = "Importer"
  #version = version

  #resumeTokenKey = ""
  _hasAttemptedLaunch = false
  #hasLaunched = false
  #hasCancelled = false
  #initMessage?: OneSchemaInitMessage
  #hasAppReceivedInitMessage = false
  static #iframeIsLoaded = false

  constructor(params: OneSchemaParams) {
    super()

    this.#params = merged(DEFAULT_PARAMS, params)

    // Limit usage to browser only.
    if (typeof window === "undefined") {
      return
    }

    window.addEventListener("message", this.#iframeEventListener.bind(this))

    if (this.#params.manageDOM) {
      const iframeId = "_oneschema-iframe"
      this.iframe = document.getElementById(iframeId) as HTMLIFrameElement
      if (this.iframe) {
        this.iframe.dataset.count = `${parseInt(this.iframe.dataset.count || "0") + 1}`
      } else {
        const iframe = document.createElement("iframe")
        iframe.id = iframeId
        iframe.dataset.count = "1"
        this.setIframe(iframe)
      }

      let parent = document.body
      if (this.#params.parentId) {
        parent = document.getElementById(this.#params.parentId) || parent
      }

      this.setParent(parent)
    }
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
    // just in case..
    if (this.iframe) {
      this.close(true)
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

    OneSchemaImporterClass.#iframeIsLoaded = false
    this.iframe.onload = () => {
      OneSchemaImporterClass.#iframeIsLoaded = true
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
   * NOTE: will reload the URL
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
    this._hasAttemptedLaunch = true

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
    this._launch()
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

  _launch() {
    const postInit = () => {
      this.#hasCancelled = false
      this._initWithRetry()
      OneSchemaImporterClass.#iframeIsLoaded = true
    }

    if (OneSchemaImporterClass.#iframeIsLoaded) {
      postInit()
    } else if (this.iframe) {
      this.iframe.onload = postInit
    }
  }

  _initWithRetry(count = 1) {
    if (this.#hasLaunched || this.#hasCancelled || this.#hasAppReceivedInitMessage) {
      return
    }

    if (count > MAX_LAUNCH_RETRY) {
      const msg = "OneSchema failed to respond for initialization"
      console.error(msg)
      if (this.#params.devMode) {
        // Display the iframe for debugging purposes.
        this.#show()
      } else {
        this.emitErrorEvent({
          message: msg,
          severity: OneSchemaErrorSeverity.Fatal,
        })
        if (this.#params.autoClose) {
          this.close()
        }
      }

      return
    }

    this.#iframeEventEmit(this.#initMessage || {})
    setTimeout(() => this._initWithRetry(count + 1), 500)
  }

  _resetSession(
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
   * @param clean will remove the iframe and event listeners if true
   */
  close(clean?: boolean) {
    this.#hide()
    if (this.iframe && OneSchemaImporterClass.#iframeIsLoaded) {
      this.#iframeEventEmit({ messageType: "close" })
    }

    this._hasAttemptedLaunch = false
    this.#hasAppReceivedInitMessage = false
    this.#hasLaunched = false
    this.#hasCancelled = true

    if (clean && this.iframe) {
      if (!this.iframe.dataset.count || this.iframe.dataset.count === "1") {
        this.removeAllListeners()
        window.removeEventListener("message", this.#iframeEventListener)
        if (this.#params.manageDOM) {
          this.iframe.remove()
        }
      } else {
        this.iframe.dataset.count = `${parseInt(this.iframe.dataset.count || "1") - 1}`
      }
    }
  }

  #iframeEventEmit(message: Record<string, any>) {
    this.iframe?.contentWindow?.postMessage(
      {
        version: this.#version,
        client: this.#client,
        "@from": `${this.#client}#${this.#version}`,
        "@to": IMPORTER_EMBED_MARKER,
        ...message,
      },
      this.#params.baseUrl!,
    )
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
    if (source !== this.iframe?.contentWindow) {
      return
    }

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
        this.emit("launched", {
          success: false,
          error: OneSchemaLaunchError.LaunchError,
        })
        if (this.#params.devMode) {
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
        this._resetSession(data.embedSessionConfig)
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
