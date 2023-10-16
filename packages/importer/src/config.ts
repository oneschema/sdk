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

  // MODAL
  modalFullscreen?: boolean
  modalMaskColor?: Hex
  modalBorderRadius?: string
  hideLogo?: boolean
  illustrationUrl?: string

  uploaderShowSidebar?: boolean
  uploaderSidebarDetails?: SidebarDetails
  uploaderShowSidebarBanner?: boolean
  uploaderSidebarBannerText?: string

  includeExcelTemplate?: boolean
  importErrorUX?: ImportExperience

  /**
   * text overrides
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

  /**
   * importer options
   */
  includeUnmappedColumns?: boolean
  mappingStrategy?: MappingStrategy[]
  skipMapping?: MappingStrategy[]
  skipHeaderRow?: SkipHeaderRowStrategy
  acceptCodeHookSuggestions?: boolean
  autofixAfterMapping?: boolean
  fileSizeLimit?: number
  aiSuggestedMappings?: AiSuggestedMappings[]
}

/**
 * Configuration for importing data through a webhook.
 */
export interface WebhookImportConfig {
  type: "webhook"
  key: string
}

/**
 * Configuration for importing local data.
 */
export interface LocalImportConfig {
  type: "local"
  metadataOnly?: boolean
}

/**
 * Configuration for importing data through file upload.
 */
export interface BaseFileUploadImportConfig {
  type: "file-upload"
  url: string
  headers?: { [headerName: string]: string }
}

/*
 * Configuration for importing data through CSV file upload.
 */
export interface CsvFileUploadImportConfig extends BaseFileUploadImportConfig {
  format: "csv"
  formatOptions?: {
    headerStyle?: "names" | "keys"
  }
}

/*
 * Configuration for importing data through JSON file upload.
 */
export interface JsonFileUploadImportConfig extends BaseFileUploadImportConfig {
  format: "json"
}

/*
 * Configuration for importing data through file upload.
 */
export type FileUploadImportConfig =
  | CsvFileUploadImportConfig
  | JsonFileUploadImportConfig

/**
 * Configuration for importing data, supporting various destination types.
 */
export type ImportConfig =
  | WebhookImportConfig
  | LocalImportConfig
  | FileUploadImportConfig

/**
 * Params for updating a column in a template
 */
export interface OneSchemaTemplateColumnToUpdate {
  key: string
  label?: string
  data_type?: string | null
  validation_options?: { [key: string]: any }
  description?: string
  is_custom?: boolean
  is_required?: boolean
  is_unique?: boolean
  letter_case?: string
  min_char_limit?: number
  max_char_limit?: number
  delimiter?: string
  must_exist?: boolean
  default_value?: string
  mapping_hints?: string[]
}

/**
 * Params for adding a column to a template
 */
export interface OneSchemaTemplateColumnToAdd
  extends Omit<OneSchemaTemplateColumnToUpdate, "label"> {
  label: string
}

/**
 * Params for removing a column from a template
 */
export interface OneSchemaTemplateColumnToRemove {
  key: string
}

/**
 * Type of validation hook: either "row" or "column".
 * For row hooks, each request sends a batch of rows.
 * For column hooks, each request will be sent with all rows.
 * For more information on a particular setting see https://docs.oneschema.co/docs/validation-webhook#validation-webhook
 */
export type ValidationHookType = "row" | "column"

/**
 * Params for adding a validation hook to a template
 */
export interface OneSchemaValidationHookToAdd {
  name: string
  url: string
  column_keys?: string[]
  custom_column_keys?: string[]
  hook_type?: ValidationHookType
  secret_key?: string
  batch_size?: number
}

export type OneSchemaMappingValidationToAdd = {
  type: "required-column-group"
  columns: string[]
}

/**
 * Overrides for a template
 * For more information on a particular setting see https://docs.oneschema.co/docs/per-customer-overrides-v2
 */
export interface OneSchemaTemplateOverrides {
  columns_to_add?: OneSchemaTemplateColumnToAdd[]
  columns_to_update?: OneSchemaTemplateColumnToUpdate[]
  columns_to_remove?: OneSchemaTemplateColumnToRemove[]
  validation_hooks_to_add?: OneSchemaValidationHookToAdd[]
  mapping_validations_to_add?: OneSchemaMappingValidationToAdd[]
}

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
   * Template overrides to modify the behavior of the base template
   */
  templateOverrides?: OneSchemaTemplateOverrides
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
  /**
   * Event webhooks that should be used during an import session
   */
  eventWebhookKeys?: string[]
}

/**
 * Parameters that can be set when the OneSchema importer launches with a sessionToken
 */
export interface OneSchemaLaunchSessionParams {
  /**
   * A token for a session created through the API for initiliaizing OneSchema
   */
  sessionToken: string
}

/**
 * Parameters that can be set when the OneSchema importer launches with a template group.
 */
export interface OneSchemaLaunchTemplateGroupParams {
  /**
   * The key for the template group that data will be imported for.
   * Setup associated templates and linked validations
   * inside OneSchema before using.
   */
  templateGroupKey: string
}

/**
 * Possible errors when launching OneSchema
 */
export enum OneSchemaLaunchError {
  MissingTemplate,
  MissingJwt,
  MissingSessionToken,
  MissingTemplateGroup,
  LaunchError,
}

export interface OneSchemaLaunchStatus {
  /**
   * Whether or not launch was successful
   */
  success: boolean
  /**
   * If success is true, include a session token
   */
  sessionToken?: string
  /**
   * If success is true, include the embed ID
   */
  embedId?: string
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
  | OneSchemaLaunchTemplateGroupParams

/**
 * Parameters for the OneSchema importer, includes all settings
 */
export type OneSchemaParams = OneSchemaInitParams & Partial<OneSchemaLaunchParamOptions>

/**
 * Message params shared for all messageTypes
 */
export interface OneSchemaSharedInitParams {
  manualClose: boolean

  // debug info
  version: string
  client: string
}

/**
 * Message params for init a standard OneSchemaImporter
 */
export interface OneSchemaInitSimpleMessage extends OneSchemaSharedInitParams {
  messageType: "init"
  userJwt: string
  templateKey: string
  importConfig: ImportConfig
  customizationKey: string
  customizationOverrides: OneSchemaCustomization
  templateOverrides: OneSchemaTemplateOverrides
  eventWebhookKeys: string[]
  resumeToken?: string
}

/**
 * Message params for init a OneSchemaImporter with a sessionToken
 */
export interface OneSchemaInitSessionMessage extends OneSchemaSharedInitParams {
  messageType: "init-session"
  sessionToken: string
}

/**
 * Message params for init a OneSchemaImporter with a templateGroup
 */
export interface OneSchemaInitTemplateGroupMessage extends OneSchemaSharedInitParams {
  messageType: "init-template-group"
  userJwt: string
  templateGroupKey: string
  importConfig: ImportConfig
  customizationKey: string
  customizationOverrides: OneSchemaCustomization
}

/**
 * Message passed to OneSchema for init
 */
export type OneSchemaInitMessage =
  | OneSchemaInitSimpleMessage
  | OneSchemaInitSessionMessage
  | OneSchemaInitTemplateGroupMessage

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
