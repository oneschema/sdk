import { EventEmitter } from "eventemitter3"

export interface OneSchemaImporterConfigOptions {
  enableManageColumns?: boolean
  autofixAfterMapping?: boolean
  blockImportIfErrors?: boolean
}

export interface OneSchemaImporterConfig {
  userJwt: string
  templateKey: string
  webhookKey?: string
  options?: OneSchemaImporterConfigOptions
}

export interface OneSchemaIframeConfig {
  devMode?: boolean
  className?: string
  parentId?: string
  autoClose?: boolean
}

const DEFAULT_IFRAME_CONFIG: OneSchemaIframeConfig = {
  devMode: !!(process.env.NODE_ENV !== "production"),
  className: "oneschema-iframe",
  autoClose: true,
}

const DEFAULT_ONESCHEMA_OPTIONS: OneSchemaImporterConfigOptions = {
  blockImportIfErrors: true,
}

class OneSchemaImporter extends EventEmitter {
  clientId: string
  iframe: HTMLIFrameElement
  iframeConfig: OneSchemaIframeConfig
  #baseUrl = "https://embed.oneschema.co"
  #eventListener: (event: MessageEvent) => void
  #isLoaded = false

  #hide() {
    this.iframe.style.display = "none"
  }

  #show() {
    this.iframe.style.display = "initial"
  }

  #getParent(): HTMLElement {
    if (this.iframeConfig.parentId) {
      const parent = document.getElementById(this.iframeConfig.parentId)
      if (parent) {
        return parent
      }
    }

    return document.body
  }

  constructor(clientId: string, iframeConfig?: OneSchemaIframeConfig, baseUrl?: string) {
    super()

    this.clientId = clientId
    this.iframeConfig = {
      ...DEFAULT_IFRAME_CONFIG,
      ...(iframeConfig || {}),
    }

    if (baseUrl) {
      this.#baseUrl = baseUrl
    }

    const iframeId = "_oneschema-iframe"

    this.iframe =
      (document.getElementById(iframeId) as HTMLIFrameElement) ||
      document.createElement("iframe")
    this.iframe.id = iframeId
    if (this.iframe.dataset.count) {
      this.iframe.dataset.count = `${parseInt(this.iframe.dataset.count) + 1}`
    } else {
      this.iframe.dataset.count = "1"
    }

    const queryParams = `?embed_client_id=${this.clientId}&dev_mode=${this.iframeConfig.devMode}`
    this.iframe.src = `${this.#baseUrl}/embed-launcher${queryParams}`
    this.iframe.className = this.iframeConfig.className || ""
    this.iframe.onload = () => {
      this.#isLoaded = true
    }

    this.#hide()

    this.#eventListener = (event: MessageEvent) => {
      if (event.source !== this.iframe.contentWindow) {
        return
      }

      switch (event.data.messageType) {
        case "complete": {
          this.emit("success", event.data.data)
          if (this.iframeConfig.autoClose) {
            this.close()
          }

          break
        }
        case "cancel": {
          this.emit("cancel")
          if (this.iframeConfig.autoClose) {
            this.close()
          }

          break
        }
        case "error": {
          this.emit("error", event.data.message)
          if (this.iframeConfig.autoClose) {
            this.close()
          }
          break
        }
      }
    }

    const parent = this.#getParent()
    parent.append(this.iframe)
  }

  launch(config: OneSchemaImporterConfig) {
    window.addEventListener("message", this.#eventListener)
    this.#show()

    const { options, ...rest } = config
    const postInit = () => {
      this.iframe.contentWindow?.postMessage(
        {
          messageType: "init",
          ...rest,
          options: {
            ...DEFAULT_ONESCHEMA_OPTIONS,
            ...options,
          },
        },
        this.#baseUrl,
      )
    }

    if (this.#isLoaded) {
      postInit()
    } else {
      this.iframe.onload = postInit
      this.#isLoaded = true
    }
  }

  close(clean?: boolean) {
    this.iframe.contentWindow?.postMessage({ messageType: "close" }, this.#baseUrl)
    this.#hide()

    if (clean) {
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

export default function oneSchemaImporter(
  clientId: string,
  iframeConfig?: OneSchemaIframeConfig,
  baseUrl?: string,
): OneSchemaImporter {
  return new OneSchemaImporter(clientId, iframeConfig, baseUrl)
}
