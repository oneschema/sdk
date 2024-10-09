import type { Hex } from "./types"

/**
 * Corresponds to the Branding Customizations.
 *
 * https://[ORG_SUBDOMAIN].oneschema.co/customizations
 */
export interface OneSchemaBrandingCustomizations {
  // General: Colors
  primaryColor?: Hex
  backgroundPrimaryColor?: Hex
  backgroundSecondaryColor?: Hex
  headerColor?: Hex
  footerColor?: Hex
  borderColor?: Hex
  successColor?: Hex
  warningColor?: Hex
  errorColor?: Hex

  // General: Modal
  modalFullscreen?: boolean
  hideCloseButton?: boolean
  modalMaskColor?: Hex
  modalBorderRadius?: string

  // Buttons
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

  // Fonts
  fontUrl?: string
  fontFamily?: string
  fontColorPrimary?: Hex
  fontColorSecondary?: Hex
  fontColorPlaceholder?: Hex

  // Hide logo
  hideLogo?: boolean
}
