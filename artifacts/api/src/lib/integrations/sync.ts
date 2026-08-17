import { syncDealsQueue, syncRepsQueue } from "@workspace/queue";

export async function startSyncs(
  workspaceId: string,
  connectorName: string,
  syncSchedule?: { reps: string; deals: string },
): Promise<void> {
  await syncRepsQueue.add(`initial-reps-${workspaceId}-${connectorName}`, {
    workspaceId,
    connectorName,
    trigger: "initial",
  });
  await syncDealsQueue.add(`initial-deals-${workspaceId}-${connectorName}`, {
    workspaceId,
    connectorName,
    trigger: "initial",
  });

  const sched = syncSchedule || { reps: "hourly", deals: "hourly" };
  const intervalFor = (v: string) =>
    v === "realtime" ? 600_000 : v === "daily" ? 86_400_000 : 3_600_000;

  if (sched.reps !== "manual") {
    await syncRepsQueue.add(
      `scheduled-reps-${workspaceId}-${connectorName}`,
      { workspaceId, connectorName, trigger: "scheduled" },
      {
        repeat: { every: intervalFor(sched.reps) },
        jobId: `scheduled-reps-${workspaceId}-${connectorName}`,
        removeOnComplete: { age: 300 },
        removeOnFail: { age: 300 },
      },
    );
  }
  if (sched.deals !== "manual") {
    await syncDealsQueue.add(
      `scheduled-deals-${workspaceId}-${connectorName}`,
      { workspaceId, connectorName, trigger: "scheduled" },
      {
        repeat: { every: intervalFor(sched.deals) },
        jobId: `scheduled-deals-${workspaceId}-${connectorName}`,
        removeOnComplete: { age: 300 },
        removeOnFail: { age: 300 },
      },
    );
  }
}
