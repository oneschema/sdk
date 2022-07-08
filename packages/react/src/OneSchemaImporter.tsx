import { useEffect, useState } from "react"
import oneschemaImporter, {
  OneSchemaIframeConfig,
  OneSchemaImporterConfig,
  OneSchemaImporterConfigOptions,
} from "@oneschema/importer"

export interface OneSchemaImporterProps {
  isOpen: boolean

  clientId: string
  userJwt: string
  templateKey: string
  webhookKey?: string

  blockImportIfErrors?: boolean

  className?: string
  parentId?: string
  devMode?: boolean

  style?: React.CSSProperties

  onRequestClose?: () => void
  onSuccess?: (data: any) => void
  onCancel?: () => void
  onError?: (message: string) => void

  baseUrl?: string
}

export default function OneSchemaImporter(props: OneSchemaImporterProps) {
  const [importer] = useState(() => {
    const { parentId, className, devMode } = props
    const importerOptions: OneSchemaIframeConfig = Object.assign(
      { autoClose: false },
      parentId !== undefined && { parentId },
      className !== undefined && { className },
      devMode !== undefined && { devMode },
    )

    return oneschemaImporter(props.clientId, importerOptions, props.baseUrl)
  })

  useEffect(() => {
    return () => {
      importer && importer.close(true)
    }
  }, [importer])

  const { onSuccess, onCancel, onError, onRequestClose } = props
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
    if (props.className && importer) {
      importer.iframe.className = props.className
    }
  }, [importer, props.className])

  useEffect(() => {
    if (props.style && importer) {
      Object.entries(props.style).forEach(([key, value]) => {
        importer.iframe.style.setProperty(key, value)
      })
    }

    return () => {
      if (props.style && importer) {
        Object.keys(props.style).forEach((key) => {
          importer.iframe.style.removeProperty(key)
        })
      }
    }
  }, [importer, props.style])

  useEffect(() => {
    if (importer) {
      if (props.isOpen) {
        const { webhookKey, blockImportIfErrors } = props

        const options: OneSchemaImporterConfigOptions = Object.assign(
          {},
          blockImportIfErrors !== undefined ? { blockImportIfErrors } : {},
        )

        const launchConfig: OneSchemaImporterConfig = Object.assign(
          {
            userJwt: props.userJwt,
            templateKey: props.templateKey,
            options,
          },
          webhookKey !== undefined && { webhookKey },
        )

        importer.launch(launchConfig)
      } else {
        importer.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importer, props.isOpen])

  return null
}
