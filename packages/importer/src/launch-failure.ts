import { OneSchemaLaunchError } from "./config"

/**
 * The rejection `launch()` produces when the import session did not start.
 *
 * `embedInitId` is also carried on the `launched` event for the same failure,
 * so a host can tie a support report to one launch attempt.
 */
export class OneSchemaLaunchFailure extends Error {
  readonly error: OneSchemaLaunchError
  readonly embedInitId: string
  /**
   * The HTTP status OneSchema responded with, when the failure came from an
   * API call
   */
  readonly status?: number
  /**
   * The raw error body OneSchema responded with, when one was included
   */
  readonly data?: unknown
  /**
   * The underlying exception or embed payload the failure came from, when
   * there is one
   */
  readonly cause?: unknown

  constructor(
    error: OneSchemaLaunchError,
    message: string,
    embedInitId: string,
    detail: { status?: number; data?: unknown; cause?: unknown } = {},
  ) {
    super(message)
    this.name = "OneSchemaLaunchFailure"
    this.error = error
    this.embedInitId = embedInitId
    this.status = detail.status
    this.data = detail.data
    this.cause = detail.cause

    // Extending a built-in breaks the prototype chain when compiled down to
    // ES5, so instanceof needs it restored.
    Object.setPrototypeOf(this, OneSchemaLaunchFailure.prototype)
  }
}
