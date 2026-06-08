export interface Connector {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: string;
  features: string[];
  version: string;
}

export interface ConnectionStatus {
  connected: boolean;
  connectorName?: string;
  connectorDisplayName?: string;
  status?: string;
  lastSyncedAt?: string;
  syncSchedule?: { reps: string; deals: string };
  writeBackEnabled?: boolean;
  lastError?: string;
  recentSyncs?: SyncEntry[];
}

export interface SyncEntry {
  id: string;
  entityType: string;
  status: string;
  trigger: string;
  stats: { total: number; created: number; updated: number; skipped: number; failed: number };
  completedAt: string;
}

export interface StageOption {
  id: string;
  label: string;
  pipeline: string;
}
