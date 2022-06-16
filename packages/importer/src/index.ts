import { EventEmitter } from "eventemitter3"

export interface OneSchemaImporterConfig {
  userJwt: string
  templateKey: string
  webhookKey?: string
  options?: {
    enableManageColumns?: boolean
    autofixAfterMapping?: boolean
    blockImportIfErrors?: boolean
  }
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

class OneSchemaImporter extends EventEmitter {
  clientId: string
  iframe: HTMLIFrameElement
  iframeConfig: OneSchemaIframeConfig
  #baseUrl = "https://embed.oneschema.co"
  #eventListener: (event: MessageEvent) => void

  set __baseUrl(url: string) {
    this.#baseUrl = url
  }

  constructor(clientId: string, iframeConfig?: OneSchemaIframeConfig) {
    super()

    this.clientId = clientId
    this.iframeConfig = {
      ...DEFAULT_IFRAME_CONFIG,
      ...(iframeConfig || {}),
    }

    this.iframe = document.createElement("iframe")
    this.iframe.classList.add(<string>this.iframeConfig.className)

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
          break
        }
      }
    }
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

  launch(config: OneSchemaImporterConfig) {
    window.addEventListener("message", this.#eventListener)

    const queryParams = `?embed_client_id=${this.clientId}&dev_mode=${this.iframeConfig.devMode}`
    this.iframe.src = `${this.#baseUrl}/embed-launcher${queryParams}`

    this.iframe.onload = () => {
      this.iframe.contentWindow?.postMessage(
        {
          messageType: "init",
          ...config,
        },
        this.#baseUrl,
      )
    }

    const parent = this.#getParent()
    parent.append(this.iframe)
  }

  close() {
    this.iframe.contentWindow?.postMessage({ messageType: "close" }, this.#baseUrl)

    this.iframe.remove()
    this.removeAllListeners()
    window.removeEventListener("message", this.#eventListener)
  }
}

export default function oneSchemaImporter(
  clientId: string,
  iframeConfig: OneSchemaIframeConfig,
): OneSchemaImporter {
  return new OneSchemaImporter(clientId, iframeConfig)
}
