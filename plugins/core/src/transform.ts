import type { PaymentStatus } from "./types";

const CURRENCY_MAP: Record<string, string> = {
  "US Dollar": "USD",
  Euro: "EUR",
  "British Pound": "GBP",
  "Saudi Riyal": "SAR",
  "UAE Dirham": "AED",
  "Canadian Dollar": "CAD",
  "Australian Dollar": "AUD",
  "Japanese Yen": "JPY",
  "Indian Rupee": "INR",
};

export function normalizeCurrency(code: string): string {
  const upper = code?.toUpperCase() || "";
  if (upper.length === 3) return upper; // Already ISO 4217
  return CURRENCY_MAP[code] || upper || "USD";
}

export function derivePeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function derivePaymentStatus(
  rawStatus: string,
  mappings?: Record<string, PaymentStatus>,
): PaymentStatus {
  const lower = rawStatus?.toLowerCase() || "";
  if (mappings && mappings[lower]) return mappings[lower];

  switch (lower) {
    case "paid":
    case "fully_paid":
    case "completed":
    case "in_payment":
      return "paid";
    case "partial":
    case "partially_paid":
    case "invoiced":
      return "partial";
    case "not_paid":
    case "outstanding":
    case "to_invoice":
    case "no":
      return "unpaid";
    case "reversed":
    case "cancelled":
    case "on_hold":
      return "on_hold";
    default:
      return "unpaid";
  }
}

export function mapStageToSynced(rawStage: string, closedWonStages: string[]): string | null {
  if (closedWonStages.includes(rawStage)) return rawStage;
  return null; // Not a closed-won stage, don't sync
}

export function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
    if (i === 3 || i === 7) code += "-";
  }
  return code;
}
