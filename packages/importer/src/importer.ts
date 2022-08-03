import { EventEmitter } from "eventemitter3"
import merge from "lodash.merge"
import { DEFAULT_PARAMS, OneSchemaLaunchParams, OneSchemaParams } from "./config"

/**
 * OneSchemaImporter class manages the iframe
 * used for importing data in your application
 * and emits events based on what happens
 */
export class OneSchemaImporterClass extends EventEmitter {
  #params: OneSchemaParams
  iframe?: HTMLIFrameElement
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

    const queryParams = `?embed_client_id=${this.#params.clientId}&dev_mode=${
      this.#params.devMode
    }`
    this.iframe.src = `${this.#params.baseUrl}/embed-launcher${queryParams}`
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
  launch(launchParams?: Partial<OneSchemaLaunchParams>) {
    window.addEventListener("message", this.#eventListener)

    const mergedParams = merge({}, this.#params, launchParams)
    const message: any = { messageType: "init" }
    message.options = mergedParams.config

    message.userJwt = mergedParams.userJwt
    if (!message.userJwt) {
      console.error("OneSchema config error: missing userJwt")
      return
    }

    message.templateKey = mergedParams.templateKey
    if (!message.templateKey) {
      console.error("OneSchema config error: missing templateKey")
      return
    }

    if (mergedParams.webhookKey) {
      message.webhookKey = mergedParams.webhookKey
    }

    const postInit = () => {
      this.iframe?.contentWindow?.postMessage(message, this.#params.baseUrl || "")
      this.#show()
    }

    if (OneSchemaImporterClass.#isLoaded) {
      postInit()
    } else if (this.iframe) {
      this.iframe.onload = postInit
      OneSchemaImporterClass.#isLoaded = true
    }
  }

  /**
   * Close will stop the importing session and hide the OneSchema window
   * @param clean will remove the iframe and event listeners if true
   */
  close(clean?: boolean) {
    if (this.iframe && OneSchemaImporterClass.#isLoaded) {
      this.iframe.contentWindow?.postMessage(
        { messageType: "close" },
        this.#params.baseUrl || "",
      )
    }

    this.#hide()

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
      case "complete": {
        this.emit("success", event.data.data)
        if (this.#params.autoClose) {
          this.close()
        }

        break
      }
      case "cancel": {
        this.emit("cancel")
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
