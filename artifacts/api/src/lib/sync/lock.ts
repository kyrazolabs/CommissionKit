const locks = new Map<string, Promise<void>>();

export async function acquireWorkspaceLock(workspaceId: string): Promise<() => void> {
  while (locks.has(workspaceId)) {
    await locks.get(workspaceId);
  }

  let release: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });

  locks.set(workspaceId, promise);

  return () => {
    locks.delete(workspaceId);
    release!();
  };
}
