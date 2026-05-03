import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const commissionRunsTable = pgTable("commission_runs", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  period: text("period").notNull(),
  totalCommission: numeric("total_commission", { precision: 12, scale: 2 }).notNull().default("0"),
  totalDeals: integer("total_deals").notNull().default(0),
  repsCount: integer("reps_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const commissionResultsTable = pgTable("commission_results", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull(),
  repId: integer("rep_id").notNull(),
  dealId: integer("deal_id").notNull(),
  rateApplied: numeric("rate_applied", { precision: 10, scale: 4 }).notNull(),
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }).notNull(),
  calculationNote: text("calculation_note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertCommissionRunSchema = createInsertSchema(commissionRunsTable).omit({ id: true, createdAt: true });
export type InsertCommissionRun = z.infer<typeof insertCommissionRunSchema>;
export type CommissionRun = typeof commissionRunsTable.$inferSelect;

export const insertCommissionResultSchema = createInsertSchema(commissionResultsTable).omit({ id: true, createdAt: true });
export type InsertCommissionResult = z.infer<typeof insertCommissionResultSchema>;
export type CommissionResult = typeof commissionResultsTable.$inferSelect;
