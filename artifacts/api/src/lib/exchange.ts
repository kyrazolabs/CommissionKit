import { ExchangeRate } from "@workspace/db";

/**
 * Converts an amount from one currency to another using the latest exchange rates.
 * Falls back to 1:1 conversion (with a warning) if no rates are available.
 */
export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;

  const latest = await ExchangeRate.findOne().sort({ fetchedAt: -1 });
  if (!latest || !latest.rates) {
    console.warn(`[Exchange] No exchange rates found. Falling back to 1:1 for ${from} -> ${to}`);
    return amount;
  }

  const rates = latest.rates;
  const fromRate = rates instanceof Map ? rates.get(from) : (rates as any)[from];
  const toRate = rates instanceof Map ? rates.get(to) : (rates as any)[to];

  if (fromRate === undefined || toRate === undefined) {
    console.warn(`[Exchange] Rate not found for ${from} or ${to}. Falling back to 1:1`);
    return amount;
  }

  const amountInUsd = amount / fromRate;
  return amountInUsd * toRate;
}

export interface ConversionResult {
  /** The converted amount in the target currency */
  converted: number;
  /** 1 <from> = rate <to> */
  rate: number;
  /** ISO date string of the ExchangeRate record used */
  snapshotDate: string;
}

/**
 * Converts an amount using the exchange rate record whose fetchedAt is closest to
 * (and no later than) `beforeDate`. Falls back to the latest available if none found.
 *
 * This is the authoritative function for all commission calculations — it ensures
 * that rates are anchored to the moment the deal was entered, not the current time.
 */
export async function convertCurrencyAt(
  amount: number,
  from: string,
  to: string,
  beforeDate: Date,
): Promise<ConversionResult> {
  if (from === to) {
    return { converted: amount, rate: 1, snapshotDate: beforeDate.toISOString() };
  }

  // Find the closest rate at or before the target date
  let rateRecord = await ExchangeRate.findOne({ fetchedAt: { $lte: beforeDate } }).sort({ fetchedAt: -1 });

  // Fallback: use the oldest available rate if deal predates our rate history
  if (!rateRecord) {
    rateRecord = await ExchangeRate.findOne().sort({ fetchedAt: 1 });
  }

  if (!rateRecord || !rateRecord.rates) {
    console.warn(`[Exchange] No rate record found for date ${beforeDate.toISOString()}. Using 1:1 fallback.`);
    return { converted: amount, rate: 1, snapshotDate: beforeDate.toISOString() };
  }

  const rates = rateRecord.rates;
  const fromRate = rates instanceof Map ? rates.get(from) : (rates as any)[from];
  const toRate = rates instanceof Map ? rates.get(to) : (rates as any)[to];

  if (fromRate === undefined || toRate === undefined) {
    console.warn(`[Exchange] Rate not found for ${from} or ${to} at ${beforeDate.toISOString()}. Using 1:1 fallback.`);
    return { converted: amount, rate: 1, snapshotDate: rateRecord.fetchedAt.toISOString() };
  }

  const amountInUsd = amount / fromRate;
  const converted = amountInUsd * toRate;
  // Rate expressed as: 1 <from> = rate <to>
  const rate = toRate / fromRate;

  return {
    converted,
    rate,
    snapshotDate: rateRecord.fetchedAt.toISOString(),
  };
}

/**
 * Gets the latest exchange rates as a plain object.
 */
export async function getLatestRates(): Promise<Record<string, number>> {
  const latest = await ExchangeRate.findOne().sort({ fetchedAt: -1 });
  if (!latest || !latest.rates) return { USD: 1 };

  if (latest.rates instanceof Map) {
    return Object.fromEntries(latest.rates);
  }
  return latest.rates as any;
}
