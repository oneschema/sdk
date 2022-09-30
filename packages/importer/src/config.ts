/**
 * Config options for how the OneSchema importer will behave
 */
export interface OneSchemaConfig {
  /**
   * Whether importing should be blocked if there are validation errors in the data
   */
  blockImportIfErrors?: boolean
  /**
   * Whether fixable errors should automatically be fixed after the mapping headers step
   */
  autofixAfterMapping?: boolean
  /**
   * Whether suggestions from code hooks should be auto-accepted. Defaults to false
   */
  acceptCodeHookSuggestions?: boolean
  /**
   * Options for specifying and/or modifying content displayed on different panes of the
   * OneSchema Importer
   */
  contentOptions?: OneSchemaContentOptions
}

/**
 * Options for specifying and/or modifying content displayed on different panes of the
 * OneSchema Importer
 */
export interface OneSchemaContentOptions {
  /**
   * Options for the Upload a File step of the OneSchema Importer
   */
  upload?: OneSchemaUploadStepOptions
}

/**
 * Options for content on the the Upload a File step of the OneSchema Importer
 */
export interface OneSchemaUploadStepOptions {
  /**
   * Options to override the content in the uploader
   */
  uploader?: OneSchemaUploaderOptions
  /**
   * Options to specify information displayed in the uploader sidebar
   */
  infoSidebar?: OneSchemaUploadInfoSidebarOptions
}

/**
 * Options to override the content in the uploader
 */
export interface OneSchemaUploaderOptions {
  /**
   * String override for the header in the uploader.
   * Defaults to: "What data do you want to upload?"
   */
  header?: string
  /**
   * String override for the subheader in the uploader
   * Defaults to: "Upload a CSV or Excel file to begin the import process"
   */
  subheader?: string
}

/**
 * Options to specify information displayed in the uploader sidebar
 */
export interface OneSchemaUploadInfoSidebarOptions {
  /**
   * Whether to hide the info banner. Defaults to false.
   */
  hideInfoBanner?: boolean
  /**
   * Text to be displayed in the info banner
   * Defaults to: "Make sure your file includes at least the following required columns:"
   */
  infoBannerText?: string
  /**
   * Specify which template columns to display in the info sidebar.
   * "required" shows only columns that must be mapped
   * "all" shows all columns on the template
   */
  displayTemplateColumns: "required" | "all"
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
   * The key for the webhook that data from this import
   * should be sent to. Setup inside OneSchema before using
   */
  webhookKey?: string
  /**
   * Config options for how the OneSchema importer will behave
   */
  config?: OneSchemaConfig
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
   * Config options for how the OneSchema importer will behave
   */
  config?: OneSchemaConfig
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
  config: {
    blockImportIfErrors: true,
    autofixAfterMapping: false,
  },
}
