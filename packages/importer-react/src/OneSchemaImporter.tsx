import oneschemaImporter, {
  OneSchemaError,
  OneSchemaErrorSeverity,
  OneSchemaImporterClass,
  OneSchemaImportResult,
  OneSchemaLaunchParamOptions,
  OneSchemaLaunchStatus,
} from "@oneschema/importer"
import React, { useCallback, useEffect, useRef, useState } from "react"

import { version } from "../package.json"

export interface OneSchemaImporterBaseProps {
  /**
   * Whether to show the iframe or not
   */
  isOpen: boolean

  /**
   * Whether the iframe should be rendered in the component tree.
   * When false, the iframe is appended to document.body
   */
  inline?: boolean

  /**
   * The client id from your OneSchema developer dashboard
   */
  clientId: string

  /**
   * CSS class for the iframe
   */
  className?: string

  /**
   * Whether to launch the importer in dev mode, which shows the iframe even
   * when launching fails
   */
  devMode?: boolean

  /**
   * Language code (like 'en' or 'zh') to force the importer language.
   * By default, uses the user's set language. Requires enterprise licensing
   */
  languageCode?: string

  /**
   * Whether to save session information to local storage and enable resuming
   */
  saveSession?: boolean

  /**
   * The base URL for the iframe.
   * By default uses OneSchema's production instance
   */
  baseUrl?: string

  /**
   * CSS styles that should be applied to the iframe
   */
  style?: React.CSSProperties

  /**
   * Handler for when the importer wants to close
   * should set isOpen prop to false
   */
  onRequestClose?: () => void

  /**
   * Handler for when the importing flow completes successfully
   */
  onSuccess?: (data: OneSchemaImportResult) => void

  /**
   * Handler for when the importing flow is cancelled by user
   */
  onCancel?: () => void

  /**
   * Handler for when an error occurs during the import
   */
  onError?: (error: OneSchemaError) => void

  /**
   * Handler for when the embedded Importer page is loaded behind the scenes.
   */
  onPageLoad?: () => void

  /**
   * Handler for when the importer is launched (aka is ready to be shown)
   * Or when launching fails, based on result
   */
  onLaunched?: (result: OneSchemaLaunchStatus) => void

  /**
   * Handler for when user activity is detected inside the importer iframe.
   * Useful for resetting session idle timers in the host application.
   * This event is throttled (fired at most once every 30 seconds).
   */
  onUserActivity?: () => void
}

/**
 * Combined props for OneSchemaImporter
 */
export type OneSchemaImporterProps = OneSchemaImporterBaseProps &
  OneSchemaLaunchParamOptions

/**
 * Component for importing data with OneSchema
 */
export default function OneSchemaImporter({
  isOpen,
  style,
  className,
  inline = true,
  onRequestClose,
  onSuccess,
  onCancel,
  onError,
  onPageLoad,
  onLaunched,
  onUserActivity,
  ...params
}: OneSchemaImporterProps) {
  const initParams = useRef({
    ...params,
    autoClose: false,
    manageDOM: !inline,
  })

  // The instance is owned by a mount effect rather than by lazy state: it is
  // destroyed on unmount, and a destroyed instance is inert, so every setup —
  // including the second one strict mode triggers — needs its own instance.
  const [importer, setImporter] = useState<OneSchemaImporterClass | null>(null)

  useEffect(() => {
    const instance = oneschemaImporter(initParams.current)
    instance.setClient("React", version)
    setImporter(instance)

    return () => {
      instance.destroy()
    }
  }, [])

  useEffect(() => {
    if (importer) {
      importer.on("success", (data) => {
        onSuccess?.(data)
        onRequestClose?.()
      })

      importer.on("cancel", () => {
        onCancel?.()
        onRequestClose?.()
      })

      importer.on("error", (error) => {
        onError?.(error)
        if (error.severity === OneSchemaErrorSeverity.Fatal) {
          onRequestClose?.()
        }
      })

      importer.on("page-loaded", () => {
        onPageLoad?.()
      })

      importer.on("launched", (data) => {
        onLaunched?.(data)
      })

      importer.on("user-activity", () => {
        onUserActivity?.()
      })
    }

    return () => {
      importer?.removeAllListeners()
    }
  }, [
    importer,
    onSuccess,
    onCancel,
    onError,
    onRequestClose,
    onLaunched,
    onPageLoad,
    onUserActivity,
  ])

  useEffect(() => {
    if (className) {
      importer?.setClassName(className)
    }
  }, [importer, className])

  useEffect(() => {
    if (style) {
      importer?.setStyles(style as Partial<CSSStyleDeclaration>)
    }
  }, [importer, style])

  // Rerendering rebuilds the rest-params object, so the warning compares the
  // params by value against the ones the current import was launched with.
  const launchedParams = useRef<string>()
  const serializedParams = JSON.stringify(params)

  useEffect(() => {
    if (!importer || !isOpen || importer.status === "idle") {
      return
    }

    if (
      launchedParams.current !== undefined &&
      launchedParams.current !== serializedParams
    ) {
      console.warn(
        "The OneSchema importer has already launched. Updated launch params will not update the current import",
      )
    }
  }, [importer, isOpen, serializedParams])

  useEffect(() => {
    if (importer) {
      if (isOpen) {
        launchedParams.current = serializedParams
        importer.launch(params)
      } else {
        launchedParams.current = undefined
        importer.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importer, isOpen])

  const iframeRef = useRef<HTMLIFrameElement>()
  const setIframeRef = useCallback(
    (iframe: HTMLIFrameElement) => {
      if (iframe) {
        importer?.setIframe(iframe)
      }
      iframeRef.current = iframe
    },
    [importer],
  )

  if (inline) {
    return <Iframe ref={setIframeRef} />
  } else {
    return null
  }
}

const Iframe = React.memo(
  React.forwardRef<HTMLIFrameElement>((_, ref) => {
    return <iframe ref={ref} />
  }),
)
