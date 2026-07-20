import { GlobalWindow } from "happy-dom";

const window = new GlobalWindow();
for (const key of Object.getOwnPropertyNames(window)) {
  if (key in globalThis) continue;
  try {
    (globalThis as any)[key] = (window as any)[key];
  } catch {}
}
if (!globalThis.document) (globalThis as any).document = window.document;
if (!globalThis.window) (globalThis as any).window = globalThis;

// Mock clipboard API
if (!globalThis.navigator?.clipboard) {
  (globalThis.navigator as any).clipboard = {
    writeText: async () => {},
    readText: async () => "",
  };
}
