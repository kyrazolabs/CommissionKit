import { ExchangeRate } from "@workspace/db";

const OPR_APP_KEY = process.env.OPR_APP_KEY;
const API_URL = `https://openexchangerates.org/api/latest.json?app_id=${OPR_APP_KEY}`;

/**
 * Fetches the latest exchange rates from Open Exchange Rates API
 * and saves them as a new record in the database.
 */
export async function fetchAndSaveRates(): Promise<void> {
  if (!OPR_APP_KEY) {
    console.error("[ExchangeRateService] Missing OPR_APP_KEY in environment variables");
    throw new Error("Missing OPR_APP_KEY");
  }

  try {
    const response = await fetch(API_URL, {
      headers: {
        "User-Agent": "CommissionKit-ExchangeRateService/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Open Exchange Rates API returned status ${response.status}`);
    }

    const data = (await response.json()) as { base: string; rates: Record<string, number> };
    if (!data.rates) {
      throw new Error("Invalid response from Open Exchange Rates API: missing rates");
    }

    // Create a new record instead of updating (maintains historical data)
    await ExchangeRate.create({
      base: data.base || "USD",
      rates: data.rates,
      fetchedAt: new Date(),
    });

    console.info(
      `[ExchangeRateService] Successfully fetched and saved rates for ${Object.keys(data.rates).length} currencies`,
    );
  } catch (err) {
    console.error("[ExchangeRateService] Failed to fetch or save rates:", err);
    throw err;
  }
}
