import type { OneSchemaBrandingCustomizations } from "./shared/customizations"

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
 * Type with options for column data types
 */
export type TemplateColumnDataType =
  | "PICKLIST"
  | "NUMBER"
  | "PERCENTAGE"
  | "DATE_MDY"
  | "DATE_DMY"
  | "DATE_ISO"
  | "DATETIME_ISO"
  | "DATETIME_MDYHM"
  | "DATETIME_DMYHM"
  | "DATE_YMD"
  | "DATE_DMMMY"
  | "TIME_HHMM"
  | "UNIX_TIMESTAMP"
  | "URL"
  | "DOMAIN"
  | "FULL_NAME"
  | "EMAIL"
  | "UNIT_OF_MEASURE"
  | "CURRENCY_CODE"
  | "PHONE_NUMBER"
  | "US_PHONE_NUMBER_EXT"
  | "MONEY"
  | "IANA_TIMEZONE"
  | "CUSTOM_REGEX"
  | "ALPHABETICAL"
  | "TEXT"
  | "SSN_MASKED"
  | "SSN_UNMASKED"
  | "FILE_NAME"
  | "UUID"
  | "JSON"
  | "BOOLEAN"
  | "UPC_A"
  | "EAN"
  | "IMEI"
  | "ENUM_US_STATE_TERRITORY"
  | "ENUM_COUNTRY"

/**
 * Available customization settings for OneSchema
 * For more information on a particular setting see https://docs.oneschema.co/docs/customizations
 */
export interface ImporterCustomization extends OneSchemaBrandingCustomizations {
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
 * @deprecated: Use `ImporterCustomization` instead.
 */
export type OneSchemaCustomization = ImporterCustomization

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
 * Interface for column validation options for data type NUMBER
 */
export interface NumberValidationOptions {
  max_num?: number | null
  min_num?: number | null
  only_int?: boolean
  allow_thousand_separators?: boolean
  num_decimals?: number | null
}

/**
 * Interfaces for column validation options for data type PICKLIST
 */
interface PicklistOption {
  value: string | null
  color?: string | null
}

export interface PicklistValidationOptions {
  picklist_options: PicklistOption[]
}

/**
 * Base interface for template columns
 */

type BaseTemplateColumn = {
  key: string
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
} & (
  | {
      data_type: "NUMBER"
      validation_options?: NumberValidationOptions
    }
  | {
      data_type: "PICKLIST"
      validation_options: PicklistValidationOptions
    }
)

/**
 * Params for adding a column to a template
 */
export type OneSchemaTemplateColumnToAdd = BaseTemplateColumn & {
  label: string
}

/**
 * Params for updating a column in a template
 */
export type OneSchemaTemplateColumnToUpdate = BaseTemplateColumn & {
  label?: string
}

/**
 * Params for removing a column from a template
 */
interface OneSchemaTemplateColumnToRemove {
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
  customizationOverrides?: ImporterCustomization
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
   * A token for a session created through the API for initializing OneSchema
   */
  sessionToken: string
}

/**
 * Possible errors when launching OneSchema
 */
export enum OneSchemaLaunchError {
  MissingTemplate,
  MissingJwt,
  MissingSessionToken,
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
  customizationOverrides: ImporterCustomization
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
 * Message passed to OneSchema for init
 */
export type OneSchemaInitMessage =
  | OneSchemaInitSimpleMessage
  | OneSchemaInitSessionMessage

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

export enum OneSchemaErrorSeverity {
  Error = "error",
  Fatal = "fatal",
}

export interface OneSchemaError {
  message: string
  severity: OneSchemaErrorSeverity
}
