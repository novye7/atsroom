import { useSyncExternalStore, useCallback, useEffect, useRef } from "react";

// ─── Shared command store ───

type Command = "collapse" | "expand" | null;

const listeners = new Set<() => void>();
let currentCommand: Command = null;

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Command {
  return currentCommand;
}

function getServerSnapshot(): Command {
  return null;
}

function broadcast(cmd: Command) {
  currentCommand = cmd;
  listeners.forEach((fn) => fn());
}

// ─── Hook for the global toggle button ───

export function useAliasesCollapsed() {
  const command = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const collapseAll = useCallback(() => broadcast("collapse"), []);
  const expandAll = useCallback(() => broadcast("expand"), []);
  return { command, collapseAll, expandAll } as const;
}

// ─── Hook for each CapsuleCard ───

export function useAliasesCollapseBroadcast(
  localCollapsed: boolean,
  setLocalCollapsed: (v: boolean) => void,
) {
  const command = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const prevCommand = useRef<Command>(null);

  useEffect(() => {
    if (command !== null && command !== prevCommand.current) {
      prevCommand.current = command;
      if (command === "collapse") setLocalCollapsed(true);
      if (command === "expand") setLocalCollapsed(false);
    }
  }, [command, setLocalCollapsed]);
}
