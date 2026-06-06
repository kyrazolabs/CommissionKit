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

export function normalizeOdooCurrency(raw: string | undefined | null): string {
  if (!raw) return "USD";

  const upper = raw.trim().toUpperCase();
  if (upper.length === 3) return upper;

  return ODOO_CURRENCY_MAP[raw.trim().toLowerCase()] || upper || "USD";
}
