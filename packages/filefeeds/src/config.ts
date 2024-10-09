import type { OneSchemaBrandingCustomizations } from "./shared/customizations"

/**
 * Available customization settings for OneSchema
 * For more information on a particular setting see https://docs.oneschema.co/docs/customizations
 */
export interface FileFeedCustomization extends OneSchemaBrandingCustomizations {
  // UPLOAD PANE
  fileSizeLimit?: number
  illustrationUrl?: string
}

/**
 * The default param values for the OneSchema FileFeeds.
 */
export const DEFAULT_PARAMS: Partial<FileFeedsCommonParams> = {
  baseUrl: "https://embed.oneschema.co",
  devMode: Boolean(process.env.NODE_ENV !== "production"),
  className: "oneschema-iframe",
  manageDOM: true,
}

interface FileFeedsCommonParams {
  // TODO: Add `clientId` support.

  /**
   * The JSON Web Token authenticating the user, and authorizing them to access
   * specific OneSchema FileFeeds embedding intents.
   */
  userJwt?: string

  /**
   * The Embed Session Token to use when launching OneSchema FileFeeds to resume
   * an existing session.
   */
  sessionToken?: string

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
   * The customization key. Use this to specify which OneSchema customization to use. Use
   * the default customization if none specified.
   */
  customizationKey?: string

  /**
   * A hash of overrides to modify specific customization values.
   */
  customizationOverrides?: FileFeedCustomization

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

  /**
   * Whether to save session information to local storage and enable resuming
   * Defaults to false
   */
  saveSession?: boolean

  /**
   * A session token to resume an existing session.
   * Automatically populated by the SDK if `saveSession` is true.
   */
  resumeToken?: string
}

interface FileFeedsCreateSessionParams extends FileFeedsCommonParams {
  /**
   * The User JWT is required when creating a new session.
   */
  userJwt: string
}

interface FileFeedsResumeSessionParams extends FileFeedsCommonParams {
  /**
   * The session token to use when launching OneSchema FileFeeds.
   */
  sessionToken: string
}

/**
 * Parameters that can be set when the OneSchema FileFeeds embedding is
 * initialized.
 *
 * NOTE: One of `userJwt` or `sessionToken` should be set. If both are present,
 * then `userJwt` will be checked against the embed session matching the
 * `sessionToken`, and an error will be raised if they do not match.
 */
export type FileFeedsParams = FileFeedsCreateSessionParams | FileFeedsResumeSessionParams

/**
 * A subset of the FileFeedsParams that can be set when launching the embedding.
 */
export type FileFeedsLaunchParams = Partial<
  Pick<
    FileFeedsCommonParams,
    | "userJwt"
    | "customizationKey"
    | "customizationOverrides"
    | "sessionToken"
    | "resumeToken"
  >
>
