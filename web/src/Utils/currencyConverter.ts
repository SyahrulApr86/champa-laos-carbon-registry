/**
 * currencyConverter.ts
 *
 * Presentation-only currency conversion helpers for displaying carbon credit
 * values in LAK (Lao Kip) alongside the system's base currency, USD.
 *
 * IMPORTANT:
 * - USD remains the single source of truth for ALL internal calculations,
 *   storage, and UNFCCC reporting. Nothing in this file changes what is sent
 *   to or received from the backend - it only reformats a USD number for
 *   on-screen display.
 * - The exchange rate below is a STATIC, HARD-CODED APPROXIMATION. It is NOT
 *   fetched from any live/real-time forex API. It must be updated manually in
 *   this file when the real-world rate moves meaningfully, or replaced later
 *   with a proper integration against a real-time exchange rate API/service.
 *   Do not treat figures produced with this rate as authoritative for
 *   accounting, invoicing, or regulatory purposes.
 */

export type SupportedCurrency = "USD" | "LAK";

/**
 * Approximate LAK per 1 USD as of writing (2026).
 * The Lao Kip has been volatile in recent years; this is a rough midpoint
 * (~20,000-21,000 LAK/USD range) intended only for indicative UI display.
 *
 * TODO: Replace with a real-time exchange rate source (e.g. a forex API)
 * or, at minimum, review and update this constant periodically by hand.
 */
export const USD_TO_LAK_RATE = 20500;

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: "$",
  LAK: "₭",
};

export const CURRENCY_LOCALES: Record<SupportedCurrency, string> = {
  USD: "en-US",
  LAK: "lo-LA",
};

/**
 * Converts a USD amount into the target display currency.
 * Purely numeric conversion - does not mutate or persist anything.
 */
export const convertFromUSD = (
  amountUSD: number,
  targetCurrency: SupportedCurrency
): number => {
  if (targetCurrency === "USD") {
    return amountUSD;
  }
  return amountUSD * USD_TO_LAK_RATE;
};

/**
 * Formats a USD-denominated amount for display in the requested currency.
 *
 * - USD is formatted with the usual 2 decimal places.
 * - LAK is conventionally displayed without decimal places (its smallest
 *   circulating unit does not warrant fractional display), using
 *   thousands separators appropriate to the currency's locale.
 *
 * This function is presentational only: the value passed in and returned
 * conceptually represents the same underlying USD amount converted for
 * display - it must never be sent back to the backend in place of the
 * original USD figure.
 */
export const formatCurrency = (
  amountUSD: number,
  targetCurrency: SupportedCurrency
): string => {
  if (amountUSD === undefined || amountUSD === null || isNaN(amountUSD)) {
    return "-";
  }

  const convertedAmount = convertFromUSD(amountUSD, targetCurrency);

  const formatted = new Intl.NumberFormat(CURRENCY_LOCALES[targetCurrency], {
    minimumFractionDigits: targetCurrency === "LAK" ? 0 : 2,
    maximumFractionDigits: targetCurrency === "LAK" ? 0 : 2,
  }).format(convertedAmount);

  return `${CURRENCY_SYMBOLS[targetCurrency]} ${formatted}`;
};
