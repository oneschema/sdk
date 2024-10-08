import oneschemaFileFeeds, {
  CancelledEventData,
  DestroyedEventData,
  FileFeedCustomization,
  HiddenEventData,
  InitFailedEventData,
  InitStartedEventData,
  InitSucceededEventData,
  OneSchemaFileFeedsClass,
  PageLoadedEventData,
  SavedEventData,
  SessionInvalidatedEventData,
  ShownEventData,
} from "@oneschema/filefeeds"

import React, { useCallback, useEffect, useRef, useState } from "react"

import { name as PACKAGE_NAME, version as PACKAGE_VERSION } from "../package.json"

export interface OneSchemaFileFeedsProps {
  /**
   * These props are passed directly into the OneSchemaFileFeeds as params.
   *
   * NOTE: Changing any of these values will result in a new embedding to be
   * initiated.
   */
  userJwt: string
  baseUrl?: string
  devMode?: boolean

  /**
   * Whether to use a session token to resume an existing session.
   */
  sessionToken?: string

  /**
   * Whether the iframe should be rendered in the component tree
   * If false or not set, the iframe will append to document.body
   *
   * NOTE: Changing this value will result in a new embedding to be initiated.
   */
  inline?: boolean

  /**
   * Whether to show the iframe or not
   */
  isOpen: boolean

  /**
   * The class name that should be applied to the iframe.
   */
  className?: string

  /**
   * CSS styles that should be applied to the iframe.
   */
  style?: React.CSSProperties

  /**
   * Handler for when the embedded iframe wants to close.
   */
  onRequestClose?: () => void

  /**
   * The customization key to use when launching the FileFeeds Transforms.
   */
  customizationKey?: string

  /**
   * The customization overrides to use when launching
   */
  customizationOverrides?: FileFeedCustomization
  /**
   * Handler for when the embedded FileFeeds page is loaded behind the scenes.
   */
  onPageLoad?: (data: PageLoadedEventData) => void

  /**
   * Handler for when the embedded FileFeeds Transforms launch has started.
   */
  onInitStart?: (data: InitStartedEventData) => void

  /**
   * Handler for when the embedded FileFeeds Transforms cannot be launched.
   */
  onInitFail?: (data: InitFailedEventData) => void

  /**
   * Handler for when the embedded FileFeeds Transforms is launched (aka is
   * ready to be shown).
   */
  onInitSucceed?: (data: InitSucceededEventData) => void

  /**
   * Handler for when the embedded FileFeeds is destroyed. This happens when
   * any of the primary props change.
   *
   * This can be used to clean up the Embedded FileFeeds Session, for example.
   */
  onDestroy?: (data: DestroyedEventData) => void

  /**
   * This is called whenever the iframe is hidden.
   */
  onHide?: (data: HiddenEventData) => void

  /**
   * This is called whenever the iframe is shown again.
   */
  onShow?: (data: ShownEventData) => void

  /**
   * Handler for when the FileFeeds Transforms are saved successfully.
   *
   * Reports back the number of remaining errors for the sample files in the
   * session.
   */
  onSave?: (data: SavedEventData) => void

  /**
   * Handler for when the FileFeeds Transforms changes are cancelled.
   */
  onCancel?: (data: CancelledEventData) => void

  /**
   * Handler for when the session is invalidated and cannot be resumed.
   *
   * This can happen when the session is expired or other changes are saved to
   * the FileFeed Transforms, requiring a new session.
   */
  onSessionInvalidate?: (data: SessionInvalidatedEventData) => void

  /**
   * Whether to save session information to local storage and enable resuming
   * Defaults to false
   */
  saveSession?: boolean
}

/**
 * Component for importing data with OneSchema
 */
export default function OneSchemaFileFeeds({
  // Primary props
  sessionToken,
  userJwt,
  baseUrl,
  devMode = false,
  inline = true,
  // Looks props
  isOpen,
  onRequestClose,
  style,
  className,
  // Resume props
  saveSession,
  // Launch props
  customizationKey,
  customizationOverrides,
  // == Events props ==
  // Iframe
  onPageLoad,
  onDestroy,
  // Session
  onInitStart,
  onInitFail,
  onInitSucceed,
  onSessionInvalidate,
  // Visibility
  onHide,
  onShow,
  // Transforms
  onSave,
  onCancel,
}: OneSchemaFileFeedsProps) {
  // Create a new instance only when primary props change.
  const [instance, setInstance] = useState<OneSchemaFileFeedsClass | null>()
  useEffect(() => {
    const newInstance = oneschemaFileFeeds({
      userJwt,
      baseUrl,
      devMode,
      manageDOM: !inline,
      saveSession,
    })
    newInstance?.setClient(PACKAGE_NAME, PACKAGE_VERSION)
    setInstance(newInstance)

    // When a new OSFF is instantiated, we need to destroy the old one.
    return () => {
      newInstance?.destroy()
    }
  }, [userJwt, baseUrl, devMode, inline])

  // When the handler change, we only reset the listeners.
  useEffect(() => {
    instance?.on("page-loaded", (data: PageLoadedEventData) => {
      onPageLoad?.(data)
    })

    instance?.on("init-started", (data: InitStartedEventData) => {
      onInitStart?.(data)
    })

    instance?.on("init-failed", (data: InitFailedEventData) => {
      onInitFail?.(data)
    })

    instance?.on("init-succeeded", (data: InitSucceededEventData) => {
      onInitSucceed?.(data)
    })

    instance?.on("destroyed", (data: DestroyedEventData) => {
      onDestroy?.(data)
      onRequestClose?.()
    })

    instance?.on("hidden", (data: HiddenEventData) => {
      onHide?.(data)
    })

    instance?.on("shown", (data: ShownEventData) => {
      onShow?.(data)
    })

    instance?.on("saved", (data: SavedEventData) => {
      onSave?.(data)
      onRequestClose?.()
    })

    instance?.on("cancelled", (data: CancelledEventData) => {
      onCancel?.(data)
      onRequestClose?.()
    })

    instance?.on("session-invalidated", (data: SessionInvalidatedEventData) => {
      onSessionInvalidate?.(data)
    })

    return () => {
      instance?.removeAllListeners()
    }
  }, [
    instance,
    onRequestClose,
    onPageLoad,
    onInitFail,
    onInitStart,
    onInitSucceed,
    onDestroy,
    onHide,
    onShow,
    onSave,
    onCancel,
    onSessionInvalidate,
  ])

  // Manage show and hide of the iframe.
  useEffect(
    () => {
      if (isOpen) {
        instance?.launch({
          userJwt,
          sessionToken,
          customizationKey,
          customizationOverrides,
        })
      } else {
        instance?.hide()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instance, isOpen],
  )

  useEffect(() => {
    if (className) {
      instance?.setClassName(className)
    }
  }, [instance, className])

  useEffect(() => {
    if (style) {
      instance?.setStyles(style as Partial<CSSStyleDeclaration>)
    }
  }, [instance, style])

  const iframeRef = useRef<HTMLIFrameElement>()
  const setIframeRef = useCallback(
    (iframe: HTMLIFrameElement) => {
      if (iframe) {
        instance?.setIframe(iframe)
      }
      iframeRef.current = iframe
    },
    [instance],
  )

  if (instance && inline) {
    return <Iframe ref={setIframeRef} />
  } else {
    // OSFF adds the iframe to the document.
    return null
  }
}

const Iframe = React.memo(
  React.forwardRef<HTMLIFrameElement>((_, ref) => {
    return <iframe ref={ref} />
  }),
)
