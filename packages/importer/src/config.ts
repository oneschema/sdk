/**
 * Type for hex colors
 */
export type Hex = `#${string}`
/**
 * Type with options for mapping strategy customization
 */
export type MappingStrategy = "exact" | "fuzzy" | "historical"
/**
 * Type with options for import experience customization
 */
export type ImportExperience = "blockIfErrors" | "promptIfErrors" | "ignoreErrors"
/**
 * Type with options for sidebar details customization
 */
export type SidebarDetails = "required" | "all"

/**
 * Available customization settings for OneSchema
 * For more information on a particular setting see https://docs.oneschema.co/docs/customizations
 */
export interface OneSchemaCustomization {
  /**
   * styles
   */
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

  // MODAL
  modalFullscreen?: boolean
  modalMaskColor?: Hex
  modalBorderRadius?: string
  hideLogo?: boolean
  illustrationUrl?: string

  uploaderHeaderText?: string
  uploaderSubheaderText?: string
  uploaderShowSidebar?: boolean
  uploaderSidebarDetails?: SidebarDetails
  uploaderShowSidebarBanner?: boolean
  uploaderSidebarBannerText?: string

  includeExcelTemplate?: boolean
  importExperience?: ImportExperience

  /**
   * importer options
   */
  importUnmappedColumns?: boolean
  mappingStrategy?: MappingStrategy[]
  skipMapping?: MappingStrategy[]
  acceptCodeHookSuggestions?: boolean
  autofixAfterMapping?: boolean
  fileSizeLimit?: number
}

export interface WebhookImportConfig {
  type: "webhook"
  key: string
}

export interface LocalImportConfig {
  type: "local"
  metadataOnly?: boolean
}

export type ImportConfig = WebhookImportConfig | LocalImportConfig

/**
 * Parameters that can be set when the OneSchema importer launches
 */
export interface OneSchemaLaunchParams {
  /**
   * The JSON web token for the user importing data
   */
  userJwt: string
  /**
   * The key for the template that data will be imported for.
   * Setup inside OneSchema before using
   */
  templateKey: string
  /**
   * The configuration for how data should be imported from OneSchema
   */
  importConfig?: ImportConfig
  /**
   * Key for a customization setup in OneSchema
   */
  customizationKey?: string
  /**
   * Customization options for how OneSchema will behave
   */
  customizationOverrides?: OneSchemaCustomization
}

/**
 * Parameters that can be set when the OneSchema importer launches with a sessionToken
 */
export interface OneSchemaLaunchSessionParams {
  /**
   * A token for a session created through the API for initiliaizing OneSchema
   */
  sessionToken: string
  /**
   * Customization options for how OneSchema will behave
   */
  customizationOverrides?: OneSchemaCustomization
}

/**
 * Possible errors when launching OneSchema
 */
export enum OneSchemaLaunchError {
  MissingTemplate,
  MissingJwt,
  MissingSessionToken,
}

export interface OneSchemaLaunchStatus {
  /**
   * Whether or not launch was successful
   */
  success: boolean
  /**
   * If success is false, this will be why it failed
   */
  error?: OneSchemaLaunchError
}

/**
 * Parameters for the OneSchema importer set at initialization
 */
export interface OneSchemaInitParams {
  /**
   * The client id from your OneSchema developer dashboard
   */
  clientId: string
  /**
   * Whether to launch the importer in dev mode.
   * By default checks `process.env.NODE_ENV` for "production"
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
   * Optional language code (like 'en' or 'zh') to force importer language
   * By default, will use user's set language.
   * Requires enterprise licensing
   */
  languageCode?: string
  /**
   * The id of the DOM element the iframe should be appended to
   * By default appends to document.body
   */
  parentId?: string
  /**
   * Whether to save session information to local storage and enable resuming
   * Defaults to false
   */
  saveSession?: boolean
  /**
   * Whether to close the importer when complete.
   * Defaults to true
   */
  autoClose?: boolean
  /**
   * Whether the class should create and append iframe to DOM.
   * Default to true
   */
  manageDOM?: boolean
  /**
   * The base URL for the iframe.
   * By default uses OneSchema's production instance
   */
  baseUrl?: string
}

/**
 * Combined options for params used when launching OneSchema
 */
export type OneSchemaLaunchParamOptions =
  | OneSchemaLaunchParams
  | OneSchemaLaunchSessionParams

/**
 * Parameters for the OneSchema importer, includes all settings
 */
export type OneSchemaParams = OneSchemaInitParams & Partial<OneSchemaLaunchParamOptions>

/**
 * The default values for the OneSchema importer
 */
export const DEFAULT_PARAMS: Partial<OneSchemaParams> = {
  baseUrl: "https://embed.oneschema.co",
  devMode: !!(process.env.NODE_ENV !== "production"),
  className: "oneschema-iframe",
  autoClose: true,
  manageDOM: true,
  saveSession: true,
}
