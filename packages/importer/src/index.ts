import { EventEmitter } from "eventemitter3"
import merge from "lodash.merge"
import { OneSchemaConfig, DEFAULT_CONFIG, OneSchemaLaunchConfig } from "./config"

/**
 * OneSchemaImporter class manages the iframe
 * used for importing data in your application
 * and emits events based on what happens
 */
class OneSchemaImporter extends EventEmitter {
  #config: OneSchemaConfig
  iframe?: HTMLIFrameElement
  #baseUrl = "https://embed.oneschema.co"
  #eventListener: (event: MessageEvent) => void = () => null
  static #isLoaded = false

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

  #getParent(): HTMLElement {
    if (this.#config.parentId) {
      const parent = document.getElementById(this.#config.parentId)
      if (parent) {
        return parent
      }
    }

    return document.body
  }

  constructor(config: OneSchemaConfig) {
    super()

    this.#config = merge({}, DEFAULT_CONFIG, config)

    if (config.baseUrl) {
      this.#baseUrl = config.baseUrl
    }

    if (typeof window === "undefined") {
      return
    }

    const iframeId = "_oneschema-iframe"

    this.iframe = document.getElementById(iframeId) as HTMLIFrameElement
    if (!this.iframe) {
      this.iframe = document.createElement("iframe")
      this.iframe.id = iframeId
      this.iframe.dataset.count = "1"

      const queryParams = `?embed_client_id=${this.#config.clientId}&dev_mode=${
        this.#config.devMode
      }`
      this.iframe.src = `${this.#baseUrl}/embed-launcher${queryParams}`
      this.iframe.className = this.#config.className || ""
      OneSchemaImporter.#isLoaded = false
      this.iframe.onload = () => {
        OneSchemaImporter.#isLoaded = true
      }
    } else {
      this.iframe.dataset.count = `${parseInt(this.iframe.dataset.count || "0") + 1}`
    }

    this.#hide()

    this.#eventListener = (event: MessageEvent) => {
      if (event.source !== this.iframe?.contentWindow) {
        return
      }

      switch (event.data.messageType) {
        case "complete": {
          this.emit("success", event.data.data)
          if (this.#config.autoClose) {
            this.close()
          }

          break
        }
        case "cancel": {
          this.emit("cancel")
          if (this.#config.autoClose) {
            this.close()
          }

          break
        }
        case "error": {
          this.emit("error", event.data.message)
          if (this.#config.autoClose) {
            this.close()
          }
          break
        }
      }
    }

    const parent = this.#getParent()
    parent.append(this.iframe)
  }

  /**
   * Launch will show the OneSchema window and initialize the importer session
   * @param launchConfig optionally pass in config overrides or values not passed into constructor
   */
  launch(launchConfig?: Partial<OneSchemaLaunchConfig>) {
    window.addEventListener("message", this.#eventListener)
    this.#show()

    const mergedConfig = merge({}, this.#config, launchConfig)
    const message: any = { messageType: "init" }
    message.options = mergedConfig.config

    message.userJwt = mergedConfig.userJwt
    if (!message.userJwt) {
      console.error("OneSchema config error: missing userJwt")
      return
    }

    message.templateKey = mergedConfig.templateKey
    if (!message.templateKey) {
      console.error("OneSchema config error: missing templateKey")
      return
    }

    if (mergedConfig.webhookKey) {
      message.webhookKey = mergedConfig.webhookKey
    }

    const postInit = () => {
      this.iframe?.contentWindow?.postMessage(message, this.#baseUrl)
    }

    if (OneSchemaImporter.#isLoaded) {
      postInit()
    } else if (this.iframe) {
      this.iframe.onload = postInit
      OneSchemaImporter.#isLoaded = true
    }
  }

  /**
   * Close will stop the importing session and hide the OneSchema window
   * @param clean will remove the iframe and event listeners if true
   */
  close(clean?: boolean) {
    if (this.iframe && OneSchemaImporter.#isLoaded) {
      this.iframe.contentWindow?.postMessage({ messageType: "close" }, this.#baseUrl)
    }

    this.#hide()

    if (clean && this.iframe) {
      if (this.iframe.dataset.count === "1") {
        this.iframe.remove()
        this.removeAllListeners()
        window.removeEventListener("message", this.#eventListener)
      } else {
        this.iframe.dataset.count = `${parseInt(this.iframe.dataset.count || "") - 1}`
      }
    }
  }
}

export type OneSchemaImporterClass = InstanceType<typeof OneSchemaImporter>

/**
 * @param config the settings for the importing session
 * @returns an instance of the OneSchemaImporter
 */
export default function oneSchemaImporter(config: OneSchemaConfig): OneSchemaImporter {
  return new OneSchemaImporter(config)
}
