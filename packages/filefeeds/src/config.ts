/**
 * Type for hex colors
 */
export type Hex = `#${string}`

/**
 * Available customization settings for OneSchema
 * For more information on a particular setting see https://docs.oneschema.co/docs/customizations
 */
export interface FileFeedCustomization {
  // GENERAL
  primaryColor?: Hex
  backgroundPrimaryColor?: Hex
  backgroundSecondaryColor?: Hex
  headerColor?: Hex
  footerColor?: Hex
  borderColor?: Hex
  successColor?: Hex
  warningColor?: Hex
  errorColor?: Hex

  // BUTTONS
  buttonBorderRadius?: string
  buttonPrimaryFillColor?: Hex
  buttonPrimaryStrokeColor?: Hex
  buttonPrimaryTextColor?: Hex
  buttonSecondaryFillColor?: Hex
  buttonSecondaryStrokeColor?: Hex
  buttonSecondaryTextColor?: Hex
  buttonTertiaryFillColor?: Hex
  buttonTertiaryStrokeColor?: Hex
  buttonTertiaryTextColor?: Hex
  buttonAlertFillColor?: Hex
  buttonAlertStrokeColor?: Hex
  buttonAlertTextColor?: Hex

  // FONTS
  fontUrl?: string
  fontFamily?: string
  fontColorPrimary?: Hex
  fontColorSecondary?: Hex
  fontColorPlaceholder?: Hex

  // MODAL/FRAME OPTIONS
  hideLogo?: boolean
  modalFullscreen?: boolean
  hideCloseButton?: boolean
  modalMaskColor?: Hex
  modalBorderRadius?: string

  // UPLOAD PANE
  fileSizeLimit?: number
  illustrationUrl?: string
}

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
}
