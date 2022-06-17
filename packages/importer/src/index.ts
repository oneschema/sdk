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

  #hide() {
    this.iframe.style.display = "none"
  }

  #show() {
    this.iframe.style.display = "initial"
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

    this.iframe = document.createElement("iframe")
    const queryParams = `?embed_client_id=${this.clientId}&dev_mode=${this.iframeConfig.devMode}`
    this.iframe.src = `${this.#baseUrl}/embed-launcher${queryParams}`
    this.iframe.classList.add(<string>this.iframeConfig.className)
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
    this.#show()

    const postInit = () => {
      this.iframe.contentWindow?.postMessage(
        {
          messageType: "init",
          ...config,
        },
        this.#baseUrl,
      )
    }

    if (this.iframe.contentWindow) {
      postInit()
    } else {
      this.iframe.onload = postInit
    }
  }

  close(clean?: boolean) {
    this.iframe.contentWindow?.postMessage({ messageType: "close" }, this.#baseUrl)
    this.#hide()

    if (clean) {
      this.iframe.remove()
      this.removeAllListeners()
      window.removeEventListener("message", this.#eventListener)
    }
  }
}

export default function oneSchemaImporter(
  clientId: string,
  iframeConfig?: OneSchemaIframeConfig,
  baseUrl?: string,
): OneSchemaImporter {
  return new OneSchemaImporter(clientId, iframeConfig, baseUrl)
}
