import type { CalcEngine } from "./CalcEngine";

const registry = new Map<string, CalcEngine>();

export function registerEngine(engine: CalcEngine): void {
  if (registry.has(engine.name)) {
    throw new Error(`Engine "${engine.name}" is already registered`);
  }
  registry.set(engine.name, engine);
}

export function getEngine(name: string): CalcEngine {
  const engine = registry.get(name);
  if (!engine) {
    throw new Error(`Unknown commission engine: "${name}". Available: ${[...registry.keys()].join(", ")}`);
  }
  return engine;
}

export async function bootstrapEngines(): Promise<void> {
  const { StandardEngine } = await import("./standard.engine");
  registerEngine(new StandardEngine());

  const { AissolEngine } = await import("./aissol.engine");
  registerEngine(new AissolEngine());
}
