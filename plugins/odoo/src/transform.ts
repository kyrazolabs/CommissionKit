import type { PaymentStatus } from "@workspace/plugins-core";
import { derivePaymentStatus as coreDerivePaymentStatus } from "@workspace/plugins-core";

const ODOO_PAYMENT_MAP: Record<string, PaymentStatus> = {
  paid: "paid",
  in_payment: "paid",
  partial: "partial",
  not_paid: "unpaid",
  reversed: "on_hold",
};

export function deriveOdooPaymentStatus(invoiceStatus: string | undefined): PaymentStatus {
  if (!invoiceStatus) return "unpaid";

  // Odoo invoice_status can be: "to_invoice", "no", "invoiced", "fully_paid", "paid"
  switch (invoiceStatus) {
    case "fully_paid":
    case "paid":
    case "in_payment":
      return "paid";
    case "partial":
    case "invoiced":
      return "partial";
    case "reversed":
      return "on_hold";
    case "no":
    case "to_invoice":
    default:
      return "unpaid";
  }
}

export function isClosedWon(state: string, closedWonStages: string[]): boolean {
  return closedWonStages.includes(state);
}

export function derivePeriod(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
