import type { CKitPlugin } from "./types";

class PluginRegistry {
  private plugins = new Map<string, CKitPlugin>();

  register(plugin: CKitPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[PluginRegistry] Overwriting existing plugin: ${plugin.name}`);
    }
    this.plugins.set(plugin.name, plugin);
    console.log(`[PluginRegistry] Registered: ${plugin.name} v${plugin.version}`);
  }

  get(name: string): CKitPlugin | undefined {
    return this.plugins.get(name);
  }

  list(): CKitPlugin[] {
    return Array.from(this.plugins.values());
  }

  getNames(): string[] {
    return Array.from(this.plugins.keys());
  }
}

export const pluginRegistry = new PluginRegistry();
