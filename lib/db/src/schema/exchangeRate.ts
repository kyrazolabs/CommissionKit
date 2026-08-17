import mongoose, { type Document, model, Schema } from "mongoose";
import { z } from "zod";

const ExchangeRateSchema = new Schema(
  {
    base: {
      type: String,
      required: true,
      default: "USD",
    },
    rates: {
      type: Map,
      of: Number,
      required: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false, collection: "exchangeRates", bufferCommands: true },
);

// Ensure we don't recreate the model if it already exists (useful in HMR)
export const ExchangeRate =
  mongoose.models.ExchangeRate || model("ExchangeRate", ExchangeRateSchema);

export type ExchangeRate = Document & {
  base: string;
  rates: Map<string, number>;
  fetchedAt: Date;
};

export const insertExchangeRateSchema = z.object({
  base: z.string().default("USD"),
  rates: z.record(z.string(), z.number()),
  fetchedAt: z.date().optional(),
});
