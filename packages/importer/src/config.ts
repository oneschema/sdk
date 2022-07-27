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
 * Parameters for the OneSchema importer, includes all settings
 */
export interface OneSchemaParams extends Partial<OneSchemaLaunchParams> {
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
  },
}
