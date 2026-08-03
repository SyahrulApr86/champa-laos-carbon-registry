// Champa (Lao PDR National Carbon Registry) theme
// Palette references the Lao PDR flag (red band + blue band with white
// disc) and the Dok Champa (Plumeria) national flower, whose white petals
// with a golden-yellow throat provide the accent color.
export const COLOR_CONFIGS = {
  // Lao flag blue (middle stripe) - primary brand / navigation color.
  // Dark enough to keep white text at a comfortable AA contrast ratio.
  PRIMARY_THEME_COLOR: "#0D2E63",
  PRIMARY_FONT_COLOR: "#8C8C8C",
  // Lao flag red (top/bottom stripes) - used for destructive/failed states.
  PRIMARY_RED_COLOR: "#CE1126",
  // Reuses the Lao flag blue for "success"/"processed" status chips, kept
  // consistent with the previous scheme where these mirrored the primary color.
  SUCCESS_RESPONSE_COLOR: "#0D2E63",
  FAILED_RESPONSE_COLOR: "#CE1126",
  PROCESSED_RESPONSE_COLOR: "#0D2E63",
  // Dok Champa gold/yellow accent (flower throat color) - reserved for
  // highlights, badges, and Champa-specific branding accents.
  ACCENT_GOLD_COLOR: "#F2B705",
};
