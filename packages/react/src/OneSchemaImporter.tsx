import React, { useEffect, useState } from "react"
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
      importer.close(true)
    }
  }, [])

  useEffect(() => {
    importer.on("success", (data) => {
      props.onSuccess && props.onSuccess(data)
      props.onRequestClose && props.onRequestClose()
    })

    importer.on("cancel", () => {
      props.onCancel && props.onCancel()
      props.onRequestClose && props.onRequestClose()
    })

    importer.on("error", (message) => {
      props.onError && props.onError(message)
      props.onRequestClose && props.onRequestClose()
    })

    return () => {
      importer.removeAllListeners()
    }
  }, [props.onSuccess, props.onCancel, props.onError, props.onRequestClose])

  useEffect(() => {
    if (props.className) {
      importer.iframe.className = props.className
    }
  }, [props.className])

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
  }, [props.isOpen])

  return null
}
