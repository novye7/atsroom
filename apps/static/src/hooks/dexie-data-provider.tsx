"use client";

import { useState, useCallback, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import { DataContext } from "@howmanyat/ui/data-context";
import type { AccountWithDetails, LabelSimple } from "@howmanyat/ui/types";
import { validateEmail } from "@howmanyat/ui/lib/utils";
import { db, useLiveQuery } from "@/db";

// ─── Provider ───

export function DexieDataProvider({ children }: { children: ReactNode }) {
  const [filterLabelIds, setFilterLabelIds] = useState<number[]>([]);

  const rawAccounts = useLiveQuery(() => db.accounts.orderBy("sortOrder").toArray());
  const rawAddresses = useLiveQuery(() => db.addresses.toArray());
  const rawLabels = useLiveQuery(() => db.labels.orderBy("sortOrder").toArray());
  const rawAddressLabels = useLiveQuery(() => db.addressLabels.toArray());

  const loading = rawAccounts === undefined || rawAddresses === undefined || rawLabels === undefined || rawAddressLabels === undefined;

  // ─── Join tables into AccountWithDetails[] ───

  const accounts = useMemo<AccountWithDetails[]>(() => {
    if (!rawAccounts || !rawAddresses || !rawLabels || !rawAddressLabels) return [];

    const labelMap = new Map(rawLabels.map((l) => [l.id!, l]));
    const addressLabelMap = new Map<number, LabelSimple[]>();

    for (const al of rawAddressLabels) {
      const list = addressLabelMap.get(al.addressId) ?? [];
      const label = labelMap.get(al.labelId);
      if (label) list.push({ id: label.id!, name: label.name });
      addressLabelMap.set(al.addressId, list);
    }

    return rawAccounts.map((account) => ({
      id: account.id!,
      sortOrder: account.sortOrder,
      createdAt: account.createdAt,
      addresses: rawAddresses
        .filter((a) => a.accountId === account.id)
        .map((addr) => ({
          id: addr.id!,
          accountId: addr.accountId,
          email: addr.email,
          isPrimary: addr.isPrimary,
          createdAt: addr.createdAt,
          labels: addressLabelMap.get(addr.id!) ?? [],
        })),
    }));
  }, [rawAccounts, rawAddresses, rawLabels, rawAddressLabels]);

  const labels = useMemo<LabelSimple[]>(() => {
    if (!rawLabels) return [];
    return rawLabels.map((l) => ({ id: l.id!, name: l.name }));
  }, [rawLabels]);

  // ─── refreshData (no-op, useLiveQuery auto-updates) ───

  const refreshData = useCallback(async () => {
    // Dexie useLiveQuery handles reactivity; nothing to refresh
  }, []);

  // ─── Account mutations ───

  const handleCreateAccount = useCallback(async (email: string, labelNames: string[] = []) => {
    try {
      const formatError = validateEmail(email);
      if (formatError) throw new Error(formatError);

      await db.transaction("rw", ["accounts", "addresses", "labels", "addressLabels"], async () => {
        // Check email uniqueness
        const existing = await db.addresses.where("email").equals(email).first();
        if (existing) throw new Error("该邮箱地址已存在");

        const maxSort = await db.accounts.orderBy("sortOrder").last();
        const sortOrder = (maxSort?.sortOrder ?? 0) + 1;
        const now = new Date().toISOString();

        const accountId = await db.accounts.add({ sortOrder, createdAt: now });
        await db.addresses.add({
          accountId: accountId as number,
          email,
          isPrimary: true,
          createdAt: now,
        });

        // Resolve labels by name, creating if needed
        for (const name of labelNames) {
          const trimmed = name.trim();
          if (!trimmed) continue;
          let label = await db.labels.where("name").equals(trimmed).first();
          if (!label) {
            const maxLabelSort = await db.labels.orderBy("sortOrder").last();
            const labelSortOrder = (maxLabelSort?.sortOrder ?? 0) + 1;
            const labelId = await db.labels.add({ name: trimmed, sortOrder: labelSortOrder, createdAt: now });
            label = { id: labelId as number, name: trimmed, sortOrder: labelSortOrder, createdAt: now };
          }
          const newAddr = await db.addresses.where("accountId").equals(accountId as number).first();
          if (newAddr) {
            await db.addressLabels.add({ addressId: newAddr.id!, labelId: label.id! });
          }
        }
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "创建账户失败");
      throw e;
    }
  }, []);

  const handleDeleteAccount = useCallback(async (id: number) => {
    try {
      await db.transaction("rw", ["accounts", "addresses", "addressLabels"], async () => {
        const accountAddresses = await db.addresses.where("accountId").equals(id).toArray();
        const addressIds = accountAddresses.map((a) => a.id!);

        for (const addressId of addressIds) {
          await db.addressLabels.where("addressId").equals(addressId).delete();
        }
        await db.addresses.where("accountId").equals(id).delete();
        await db.accounts.delete(id);
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "删除账户失败");
    }
  }, []);

  // ─── Address mutations ───

  const handleCreateAddress = useCallback(async (accountId: number, email: string) => {
    try {
      const formatError = validateEmail(email);
      if (formatError) throw new Error(formatError);

      const existing = await db.addresses.where("email").equals(email).first();
      if (existing) throw new Error("该邮箱地址已存在");

      await db.addresses.add({
        accountId,
        email,
        isPrimary: false,
        createdAt: new Date().toISOString(),
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "创建地址失败");
      throw e;
    }
  }, []);

  const handleUpdateAddress = useCallback(async (_accountId: number, addressId: number, email: string) => {
    try {
      const formatError = validateEmail(email);
      if (formatError) throw new Error(formatError);

      const existing = await db.addresses.where("email").equals(email).first();
      if (existing && existing.id !== addressId) throw new Error("该邮箱地址已存在");

      await db.addresses.update(addressId, { email });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "更新地址失败");
      throw e;
    }
  }, []);

  const handleDeleteAddress = useCallback(async (_accountId: number, addressId: number) => {
    try {
      await db.transaction("rw", ["addresses", "addressLabels"], async () => {
        await db.addressLabels.where("addressId").equals(addressId).delete();
        await db.addresses.delete(addressId);
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "删除地址失败");
    }
  }, []);

  const handlePromoteAddress = useCallback(async (accountId: number, addressId: number) => {
    try {
      await db.transaction("rw", "addresses", async () => {
        const accountAddresses = await db.addresses.where("accountId").equals(accountId).toArray();
        for (const addr of accountAddresses) {
          await db.addresses.update(addr.id!, { isPrimary: addr.id === addressId });
        }
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "设为主邮箱失败");
    }
  }, []);

  // ─── Label mutations ───

  const handleAddLabel = useCallback(async (_accountId: number, addressId: number, labelName: string) => {
    try {
      await db.transaction("rw", ["labels", "addressLabels"], async () => {
        const trimmed = labelName.trim();
        if (!trimmed) return;

        let label = await db.labels.where("name").equals(trimmed).first();
        if (!label) {
          const maxSort = await db.labels.orderBy("sortOrder").last();
          const sortOrder = (maxSort?.sortOrder ?? 0) + 1;
          const labelId = await db.labels.add({ name: trimmed, sortOrder, createdAt: new Date().toISOString() });
          label = { id: labelId as number, name: trimmed, sortOrder, createdAt: new Date().toISOString() };
        }

        const existing = await db.addressLabels
          .where("[addressId+labelId]")
          .equals([addressId, label.id!])
          .first();
        if (!existing) {
          await db.addressLabels.add({ addressId, labelId: label.id! });
        }
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "添加标签失败");
    }
  }, []);

  const handleRemoveLabel = useCallback(async (_accountId: number, addressId: number, labelId: number) => {
    try {
      await db.addressLabels.where("[addressId+labelId]").equals([addressId, labelId]).delete();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "移除标签失败");
    }
  }, []);

  const handleCreateLabel = useCallback(async (name: string): Promise<LabelSimple | null> => {
    try {
      const trimmed = name.trim();
      if (!trimmed) return null;

      const existing = await db.labels.where("name").equals(trimmed).first();
      if (existing) return { id: existing.id!, name: existing.name };

      const maxSort = await db.labels.orderBy("sortOrder").last();
      const sortOrder = (maxSort?.sortOrder ?? 0) + 1;
      const labelId = await db.labels.add({
        name: trimmed,
        sortOrder,
        createdAt: new Date().toISOString(),
      });
      return { id: labelId as number, name: trimmed };
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "创建标签失败");
      return null;
    }
  }, []);

  const handleDeleteLabel = useCallback(async (id: number) => {
    try {
      await db.transaction("rw", ["labels", "addressLabels"], async () => {
        await db.addressLabels.where("labelId").equals(id).delete();
        await db.labels.delete(id);
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "删除标签失败");
    }
  }, []);

  const handleUpdateLabel = useCallback(async (id: number, name: string) => {
    try {
      await db.labels.update(id, { name: name.trim() });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "更新标签失败");
    }
  }, []);

  const handleReorderAccounts = useCallback(async (orderedIds: number[]) => {
    try {
      await db.transaction("rw", "accounts", async () => {
        for (let i = 0; i < orderedIds.length; i++) {
          await db.accounts.update(orderedIds[i], { sortOrder: i });
        }
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "排序失败");
    }
  }, []);

  return (
    <DataContext.Provider
      value={{
        accounts,
        labels,
        loading,
        filterLabelIds,
        setFilterLabelIds,
        refreshData,
        createAccount: handleCreateAccount,
        deleteAccount: handleDeleteAccount,
        createAddress: handleCreateAddress,
        updateAddress: handleUpdateAddress,
        deleteAddress: handleDeleteAddress,
        promoteAddress: handlePromoteAddress,
        addLabel: handleAddLabel,
        removeLabel: handleRemoveLabel,
        createLabel: handleCreateLabel,
        deleteLabel: handleDeleteLabel,
        updateLabel: handleUpdateLabel,
        reorderAccounts: handleReorderAccounts,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
