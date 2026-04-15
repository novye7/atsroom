"use client";

import { useMemo, useCallback, useEffect, useRef, useSyncExternalStore, useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { InlineAdd } from "./inline-add";
import { DomainSection } from "./domain-section";
import { useData } from "../../data-context";
import { useIsMobile } from "../../hooks/use-mobile";
import type { AccountWithDetails, DomainGroup } from "../../types";

// ─── Domain sort order (localStorage via useSyncExternalStore) ───

const STORAGE_KEY = "howmanyat-domain-order";

const storageListeners = new Set<() => void>();

function subscribeToStorage(callback: () => void) {
  storageListeners.add(callback);
  return () => storageListeners.delete(callback);
}

const EMPTY_ARRAY: string[] = [];

let cachedSnapshot: string[] = EMPTY_ARRAY;
let cachedRaw: string | null = null;

function getStorageSnapshot(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    cachedSnapshot = raw ? JSON.parse(raw) : EMPTY_ARRAY;
    return cachedSnapshot;
  } catch {
    cachedRaw = null;
    cachedSnapshot = EMPTY_ARRAY;
    return cachedSnapshot;
  }
}

function getServerSnapshot(): string[] {
  return EMPTY_ARRAY;
}

function saveDomainOrder(domains: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(domains));
    storageListeners.forEach((fn) => fn());
  } catch {
    // ignore storage errors
  }
}

function useDomainOrder(): string[] {
  return useSyncExternalStore(subscribeToStorage, getStorageSnapshot, getServerSnapshot);
}

function extractDomain(email: string): string {
  const parts = email.split("@");
  return parts[parts.length - 1] || "";
}

// ─── Group accounts by domain (pure function) ───

function groupByDomain(
  accounts: AccountWithDetails[],
  filterLabelIds: number[],
  savedOrder: string[]
): DomainGroup[] {
  const filtered =
    filterLabelIds.length === 0
      ? accounts
      : accounts.filter((account) =>
          account.addresses.some((addr) =>
            filterLabelIds.every((fId) => addr.labels.some((l) => l.id === fId))
          )
        );

  const domainMap = new Map<string, AccountWithDetails[]>();

  for (const account of filtered) {
    const primary = account.addresses.find((a) => a.isPrimary);
    if (!primary) continue;
    const domain = extractDomain(primary.email);
    if (!domainMap.has(domain)) domainMap.set(domain, []);
    domainMap.get(domain)!.push(account);
  }

  // Merge: saved order first, then any new domains
  const allDomains = [...domainMap.keys()];
  const orderedDomains: string[] = [];
  for (const d of savedOrder) {
    if (domainMap.has(d)) orderedDomains.push(d);
  }
  for (const d of allDomains) {
    if (!orderedDomains.includes(d)) orderedDomains.push(d);
  }

  return orderedDomains.map((domain) => ({
    domain,
    accounts: domainMap.get(domain) ?? [],
  }));
}

// Compute the merged domain order without triggering side effects
function computeMergedOrder(
  accounts: AccountWithDetails[],
  savedOrder: string[]
): string[] {
  const domainMap = new Map<string, AccountWithDetails[]>();
  for (const account of accounts) {
    const primary = account.addresses.find((a) => a.isPrimary);
    if (!primary) continue;
    const domain = extractDomain(primary.email);
    if (!domainMap.has(domain)) domainMap.set(domain, []);
    domainMap.get(domain)!.push(account);
  }
  const allDomains = [...domainMap.keys()];
  const orderedDomains: string[] = [];
  for (const d of savedOrder) {
    if (domainMap.has(d)) orderedDomains.push(d);
  }
  for (const d of allDomains) {
    if (!orderedDomains.includes(d)) orderedDomains.push(d);
  }
  return orderedDomains;
}

// ─── CapsuleList ───

export function CapsuleList() {
  const { accounts, filterLabelIds, createAccount, reorderAccounts } = useData();
  const savedOrder = useDomainOrder();
  const isMobile = useIsMobile();

  const domainGroups = useMemo(
    () => groupByDomain(accounts, filterLabelIds, savedOrder),
    [accounts, filterLabelIds, savedOrder]
  );

  // Track active id for drag overlay styling
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync new domains to localStorage after render (not during)
  const prevOrderRef = useRef(savedOrder);
  useEffect(() => {
    const merged = computeMergedOrder(accounts, savedOrder);
    if (merged.length > savedOrder.length || merged.some((d, i) => d !== savedOrder[i])) {
      saveDomainOrder(merged);
    }
    prevOrderRef.current = merged;
  }, [accounts, savedOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const domainIds = useMemo(() => domainGroups.map((g) => g.domain), [domainGroups]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      if (activeId.startsWith("capsule:")) {
        // ─── Capsule reorder ───
        const activeAccountId = parseInt(activeId.split(":")[1]);
        const overAccountId = parseInt(overId.split(":")[1]);
        // Only reorder within the same domain
        const activeGroup = domainGroups.find((g) =>
          g.accounts.some((a) => a.id === activeAccountId)
        );
        const overGroup = domainGroups.find((g) =>
          g.accounts.some((a) => a.id === overAccountId)
        );
        if (!activeGroup || !overGroup || activeGroup.domain !== overGroup.domain) return;

        // Use global account order (already sorted by sortOrder)
        const currentIds = accounts.map((a) => a.id);
        const oldIndex = currentIds.indexOf(activeAccountId);
        const newIndex = currentIds.indexOf(overAccountId);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(currentIds, oldIndex, newIndex);
        reorderAccounts(reordered);
      } else {
        // ─── Domain reorder ───
        const oldIndex = domainIds.indexOf(activeId);
        const newIndex = domainIds.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = [...domainIds];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        saveDomainOrder(reordered);
      }
    },
    [domainIds, domainGroups, accounts, reorderAccounts]
  );

  const handleAddEmail = useCallback(
    async (email: string) => {
      await createAccount(email);
    },
    [createAccount]
  );

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--text-tertiary)] text-sm mb-4">
          还没有邮箱地址，添加第一个吧
        </p>
        <InlineAdd onSubmit={handleAddEmail} placeholder="输入邮箱地址" />
      </div>
    );
  }

  // Label filter active but no results
  if (filterLabelIds.length > 0 && domainGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--text-tertiary)] text-sm">
          没有匹配的邮箱，试试拖拽邮箱到侧边栏的标签上
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={domainIds} strategy={verticalListSortingStrategy}>
        <div>
          {domainGroups.map((group) => (
            <DomainSection
              key={group.domain}
              id={group.domain}
              domain={group.domain}
              accounts={group.accounts}
              isDragging={activeId === group.domain}
            />
          ))}
        </div>
      </SortableContext>

      {/* Single add entry at bottom */}
      <div className="mt-2">
        <InlineAdd onSubmit={handleAddEmail} placeholder="添加邮箱" />
      </div>
    </DndContext>
  );
}
