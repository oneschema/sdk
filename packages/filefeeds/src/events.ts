export type FileFeedsEvent =
  // Iframe
  | { type: "page-loaded"; data: PageLoadedEventData }
  | { type: "destroyed"; data: DestroyedEventData }
  // Session
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
  sessionToken: string
  errorsCount: number
  errorCountPerSampleFile: Record<string, number>
}

export type CancelledEventData = Record<string, never>
