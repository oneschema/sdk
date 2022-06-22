import React, { useEffect, useRef } from "react"
import oneschemaImporter from "@oneschema/importer"

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
  const importer = useRef(
    oneschemaImporter(
      props.clientId,
      {
        autoClose: false,
        parentId: props.parentId,
        className: props.className,
        devMode: props.devMode,
      },
      props.baseUrl,
    ),
  )

  useEffect(() => {
    return () => {
      importer.current.close(true)
    }
  }, [])

  useEffect(() => {
    importer.current.on("success", (data) => {
      props.onSuccess && props.onSuccess(data)
      props.onRequestClose && props.onRequestClose()
    })

    importer.current.on("cancel", () => {
      props.onCancel && props.onCancel()
      props.onRequestClose && props.onRequestClose()
    })

    importer.current.on("error", (message) => {
      props.onError && props.onError(message)
      props.onRequestClose && props.onRequestClose()
    })

    return () => {
      importer.current.removeAllListeners()
    }
  }, [props.onSuccess, props.onCancel, props.onError, props.onRequestClose])

  useEffect(() => {
    importer.current.iframe.className = props.className || ""
  }, [props.className])

  useEffect(() => {
    if (props.isOpen) {
      importer.current.launch({
        userJwt: props.userJwt,
        templateKey: props.templateKey,
        webhookKey: props.webhookKey,
        options: {
          blockImportIfErrors: props.blockImportIfErrors,
        },
      })
    } else {
      importer.current.close()
    }
  }, [props.isOpen])

  return null
}
