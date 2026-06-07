const ODOO_CURRENCY_MAP: Record<string, string> = {
  "us dollar": "USD",
  "euro": "EUR",
  "british pound": "GBP",
  "saudi riyal": "SAR",
  "uae dirham": "AED",
  "canadian dollar": "CAD",
  "australian dollar": "AUD",
  "japanese yen": "JPY",
  "indian rupee": "INR",
  "swiss franc": "CHF",
  "chinese yuan": "CNY",
  "south african rand": "ZAR",
  "singapore dollar": "SGD",
  "hong kong dollar": "HKD",
  "mexican peso": "MXN",
  "brazilian real": "BRL",
  "russian ruble": "RUB",
  "turkish lira": "TRY",
  "nigerian naira": "NGN",
  "egyptian pound": "EGP",
  "kuwaiti dinar": "KWD",
  "qatari riyal": "QAR",
  "omani rial": "OMR",
  "bahraini dinar": "BHD",
  "jordanian dinar": "JOD",
};

const SYMBOL_MAP: Record<string, string> = {
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₹": "INR",
  "﷼": "SAR",
  "₽": "RUB",
  "₺": "TRY",
  "R$": "BRL",
  "CHF": "CHF",
  "C$": "CAD",
  "A$": "AUD",
  "HK$": "HKD",
  "S$": "SGD",
};

export function normalizeOdooCurrency(raw: string | undefined | null): string {
  if (!raw) return "USD";

  const trimmed = raw.trim();

  // Direct 3-letter ISO code
  if (trimmed.length === 3 && trimmed === trimmed.toUpperCase() && /^[A-Z]{3}$/.test(trimmed)) {
    return trimmed;
  }

  // Symbol lookup
  if (SYMBOL_MAP[trimmed]) {
    return SYMBOL_MAP[trimmed];
  }

  // Full name lookup (case-insensitive)
  const lower = trimmed.toLowerCase();
  if (ODOO_CURRENCY_MAP[lower]) {
    return ODOO_CURRENCY_MAP[lower];
  }

  // Try uppercase (might be a 3-letter code with mixed case)
  const upper = trimmed.toUpperCase();
  if (upper.length === 3) return upper;

  // Fallback
  return upper || "USD";
}
