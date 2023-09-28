import React, { useCallback, useEffect, useRef, useState } from "react"
import oneschemaImporter, {
  OneSchemaLaunchParamOptions,
  OneSchemaLaunchStatus,
} from "@oneschema/importer"
import { version } from "../package.json"

export interface OneSchemaImporterBaseProps {
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
  languageCode?: string
  saveSession?: boolean
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
  onSuccess?: (data: any) => void
  /**
   * Handler for when the importing flow is cancelled by user
   */
  onCancel?: () => void
  /**
   * Handler for when an error occurs during the import
   */
  onError?: (message: string) => void
  /**
   * Handler for when the importer is launched (aka is ready to be shown)
   * Or when launching fails, based on result
   */
  onLaunched?: (result: OneSchemaLaunchStatus) => void
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
  inline,
  onRequestClose,
  onSuccess,
  onCancel,
  onError,
  onLaunched,
  ...params
}: OneSchemaImporterProps) {
  const [importer] = useState(() => {
    const instance = oneschemaImporter({
      ...params,
      autoClose: false,
      manageDOM: !inline,
    })

    instance.setClient("React", version)
    return instance
  })

  useEffect(() => {
    return () => {
      importer && importer.close(true)
    }
  }, [importer])

  useEffect(() => {
    if (importer) {
      importer.on("success", (data: any) => {
        onSuccess && onSuccess(data)
        onRequestClose && onRequestClose()
      })

      importer.on("cancel", () => {
        onCancel && onCancel()
        onRequestClose && onRequestClose()
      })

      importer.on("error", (message: string) => {
        onError && onError(message)
        onRequestClose && onRequestClose()
      })

      importer.on("launched", (data: { sessionToken: string; embedId: string }) => {
        console.log("inside regular launch", data)
        onLaunched &&
          onLaunched({
            success: true,
            sessionToken: data.sessionToken,
            embedId: data.embedId,
          })
      })
    }

    return () => {
      importer && importer.removeAllListeners()
    }
  }, [importer, onSuccess, onCancel, onError, onRequestClose, onLaunched])

  useEffect(() => {
    if (params.className && importer) {
      importer.setClassName(params.className)
    }
  }, [importer, params.className])

  useEffect(() => {
    if (style && importer) {
      importer.setStyles(style as Partial<CSSStyleDeclaration>)
    }
  }, [importer, style])

  useEffect(() => {
    if (importer) {
      if (isOpen) {
        console.log("right before importer.launch react")
        const result = importer.launch(params)
        console.log("launchresult", result)

        // if there is a invalid config when launch is done
        // it will fail and we give reason back as to why here
        if (result && !result.success) {
          importer.on("launched", () => {
            console.log("error launch", result)
            onLaunched && onLaunched(result)
          })
        }
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
