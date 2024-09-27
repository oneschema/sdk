export type FileFeedsEvent =
  // Iframe
  | { type: "page-loaded"; data: PageLoadedEventData }
  | { type: "destroyed"; data: DestroyedEventData }
  // Data init
  | { type: "init-started"; data: InitStartedEventData }
  | { type: "init-failed"; data: InitFailedEventData }
  | { type: "init-succeeded"; data: InitSucceededEventData }
  // Visibility
  | { type: "hidden"; data: HiddenEventData }
  | { type: "shown"; data: ShownEventData }
  // Transforms
  | { type: "saved"; data: SavedEventData }
  | { type: "cancelled"; data: CancelledEventData }

export interface PageLoadedEventData {
  initOnLoad: boolean
}

export type DestroyedEventData = Record<string, never>

export type InitStartedEventData = Record<string, never>

export interface InitFailedEventData {
  error: {
    message: string
  }
}

export interface InitSucceededEventData {
  sessionToken: string
  // TODO: remove session_id
  sessionId: number
  fileFeed: {
    name: string
    id: number
  }
}

export interface SessionInvalidatedEventData {
  error: {
    message: string
  }
}
export type HiddenEventData = Record<string, never>
export type ShownEventData = Record<string, never>

export interface SavedEventData {
  sessionId: number
  errorsCount: number
  errorCountPerSampleFile: Record<string, number>
}

export interface CancelledEventData {
  sessionId: number
}
