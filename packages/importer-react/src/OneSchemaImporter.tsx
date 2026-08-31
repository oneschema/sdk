import oneschemaImporter, {
  DEFAULT_PARAMS,
  OneSchemaError,
  OneSchemaErrorSeverity,
  OneSchemaImporterClass,
  OneSchemaImporterStatus,
  OneSchemaImportResult,
  OneSchemaLaunchInfo,
  OneSchemaLaunchParamOptions,
  OneSchemaLaunchParams,
  OneSchemaLaunchSessionParams,
  OneSchemaLaunchStatus,
} from "@oneschema/importer"
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import { version } from "../package.json"

export type OneSchemaLaunchOverrides = Partial<OneSchemaLaunchParams> &
  Partial<OneSchemaLaunchSessionParams>

/**
 * Imperative handle exposed through the component's `ref`
 */
export interface OneSchemaImporterHandle {
  /**
   * Launch the importer. Resolves when the import session is running and
   * rejects with a `OneSchemaLaunchFailure` when it cannot start, or with a
   * plain `Error` when the component has not mounted its importer yet
   */
  launch: (launchParams?: OneSchemaLaunchOverrides) => Promise<OneSchemaLaunchInfo>

  /**
   * Close the importer, discarding the session in progress
   */
  close: (clean?: boolean) => void

  /**
   * Lifecycle state of the underlying importer
   */
  readonly status: OneSchemaImporterStatus
}

export interface OneSchemaImporterBaseProps {
  /**
   * Whether to show the iframe or not.
   * Omit it to let the importer manage its own visibility: it then closes
   * itself when the import completes, the user cancels, or a fatal error
   * occurs, and the host launches it through the component's `ref`
   */
  isOpen?: boolean

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
   * How long a launch may stay pending before it fails with
   * `OneSchemaLaunchError.Timeout`, in milliseconds. Raise it for hosts on slow
   * or distant connections. Defaults to 20000
   */
  initTimeoutMs?: number

  /**
   * How long the importer waits for `onSuccess` and `onCancel` to settle before
   * it clears the resume token and closes, in milliseconds. Raise it for
   * handlers that ship rows to a slow or distant backend. `0` waits forever.
   * Defaults to 30000
   */
  handlerTimeoutMs?: number

  /**
   * CSS styles that should be applied to the iframe
   */
  style?: React.CSSProperties

  /**
   * Handler for when the importer wants to close
   * should set isOpen prop to false.
   * Only called when `isOpen` is supplied
   */
  onRequestClose?: () => void

  /**
   * Handler for when the importing flow completes successfully.
   * The importer waits for a returned promise to settle before it closes
   */
  onSuccess?: (data: OneSchemaImportResult) => void | Promise<void>

  /**
   * Handler for when the importing flow is cancelled by user.
   * The importer waits for a returned promise to settle before it closes
   */
  onCancel?: () => void | Promise<void>

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

type Handlers = Pick<
  OneSchemaImporterBaseProps,
  | "onRequestClose"
  | "onSuccess"
  | "onCancel"
  | "onError"
  | "onPageLoad"
  | "onLaunched"
  | "onUserActivity"
>

/**
 * Resolve like the importer does, so a controlled host closes on the same
 * bound the importer cleans up on.
 */
function handlerBound(configured?: number): number {
  return typeof configured === "number" && Number.isFinite(configured) && configured >= 0
    ? configured
    : DEFAULT_PARAMS.handlerTimeoutMs!
}

/**
 * Settle once the handler settles or `handlerTimeoutMs` elapses, whichever
 * comes first. The importer clears the session on that same deadline, so a
 * handler that never settles must not hold the host's close back either
 */
function settledWithinBound(handled: Promise<unknown>, bound: number): Promise<unknown> {
  if (bound === 0) {
    return handled
  }

  return Promise.race([handled, new Promise((resolve) => setTimeout(resolve, bound))])
}

const ALREADY_LAUNCHED_MESSAGE =
  "The OneSchema importer has already launched. Updated launch params will not update the current import"

/**
 * Component for importing data with OneSchema
 */
function OneSchemaImporter(
  {
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
  }: OneSchemaImporterProps,
  ref: React.ForwardedRef<OneSchemaImporterHandle>,
) {
  // Whether the host owns visibility is fixed for the instance's lifetime: the
  // two modes disagree about who closes the importer, so switching would leave
  // the iframe in a state neither side expects.
  const controlled = useRef(isOpen !== undefined).current

  const initParams = useRef({
    ...params,
    autoClose: !controlled,
    manageDOM: !inline,
  })

  // Handlers are read through a ref so the listeners register once per
  // instance: re-registering whenever an inline handler's identity changes
  // drops listeners the importer is in the middle of emitting to.
  const handlers = useRef<Handlers>({})
  useEffect(() => {
    handlers.current = {
      onRequestClose,
      onSuccess,
      onCancel,
      onError,
      onPageLoad,
      onLaunched,
      onUserActivity,
    }
  })

  const latestParams = useRef(params)
  useEffect(() => {
    latestParams.current = params
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
    if (!importer) {
      return
    }

    const bound = handlerBound(initParams.current.handlerTimeoutMs)

    // A handler that rejects is reported as a non-fatal `error` event, and one
    // that never settles only produces that same event once the importer's own
    // deadline passes, so closing has to happen either way or a controlled
    // importer stays open over a session the importer has already cleaned up.
    const endSession = async (handled: unknown) => {
      const settled = Promise.resolve(handled)
      // The importer reports the failure; this only keeps a rejection arriving
      // after the bound from surfacing as an unhandled one.
      settled.catch(() => undefined)

      try {
        await settledWithinBound(settled, bound)
      } finally {
        if (controlled) {
          handlers.current.onRequestClose?.()
        }
      }
    }

    importer.on("success", (data) => endSession(handlers.current.onSuccess?.(data)))

    importer.on("cancel", () => endSession(handlers.current.onCancel?.()))

    importer.on("error", (error) => {
      handlers.current.onError?.(error)
      if (controlled && error.severity === OneSchemaErrorSeverity.Fatal) {
        handlers.current.onRequestClose?.()
      }
    })

    importer.on("page-loaded", () => {
      handlers.current.onPageLoad?.()
    })

    importer.on("launched", (data) => {
      handlers.current.onLaunched?.(data)
    })

    importer.on("user-activity", () => {
      handlers.current.onUserActivity?.()
    })

    return () => {
      importer.removeAllListeners()
    }
  }, [importer, controlled])

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

  const launch = useCallback(
    (launchParams?: OneSchemaLaunchOverrides) => {
      if (!importer) {
        return Promise.reject(new Error("The OneSchema importer is not mounted yet"))
      }

      if (importer.status !== "idle") {
        console.warn(ALREADY_LAUNCHED_MESSAGE)
      }

      return importer.launch({ ...latestParams.current, ...launchParams })
    },
    [importer],
  )

  useImperativeHandle(
    ref,
    () => ({
      launch,
      close: (clean?: boolean) => importer?.close(clean),
      get status(): OneSchemaImporterStatus {
        return importer?.status ?? "idle"
      },
    }),
    [importer, launch],
  )

  useEffect(() => {
    if (!importer || !controlled) {
      return
    }

    if (isOpen) {
      // Launch failures reach the host through onLaunched, so the rejection
      // itself is redundant here.
      launch().catch(() => undefined)
    } else {
      importer.close()
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

export default React.forwardRef(OneSchemaImporter)
