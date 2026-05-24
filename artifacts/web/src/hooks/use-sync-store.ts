import { create } from "zustand";

interface SyncState {
  hasSyncError: boolean;
  setSyncError: (val: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  hasSyncError: false,
  setSyncError: (val) => set({ hasSyncError: val }),
}));
