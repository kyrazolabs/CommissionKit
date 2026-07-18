import type { ClientSession } from "mongoose";

export interface CalcEngineInput {
  workspaceId: string;
  runId: string;
  period: string;
  paymentStatuses?: ("unpaid" | "paid" | "partial" | "on_hold")[];
  wsCurrency: string;
  /** Optional MongoDB session for transactional reads (e.g. sample-data seeding). */
  session?: ClientSession;
}

export interface CalcEngineResult {
  repId: string;
  dealId: string;
  rateApplied: number;
  commissionAmount: number;
  currency: string;
  calculationNote: string;
  wsCurrency?: string;
  convertedDealAmount?: number;
  convertedCommission?: number;
  exchangeRateSnapshot?: number;
  rateSnapshotDate?: string;
  meta?: Record<string, unknown>;
}

export interface CalcEngineSummary {
  totalCommission: number;
  totalItems: number;
  skippedItems: number;
  involvedReps: Set<string>;
}

export interface CalcEngineOutput {
  results: CalcEngineResult[];
  summary: CalcEngineSummary;
}

export interface EngineNavItem {
  name: string;
  href: string;
  icon: string;
  /** Href of the standard nav item this replaces. The item slots into that group. */
  replaces: string;
}

export interface EngineFeature {
  navItems: EngineNavItem[];
}

export interface CalcEngine {
  readonly name: string;
  readonly label: string;
  calculate(input: CalcEngineInput): Promise<CalcEngineOutput>;
  /** Returns features/nav items to render in the frontend sidebar */
  features(): EngineFeature;
}
