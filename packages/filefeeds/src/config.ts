/**
 * The default param values for the OneSchema FileFeeds.
 */
export const DEFAULT_PARAMS: Partial<FileFeedsParams> = {
  baseUrl: "https://embed.oneschema.co",
  devMode: Boolean(process.env.NODE_ENV !== "production"),
  className: "oneschema-iframe",
  manageDOM: true,
}

/**
 * Parameters that can be set when the OneSchema FileFeeds is initialized.
 */
export interface FileFeedsParams {
  /**
   * The JSON Web Token authenticating the user, and authorizing them to access
   * specific OneSchema FileFeeds embedding intents.
   */
  userJwt: string

  /**
   * Whether to launch the OneSchema FileFeeds in dev mode.
   *
   * Defaults to false when `process.env.NODE_ENV` is "production", and true
   * otherwise.
   */
  devMode?: boolean

  /**
   * CSS class for the iframe
   */
  className?: string

  /**
   * CSS Styles to be applied directly to the iframe
   */
  styles?: Partial<CSSStyleDeclaration>

  /**
   * The id of the DOM element the iframe should be appended to
   * By default appends to document.body
   */
  parentId?: string

  /**
   * Whether the class should create and append iframe to DOM.
   *
   * Defaults to `true`.
   */
  manageDOM?: boolean

  /**
   * The base URL for the iframe. Use this to point to a different region.
   *
   * Defaults to the US OneSchema production servers.
   */
  baseUrl?: string
}

/**
 * Possible errors when launching OneSchema
 */
export enum FileFeedsLaunchError {
  MissingJwt,
  LaunchError,
}

/**
 * Message params shared for all messageTypes.
 */
export interface FileFeedsSharedInitParams {
  version: string
  client: string
}

/**
 * Message params for init a standard OneSchema FileFeeds.
 */
export interface FileFeedsInitMessage extends FileFeedsSharedInitParams {
  type: "init"
}
