/**
 * Currency formatting utilities for PKR (Pakistani Rupee)
 * All amounts stored as integers in paisa (1 PKR = 100 paisa)
 */

const CURRENCY_SYMBOL = 'Rs.';
const DECIMAL_PLACES = 2;
const PAISA_PER_RUPEE = 100;

/**
 * Convert paisa (integer) to display string
 * @param {number} paisa - Amount in paisa
 * @param {boolean} showSign - Whether to show + or - prefix
 * @returns {string} Formatted currency string
 */
export function formatCurrency(paisa, showSign = false) {
  const rupees = Math.abs(paisa) / PAISA_PER_RUPEE;
  const formatted = rupees.toLocaleString('en-PK', {
    minimumFractionDigits: DECIMAL_PLACES,
    maximumFractionDigits: DECIMAL_PLACES,
  });
  
  const sign = showSign ? (paisa >= 0 ? '+' : '-') : (paisa < 0 ? '-' : '');
  return `${sign}${CURRENCY_SYMBOL}${formatted}`;
}

/**
 * Convert display amount (rupees as float) to paisa (integer)
 * @param {number|string} rupees - Amount in rupees
 * @returns {number} Amount in paisa (integer)
 */
export function toPaisa(rupees) {
  return Math.round(parseFloat(rupees) * PAISA_PER_RUPEE);
}

/**
 * Convert paisa (integer) to rupees (float) - for display/input only
 * @param {number} paisa - Amount in paisa
 * @returns {number} Amount in rupees
 */
export function toRupees(paisa) {
  return paisa / PAISA_PER_RUPEE;
}

/**
 * Format a compact currency display (no decimals for whole numbers)
 * @param {number} paisa - Amount in paisa
 * @returns {string} Compact formatted string
 */
export function formatCompact(paisa) {
  const rupees = Math.abs(paisa) / PAISA_PER_RUPEE;
  if (rupees >= 100000) {
    return `${CURRENCY_SYMBOL}${(rupees / 100000).toFixed(1)}L`;
  }
  if (rupees >= 1000) {
    return `${CURRENCY_SYMBOL}${(rupees / 1000).toFixed(1)}K`;
  }
  return formatCurrency(paisa);
}

export { CURRENCY_SYMBOL };
