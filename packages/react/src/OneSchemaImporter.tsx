import React, { useCallback, useEffect, useRef, useState } from "react"
import oneschemaImporter, { OneSchemaConfig } from "@oneschema/importer"

export interface OneSchemaImporterProps {
  /**
   * Whether to show the iframe or not
   */
  isOpen: boolean
  /**
   * Whether the iframe should be rendered in the component tree
   * If false or not set, the iframe will append to document.body
   */
  inline?: boolean
  /**
   * These props are passed directly into the OneSchemaImporter as params
   */
  clientId: string
  className?: string
  devMode?: boolean
  baseUrl?: string
  userJwt: string
  templateKey: string
  webhookKey?: string
  config?: OneSchemaConfig
  /**
   * DEPRECATED: use config prop instead
   */
  blockImportIfErrors?: boolean
  /**
   * DEPRECATED: use inline prop instead
   */
  parentId?: string
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
  onSuccess?: (data: any) => void
  /**
   * Handler for when the importing flow is cancelled by user
   */
  onCancel?: () => void
  /**
   * Handler for when an error occurs during the import
   */
  onError?: (message: string) => void
}

/**
 * Component for importing data with OneSchema
 */
export default function OneSchemaImporter({
  isOpen,
  style,
  inline,
  onRequestClose,
  onSuccess,
  onCancel,
  onError,

  // deprecated
  blockImportIfErrors,
  parentId,

  ...params
}: OneSchemaImporterProps) {
  if (blockImportIfErrors !== undefined) {
    console.warn(
      "OneSchema prop 'blockImportIfErrors' is deprecated. Use 'config' prop instead",
    )
  }

  if (parentId !== undefined) {
    console.warn(
      "OneSchema prop 'parentId' is deprecated. Use 'inline' prop, possibly with portal instead",
    )
  }

  const [importer] = useState(() => {
    return oneschemaImporter({
      ...params,
      autoClose: false,
      manageDOM: inline,
    })
  })

  useEffect(() => {
    return () => {
      importer && importer.close(true)
    }
  }, [importer])

  useEffect(() => {
    if (importer) {
      importer.on("success", (data) => {
        onSuccess && onSuccess(data)
        onRequestClose && onRequestClose()
      })

      importer.on("cancel", () => {
        onCancel && onCancel()
        onRequestClose && onRequestClose()
      })

      importer.on("error", (message) => {
        onError && onError(message)
        onRequestClose && onRequestClose()
      })
    }

    return () => {
      importer && importer.removeAllListeners()
    }
  }, [importer, onSuccess, onCancel, onError, onRequestClose])

  useEffect(() => {
    if (params.className && importer) {
      importer.setClassName(params.className)
    }
  }, [importer, params.className])

  useEffect(() => {
    if (style && importer && importer.iframe) {
      Object.entries(style).forEach(([key, value]) => {
        importer.iframe!.style.setProperty(key, value)
      })
    }

    return () => {
      if (style && importer && importer.iframe) {
        Object.keys(style).forEach((key) => {
          importer.iframe!.style.removeProperty(key)
        })
      }
    }
  }, [importer, style])

  useEffect(() => {
    if (importer) {
      if (isOpen) {
        importer.launch(params)
      } else {
        importer.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importer, isOpen])

  const iframeRef = useRef<HTMLIFrameElement>()
  const setIframeRef = useCallback((iframe: HTMLIFrameElement) => {
    if (iframe && importer) {
      importer.setIframe(iframe)
    }

    iframeRef.current = iframe
  }, [])

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
