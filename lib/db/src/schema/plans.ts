import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plansTable = pgTable("plans", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default(""),
  name: text("name").notNull(),
  type: text("type").notNull(), // flat | tiered | accelerator
  flatRate: numeric("flat_rate", { precision: 10, scale: 4 }),
  acceleratorThreshold: numeric("accelerator_threshold", { precision: 12, scale: 2 }),
  acceleratorRate: numeric("accelerator_rate", { precision: 10, scale: 4 }),
  clawbackDays: integer("clawback_days"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const planTiersTable = pgTable("plan_tiers", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  fromAmount: numeric("from_amount", { precision: 12, scale: 2 }).notNull(),
  toAmount: numeric("to_amount", { precision: 12, scale: 2 }),
  rate: numeric("rate", { precision: 10, scale: 4 }).notNull(),
});

export const insertPlanSchema = createInsertSchema(plansTable).omit({ id: true, createdAt: true });
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plansTable.$inferSelect;

export const insertPlanTierSchema = createInsertSchema(planTiersTable).omit({ id: true });
export type InsertPlanTier = z.infer<typeof insertPlanTierSchema>;
export type PlanTier = typeof planTiersTable.$inferSelect;
