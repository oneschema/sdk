/**
 * Type for hex colors
 */
export type Hex = `#${string}`
/**
 * Type with options for mapping strategy customization
 */
export type MappingStrategy =
  | "exact"
  | "fuzzy"
  | "historical_user"
  | "historical_org"
  | "historical" // historical is deprecated
/**
 * Type with options for skipping the header row step
 */
export type SkipHeaderRowStrategy = "always" | "detect" | "never"
/**
 * Type with options for allowing row deletion
 */
export type RowDeletionStrategy = "selection" | "errors"
/**
 * Type with options for AI suggested mappings customization
 */
export type AiSuggestedMappings = "column" | "picklist"
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

  /**
   * options
   */
  // IMPORTER OPTIONS
  hideLogo?: boolean
  modalFullscreen?: boolean
  hideCloseButton?: boolean
  modalMaskColor?: Hex
  modalBorderRadius?: string

  // UPLOAD PANE
  fileSizeLimit?: number
  illustrationUrl?: string
  uploaderShowSidebar?: boolean
  uploaderSidebarDetails?: SidebarDetails
  uploaderShowSidebarBanner?: boolean
  uploaderSidebarBannerText?: string
  includeExcelTemplate?: boolean

  // SELECT HEADER ROW PANE
  skipHeaderRow?: SkipHeaderRowStrategy

  // MAP COLUMNS PANE
  includeUnmappedColumns?: boolean
  mappingStrategy?: MappingStrategy[]
  skipMapping?: MappingStrategy[]
  aiSuggestedMappings?: AiSuggestedMappings[]
  oneClickMode?: boolean
  mappingShowSidebar?: boolean
  mappingSidebarDetails?: SidebarDetails
  mappingShowSidebarBanner?: boolean
  mappingSidebarBannerText?: string | null

  // REVIEW AND FINALIZE PANE
  autofixAfterMapping?: boolean
  acceptCodeHookSuggestions?: boolean
  preventRowDeletion?: RowDeletionStrategy[]
  importErrorUX?: ImportExperience
  skipCleaning?: boolean
  allowEmptyImports?: boolean
  importMaxRowLimit?: number | null
  importRowLimitHeader?: string | null
  importRowLimitDescription?: string | null

  // EDUCATION WIDGET
  showUploadEducationWidget?: boolean
  uploadEducationWidgetMessage?: string
  uploadEducationWidgetAutoOpen?: boolean
  showSetHeaderEducationWidget?: boolean
  setHeaderEducationWidgetMessage?: string
  setHeaderEducationWidgetAutoOpen?: boolean
  showMappingEducationWidget?: boolean
  mappingEducationWidgetMessage?: string
  mappingEducationWidgetAutoOpen?: boolean
  showCleaningEducationWidget?: boolean
  cleaningEducationWidgetMessage?: string
  cleaningEducationWidgetAutoOpen?: boolean

  /**
   * Text overrides
   */
  backButtonText?: string
  nextButtonText?: string
  uploadPaneHeaderText?: string
  uploaderHeaderText?: string
  uploaderSubheaderText?: string
  setHeaderPaneHeaderText?: string
  mappingPaneHeaderText?: string
  mappingUploadedColumnText?: string
  mappingTemplateColumnText?: string
  cleaningPaneHeaderText?: string
  cleaningConfirmButtonText?: string
  picklistMappingHeaderText?: string
  picklistMappingSubheaderText?: string
  picklistMappingUploadedColumnText?: string
  picklistMappingTemplateColumnText?: string
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

export interface FileFeedsLaunchParams {
  /**
   * The JSON Web Token authenticating the user, and authorizing them to access
   * specific OneSchema FileFeeds embedding intents.
   */
  userJwt: string
  customizationKey: string
  customizationOverrides: OneSchemaCustomization
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
