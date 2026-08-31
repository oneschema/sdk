import type { OneSchemaBrandingCustomizations } from "./shared/customizations"

/**
 * Type with options for mapping strategy customization
 */
export type MappingStrategy =
  "exact" | "fuzzy" | "historical_user" | "historical_org" | "historical" // historical is deprecated

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
  CsvFileUploadImportConfig | JsonFileUploadImportConfig

/**
 * Configuration for importing data, supporting various destination types.
 */
export type ImportConfig =
  WebhookImportConfig | LocalImportConfig | FileUploadImportConfig

/**
 * Interface for column validation options for data type BOOLEAN
 */
export interface BooleanValidationOptions {
  true_label: string
  false_label: string
}

/**
 * Interface for column validation options for data type NUMBER
 */
export interface NumberValidationOptions {
  format?: "eu" | "us"
  max_num?: number | null
  min_num?: number | null
  only_int?: boolean
  allow_thousand_separators?: boolean
  num_decimals?: number | null
}

/**
 * Interfaces for column validation options for data type PICKLIST
 */
export interface PicklistOption {
  value: string
  values?: string[] // deprecated
  color?: string | null
  alternative_names?: string[]
}

export interface PicklistValidationOptions {
  picklist_options: PicklistOption[]
}

/**
 * Interface for column validation options for data type ENUM_COUNTRY
 */
export interface EnumCountryValidationOptions {
  format: "name" | "code2" | "code3"
  variant_set_mods?: string[] // deprecated
}

/**
 * Interface for column validation options for data type CURRENCY_CODE
 */
export interface CurrencyCodeValidationOptions {
  format?: "code"
  variant_set_mods?: string[] // deprecated
}

/**
 * Interface for column validation options for data type CUSTOM_REGEX
 */
export interface CustomRegexValidationOptions {
  regex: string
  error_message: string
}

/**
 * Interface for column validation options for DATE data types ("Advanced ambiguous date detection")
 */
export interface AdvancedAmbiguousDateDetectionValidationOptions {
  input_date_order: "dmy" | "mdy" | "ymd"
}

/**
 * Interface for column validation options for data type MONEY
 */
export interface MoneyValidationOptions {
  currency_symbol: "dollar" | "euro" | "pound" | "yen"
}

/**
 * Interface for column validation options for data type ALPHABETICAL
 */
export interface AlphabeticalValidationOptions {
  allow_spaces?: boolean
  allow_special?: boolean
}

/**
 * Interface for column validation options for data type FILE_NAME
 */
export interface FileNameValidationOptions {
  extensions: string[]
}

/**
 * Interface for column validation options for data type "ENUM_US_STATE_TERRITORY"
 */
export interface EnumUsStateTerritoryValidationOptions {
  format: "name" | "code"
  variant_set_mods?:
    ["include_dc"] | ["include_territories"] | ["include_dc", "include_territories"]
}

/**
 * Base interface for template columns
 */
export type OneSchemaTemplateColumn = {
  key: string
  label: string
  description: string
  is_custom: boolean
  is_required: boolean
  is_unique: boolean
  is_locked: boolean
  is_hidden: boolean
  is_unmappable: boolean
  letter_case: string
  min_char_limit: number
  max_char_limit: number
  delimiter: string
  must_exist: boolean
  default_value: string
  mapping_hints: string[]
} & (
  | {
      data_type:
        | "DOMAIN"
        | "EAN"
        | "EMAIL"
        | "IANA_TIMEZONE"
        | "IMEI"
        | "JSON"
        | "LOCATION_POSTALCODE"
        | "PERCENTAGE"
        | "PHONE_NUMBER"
        | "SSN_MASKED"
        | "SSN_UNMASKED"
        | "TEXT"
        | "TIME_HHMM"
        | "UNIT_OF_MEASURE"
        | "UPC_A"
        | "URL"
        | "US_PHONE_NUMBER_EXT"
        | "UUID"
    }
  | {
      data_type: "ALPHABETICAL"
      validation_options?: AlphabeticalValidationOptions
    }
  | {
      data_type: "BOOLEAN"
      validation_options: BooleanValidationOptions
    }
  | {
      data_type: "CURRENCY_CODE"
      validation_options?: CurrencyCodeValidationOptions
    }
  | {
      data_type: "CUSTOM_REGEX"
      validation_options: CustomRegexValidationOptions
    }
  | {
      data_type:
        | "DATE_ISO"
        | "DATE_MDY"
        | "DATE_DMY"
        | "DATE_YMD"
        | "DATE_DMMMY"
        | "DATETIME_ISO"
        | "DATETIME_MDYHM"
        | "DATETIME_DMYHM"
        | "UNIX_TIMESTAMP"
      validation_options?: AdvancedAmbiguousDateDetectionValidationOptions
    }
  | {
      data_type: "ENUM_COUNTRY"
      validation_options?: EnumCountryValidationOptions
    }
  | {
      data_type: "ENUM_US_STATE_TERRITORY"
      validation_options?: EnumUsStateTerritoryValidationOptions
    }
  | {
      data_type: "FILE_NAME"
      validation_options?: FileNameValidationOptions
    }
  | {
      data_type: "MONEY"
      validation_options?: MoneyValidationOptions
    }
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
 * @deprecated Use `OneSchemaTemplateColumn["data_type"]` instead.
 */
export type TemplateColumnDataType = OneSchemaTemplateColumn["data_type"]

/**
 * Params for adding a column to a template
 */
export type OneSchemaTemplateColumnToAdd = Pick<
  OneSchemaTemplateColumn,
  "key" | "label"
> &
  Partial<OneSchemaTemplateColumn>

/**
 * Params for updating a column in a template
 */
export type OneSchemaTemplateColumnToUpdate = Pick<OneSchemaTemplateColumn, "key"> &
  Partial<OneSchemaTemplateColumn>

/**
 * Params for removing a column from a template
 */
export type OneSchemaTemplateColumnToRemove = Pick<OneSchemaTemplateColumn, "key">

/**
 * Type of validation hook: either "row" or "column".
 * For row hooks, each request sends a batch of rows.
 * For column hooks, each request will be sent with all rows.
 * For more information on a particular setting see https://docs.oneschema.co/docs/validation-webhook#validation-webhook
 */
export type ValidationHookType = "row" | "column"

/**
 * Type of authorization used in the header of a validation hook: either "basic" or "bearer_user_jwt".
 * For "basic", the secret key is used to authenticate the request.
 * For "bearer_user_jwt", the user JWT is used to authenticate the request.
 * For more information on a particular setting see https://docs.oneschema.co/docs/validation-webhook#securing-your-validation-hook
 */
export type ValidationHookAuthorizationType = "basic" | "bearer_user_jwt"

/**
 * Params for adding a validation hook to a template
 */
export interface OneSchemaValidationHookToAdd {
  name: string
  url: string
  column_keys?: string[]
  custom_column_keys?: string[]
  hook_type?: ValidationHookType
  authorization_type?: ValidationHookAuthorizationType
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
  Destroyed,
  /**
   * The import session did not start within `initTimeoutMs`, usually because
   * the browser blocked the iframe or the embed never acknowledged the init
   * message
   */
  Timeout,
  /**
   * The launch was abandoned by `close()`, `destroy()` or a newer `launch()`
   * before the import session started
   */
  Cancelled,
}

/**
 * The running import session `launch()` resolves with
 */
export interface OneSchemaLaunchInfo {
  /**
   * An id shared with the `launched` event for the same attempt, so a support
   * report can name one launch
   */
  embedInitId: string
  /**
   * The session token for the running import, when there is one
   */
  sessionToken?: string
  /**
   * The embed id for the running import, when the embed reported one
   */
  embedId?: string
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
  /**
   * If success is false, a human-readable description of the failure
   */
  message?: string
  /**
   * If success is false, the HTTP status OneSchema responded with, when the
   * failure came from an API call
   */
  status?: number
  /**
   * If success is false, the raw error body OneSchema responded with, when
   * one was included
   */
  data?: unknown
  /**
   * An id shared with the `launch()` resolution or rejection for the same
   * attempt, so a support report can name one launch
   */
  embedInitId: string
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
   * Whether to launch the importer in dev mode, which shows the iframe even
   * when launching fails
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
   * The DOM element the iframe should be appended to
   * By default appends to document.body
   */
  parent?: HTMLElement
  /**
   * The id of the DOM element the iframe should be appended to
   * @deprecated Pass `parent` instead. An id is resolved once, at construction, so it falls back to document.body when the element does not exist yet.
   */
  parentId?: string
  /**
   * Whether to save session information to local storage and enable resuming
   */
  saveSession?: boolean
  /**
   * Whether to close the importer when complete
   */
  autoClose?: boolean
  /**
   * Whether the class should create and append the iframe to the DOM
   */
  manageDOM?: boolean
  /**
   * The base URL for the iframe.
   * By default uses OneSchema's production instance
   */
  baseUrl?: string
  /**
   * How long a launch may stay pending before `launch()` rejects with
   * `OneSchemaLaunchError.Timeout`, in milliseconds. The deadline covers the
   * whole launch, not only the init acknowledgement. Raise it for hosts on
   * slow or distant connections. Defaults to 20000
   */
  initTimeoutMs?: number
}

/**
 * Combined options for params used when launching OneSchema
 */
export type OneSchemaLaunchParamOptions =
  OneSchemaLaunchParams | OneSchemaLaunchSessionParams

/**
 * Parameters for the OneSchema importer, includes all settings
 */
export type OneSchemaParams = OneSchemaInitParams & Partial<OneSchemaLaunchParamOptions>

/**
 * Message params shared for all messageTypes
 */
export interface OneSchemaSharedInitParams {
  manualClose: boolean
  /**
   * Identifies the launch attempt this message belongs to. The embed echoes it
   * on `launched` and `launch-error` so a reply from an abandoned attempt can
   * be told apart from the one in flight
   */
  embedInitId: string

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
  OneSchemaInitSimpleMessage | OneSchemaInitSessionMessage

/**
 * The default values for the OneSchema importer
 */
export const DEFAULT_PARAMS: Partial<OneSchemaParams> = {
  baseUrl: "https://embed.oneschema.co",
  devMode: !!(process.env.NODE_ENV !== "production"),
  className: "oneschema-iframe",
  initTimeoutMs: 20000,
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

/**
 * Where an importer instance is in its lifecycle
 */
export type OneSchemaImporterStatus = "idle" | "launching" | "launched" | "destroyed"

/**
 * An import the host receives the rows for directly
 */
export interface OneSchemaLocalImportResult {
  type: "local"
  data: Record<string, unknown>
}

/**
 * An import OneSchema delivered to the configured webhook
 */
export interface OneSchemaWebhookImportResult {
  type: "webhook"
  eventId?: string
  responses?: unknown[]
}

/**
 * An import OneSchema wrote to the file the host provided, described by the
 * metadata the embed reports back
 */
export interface OneSchemaFileUploadImportResult {
  type: "file-upload"
  data: Record<string, unknown>
}

/**
 * The result of an import, discriminated by how the data was delivered
 */
export type OneSchemaImportResult =
  | OneSchemaLocalImportResult
  | OneSchemaWebhookImportResult
  | OneSchemaFileUploadImportResult

/**
 * The events emitted by the OneSchema importer, mapped to their listener
 * arguments
 */
export interface OneSchemaEventMap {
  /**
   * The embedded importer page finished loading behind the scenes
   */
  "page-loaded": [Record<string, never>]
  /**
   * The import session was launched, or launching it failed
   */
  launched: [OneSchemaLaunchStatus]
  /**
   * The user finished importing. For `local` imports the data is the payload,
   * for `webhook` imports it summarizes the delivery
   */
  success: [OneSchemaImportResult]
  /**
   * The user cancelled the import
   */
  cancel: []
  /**
   * Something went wrong. `severity` is `fatal` when the session cannot continue
   */
  error: [OneSchemaError]
  /**
   * The user interacted with the importer. Throttled to once every 30 seconds,
   * and useful for resetting idle timers in the host application
   */
  "user-activity": []
}
