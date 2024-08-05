import { EventEmitter } from "eventemitter3"
import merge from "lodash.merge"

import { version as PACKAGE_VERSION } from "../package.json"
import { DEFAULT_PARAMS, FileFeedsParams } from "./config"

const LAUNCH_RETRY_MAX_COUNT = 10
const LAUNCH_RETRY_DELAY_MS = 500

const FILE_FEEDS_TRANSFORMS_EMBED_MARKER = "transforms.filefeeds.oneschema.co"

/**
 * OneSchemaFileFeeds class manages the iframe used for interacting with the
 * File Feed in your application and emits events based on what happens.
 */
export class OneSchemaFileFeedsClass extends EventEmitter {
  #params: FileFeedsParams
  iframe?: HTMLIFrameElement

  _client = "sdk.filefeeds.oneschema.co"
  _version = PACKAGE_VERSION

  static #iframeIsLoaded = false
  _iframeInitStarted = false
  _iframeInitSucceeded = false

  _iframeIsShown = false
  _iframeIsDestroyed = false

  constructor(params: FileFeedsParams) {
    super()
    window.addEventListener("message", this.#iframeEventListener.bind(this))

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

      const parent =
        (this.#params.parentId && document.getElementById(this.#params.parentId)) ||
        document.body
      this.setParent(parent)
    }
  }

  /**
   * Set the name and version of the client, used for logging/debugging.
   */
  setClient(client: string, version: string) {
    this._client = client
    this._version = version
  }

  /**
   * Set the iframe to be used by the OneSchema FileFeeds.
   *
   * Should only be used in conjuction with the param of `manageDOM` false.
   */
  setIframe(iframe: HTMLIFrameElement) {
    // just in case..
    if (this.iframe) {
      this.destroy()
    }

    this.iframe = iframe
    this.iframe.style.display = "none"
    this.iframe.setAttribute("allowtransparency", "true")

    const srcUrl = new URL(this.#params.baseUrl!)
    srcUrl.pathname = "/file-feeds-embed/launcher"
    // TODO: Drop explicit `init` after inin-on-demand is the default.
    srcUrl.searchParams.append("init", "false")
    srcUrl.searchParams.append("user_jwt", this.#params.userJwt)
    if (this.#params.devMode) {
      srcUrl.searchParams.append("dev_mode", "true")
    }
    this.iframe.src = String(srcUrl)

    this.setClassName(this.#params.className || "")
    if (this.#params.styles) {
      this.setStyles(this.#params.styles)
    }

    OneSchemaFileFeedsClass.#iframeIsLoaded = false
    this.iframe.onload = () => {
      OneSchemaFileFeedsClass.#iframeIsLoaded = true
    }
  }

  /**
   * Will change the CSS class of the iframe
   */
  setClassName(className: string) {
    if (this.iframe) {
      this.iframe.className = className
    }
  }

  /**
   * Will change the styles of the iframe
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
   * Will change the parent container of the iframe.
   *
   * NOTE: This will reload the URL.
   */
  setParent(parent: HTMLElement) {
    if (this.iframe) {
      parent.append(this.iframe)
    }
  }

  // == Launch-to-destory life-cycle ==

  /**
   * Launch will show the OneSchema window and initialize the FileFeeds session.
   */
  launch(): void {
    if (this._iframeIsDestroyed) {
      if (this.#params.devMode) {
        console.error("[OSFF] Instance has been destroyed.")
      }
      return
    }

    this.#show()

    const postInit = () => {
      this._initWithRetry()
      OneSchemaFileFeedsClass.#iframeIsLoaded = true
    }

    if (OneSchemaFileFeedsClass.#iframeIsLoaded) {
      postInit()
    } else if (this.iframe) {
      this.iframe.onload = postInit
    }
  }

  _initWithRetry(retryCount = 1) {
    if (this._iframeInitStarted || this._iframeInitSucceeded) {
      return
    }

    if (this.#params.devMode) {
      console.log("[OSFF] Initialization... try", retryCount)
    }

    if (retryCount > LAUNCH_RETRY_MAX_COUNT) {
      const message = "OneSchema failed to respond for initialization"
      console.error(message)
      this.emit("init-failed", { error: { message } })
      return
    }

    this.#iframeEventEmitter("init", {})

    setTimeout(() => this._initWithRetry(retryCount + 1), LAUNCH_RETRY_DELAY_MS)
  }

  /**
   * Remove the OneSchema iframe and event listeners.
   *
   * Create a new instance of OneSchemaFileFeeds to show the embedding again.
   */
  destroy() {
    if (this._iframeIsDestroyed) {
      return
    }
    this._iframeIsDestroyed = true

    this.#hide()

    if (OneSchemaFileFeedsClass.#iframeIsLoaded) {
      this.#iframeEventEmitter("destroy", {})
    }

    this.emit("destroyed", {})

    this._iframeInitStarted = false
    this._iframeInitSucceeded = false
    window.removeEventListener("message", this.#iframeEventListener)

    if (this.iframe) {
      if (!this.iframe.dataset.count || this.iframe.dataset.count === "1") {
        this.removeAllListeners()
        if (this.#params.manageDOM) {
          this.iframe.remove()
        }
      } else {
        this.iframe.dataset.count = `${parseInt(this.iframe.dataset.count || "1") - 1}`
      }
    }
  }

  /**
   * Hide the OneSchema iframe.
   *
   * Use `launch()` to show the same iframe.
   */
  hide() {
    if (this._iframeIsDestroyed) {
      if (this.#params.devMode) {
        console.error("[OSFF] Instance has been destroyed.")
      }
      return
    }
    if (!this._iframeIsShown) {
      return
    }
    this.#hide()
    this.emit("hidden", {})
  }

  #hide() {
    if (this.iframe) {
      this.iframe.style.display = "none"
    }

    if (OneSchemaFileFeedsClass.#iframeIsLoaded) {
      this.#iframeEventEmitter("hide", {})
    }

    this._iframeIsShown = false
  }

  #show() {
    if (this._iframeIsDestroyed || this._iframeIsShown) {
      return
    }

    if (this.iframe) {
      this.iframe.style.display = "initial"
    }

    if (OneSchemaFileFeedsClass.#iframeIsLoaded) {
      this.#iframeEventEmitter("show", {})
    }

    this._iframeIsShown = true
    this.emit("shown", {})
  }

  // == Messaging with the ifram ==

  #iframeEventListener = ({
    source,
    data: { "@from": sender, type: eventType, data: eventData },
  }: MessageEvent) => {
    if (source !== this.iframe?.contentWindow) {
      return
    }

    if (sender !== FILE_FEEDS_TRANSFORMS_EMBED_MARKER) {
      return
    }

    switch (eventType) {
      case "init-started": {
        this._iframeInitStarted = true
        break
      }

      case "init-succeeded": {
        this._iframeInitSucceeded = true
        break
      }
    }

    this.emit(eventType, eventData)
  }

  #iframeEventEmitter = (type: string, data: Record<string, any>) => {
    this.iframe?.contentWindow?.postMessage(
      {
        "@to": FILE_FEEDS_TRANSFORMS_EMBED_MARKER,
        type,
        data,
        version: this._version,
        client: this._client,
      },
      this.#params.baseUrl!,
    )
  }
}

/**
 * @param params the settings for the importing session
 * @returns an instance of the OneSchemaFileFeeds
 */
export default function oneSchemaFileFeeds(
  params: FileFeedsParams,
): OneSchemaFileFeedsClass {
  return new OneSchemaFileFeedsClass(params)
}
