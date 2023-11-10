import { EventEmitter } from "eventemitter3"
import merge from "lodash.merge"
import {
  DEFAULT_PARAMS,
  OneSchemaLaunchParams,
  OneSchemaLaunchSessionParams,
  OneSchemaLaunchStatus,
  OneSchemaParams,
  OneSchemaInitMessage,
  OneSchemaLaunchTemplateGroupParams,
  OneSchemaSharedInitParams,
  OneSchemaLaunchError,
  OneSchemaInitSimpleMessage,
  OneSchemaInitSessionMessage,
  FileUploadImportConfig,
} from "./config"
import { version } from "../package.json"

const MAX_LAUNCH_RETRY = 10

/**
 * OneSchemaImporter class manages the iframe
 * used for importing data in your application
 * and emits events based on what happens
 */
export class OneSchemaImporterClass extends EventEmitter {
  #params: OneSchemaParams
  iframe?: HTMLIFrameElement
  _client = "Importer"
  _version = version
  _resumeTokenKey = ""
  _hasAttemptedLaunch = false
  _hasLaunched = false
  _hasCancelled = false
  _initMessage?: OneSchemaInitMessage
  _hasAppRecievedInitMessage = false
  static #isLoaded = false

  constructor(params: OneSchemaParams) {
    super()

    this.#params = merge({}, DEFAULT_PARAMS, params)

    if (typeof window === "undefined") {
      return
    }

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
    this._client = client
    this._version = version
  }

  /**
   * Set the iframe to be used by the OneSchema importer
   * Should only be used in conjuction with the param of manageDOM false
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

    OneSchemaImporterClass.#isLoaded = false
    this.iframe.onload = () => {
      OneSchemaImporterClass.#isLoaded = true
    }

    this.#hide()
  }

  /**
   * Will change the CSS class of the iframe
   * @param className the new CSS class
   */
  setClassName(className: string) {
    if (this.iframe) {
      this.iframe.className = className
    }
  }

  /**
   * Will change the styles of the iframe
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
    launchParams?: Partial<OneSchemaLaunchParams> &
      Partial<OneSchemaLaunchSessionParams> &
      Partial<OneSchemaLaunchTemplateGroupParams>,
  ): OneSchemaLaunchStatus {
    this._hasAttemptedLaunch = true

    const mergedParams = merge({}, this.#params, launchParams)
    const baseMessage: OneSchemaSharedInitParams = {
      version: this._version,
      client: this._client,
      manualClose: true,
    }

    let message: Partial<OneSchemaInitMessage>

    if (mergedParams.sessionToken) {
      message = {
        messageType: "init-session",
        sessionToken: mergedParams.sessionToken,
        ...baseMessage,
      }
    } else if (mergedParams.templateGroupKey) {
      message = {
        messageType: "init-template-group",
        userJwt: mergedParams.userJwt,
        templateGroupKey: mergedParams.templateGroupKey,
        importConfig: mergedParams.importConfig,
        customizationKey: mergedParams.customizationKey,
        customizationOverrides: mergedParams.customizationOverrides,
        ...baseMessage,
      }
      if (!message.userJwt) {
        console.error("OneSchema config error: missing userJwt")
        this.emit("launched", {
          success: false,
          error: OneSchemaLaunchError.MissingJwt,
        })
        return { success: false, error: OneSchemaLaunchError.MissingJwt }
      }
    } else {
      message = {
        messageType: "init",
        userJwt: mergedParams.userJwt,
        templateKey: mergedParams.templateKey,
        importConfig: mergedParams.importConfig,
        customizationKey: mergedParams.customizationKey,
        customizationOverrides: mergedParams.customizationOverrides,
        templateOverrides: mergedParams.templateOverrides,
        eventWebhookKeys: mergedParams.eventWebhookKeys,
        ...baseMessage,
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
          this._resumeTokenKey = `OneSchema-session-${mergedParams.userJwt}-${mergedParams.templateKey}`
          const resumeToken = window.localStorage.getItem(this._resumeTokenKey)
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

    this._initMessage = message as OneSchemaInitMessage
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
    window.addEventListener("message", this.#eventListener)

    const postInit = () => {
      this._hasCancelled = false
      this._initWithRetry()
      OneSchemaImporterClass.#isLoaded = true
    }

    if (OneSchemaImporterClass.#isLoaded) {
      postInit()
    } else if (this.iframe) {
      this.iframe.onload = postInit
    }
  }

  _initWithRetry(count = 1) {
    if (this._hasLaunched || this._hasCancelled || this._hasAppRecievedInitMessage) {
      return
    }

    if (count > MAX_LAUNCH_RETRY) {
      const msg = "OneSchema failed to respond for initialization"
      console.error(msg)
      if (this.#params.devMode) {
        // there might be some error in which case,
        // it's good to surface to devs
        this.#show()
      } else {
        this.emit("error", msg)
        if (this.#params.autoClose) {
          this.close()
        }
      }

      return
    }

    this.iframe?.contentWindow?.postMessage(this._initMessage, this.#params.baseUrl || "")
    setTimeout(() => this._initWithRetry(count + 1), 500)
  }

  /**
   * Close will stop the importing session and hide the OneSchema window
   * @param clean will remove the iframe and event listeners if true
   */
  close(clean?: boolean) {
    this.#hide()
    if (this.iframe && OneSchemaImporterClass.#isLoaded) {
      this.iframe.contentWindow?.postMessage(
        { messageType: "close" },
        this.#params.baseUrl || "",
      )
    }

    this._hasAttemptedLaunch = false
    this._hasAppRecievedInitMessage = false
    this._hasLaunched = false
    this._hasCancelled = true

    if (clean && this.iframe) {
      if (!this.iframe.dataset.count || this.iframe.dataset.count === "1") {
        this.removeAllListeners()
        window.removeEventListener("message", this.#eventListener)
        if (this.#params.manageDOM) {
          this.iframe.remove()
        }
      } else {
        this.iframe.dataset.count = `${parseInt(this.iframe.dataset.count || "1") - 1}`
      }
    }
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

  #eventListener = (event: MessageEvent) => {
    if (event.source !== this.iframe?.contentWindow) {
      return
    }

    switch (event.data.messageType) {
      case "init-recieved": {
        this._hasAppRecievedInitMessage = true
        break
      }
      case "launched": {
        this._hasLaunched = true
        let sessionToken = event.data.sessionToken
        const embedId = event.data.embedId
        if (this._resumeTokenKey && sessionToken) {
          try {
            window.localStorage.setItem(this._resumeTokenKey, sessionToken)
          } catch {
            /* local storage is not available, don't sweat it */
          }
        }
        // if sessionToken is undefined, then we init with one
        // and want to echo it back out
        if (!sessionToken) {
          sessionToken =
            (this._initMessage as OneSchemaInitSimpleMessage)?.resumeToken ||
            (this._initMessage as OneSchemaInitSessionMessage)?.sessionToken
        }
        this.emit("launched", {
          success: true,
          sessionToken,
          embedId,
        })
        this.#show()
        break
      }
      case "launch-error": {
        this.emit("launched", {
          success: false,
          error: OneSchemaLaunchError.LaunchError,
        })
        if (this.#params.autoClose) {
          this.close()
        }
        break
      }
      case "complete": {
        if (event.data.data) {
          // for frontend pass through
          this.emit("success", event.data.data)
        } else {
          // for webhook imports, eventId and responses are used
          this.emit("success", {
            eventId: event.data.eventId,
            responses: event.data.responses,
          })
        }
        if (this._resumeTokenKey) {
          try {
            window.localStorage.removeItem(this._resumeTokenKey)
          } catch {
            /* local storage is not available, don't sweat it */
          }
        }

        if (this.#params.autoClose) {
          this.close()
        }

        break
      }
      case "cancel": {
        this.emit("cancel")
        if (this._resumeTokenKey) {
          try {
            window.localStorage.removeItem(this._resumeTokenKey)
          } catch {
            /* local storage is not available, don't sweat it */
          }
        }

        if (this.#params.autoClose) {
          this.close()
        }

        break
      }
      case "error": {
        this.emit("error", event.data.message)
        if (this.#params.autoClose) {
          this.close()
        }
        break
      }
      // This is temporary and will be removed when we revamp errors.
      case "nonclosing-error": {
        this.emit("error", event.data.message)
        break
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
