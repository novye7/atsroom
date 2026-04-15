"use client";

import { useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { DataContext } from "@howmanyat/ui";
import type { AccountWithDetails, LabelSimple } from "@howmanyat/ui";

// ─── Typed API Helper ───

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) throw new Error(text || `请求失败 (${res.status})`);
    throw new Error("响应格式错误");
  }
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err.error || "请求失败");
  }
  return data as T;
}

// ─── Provider ───

interface ServerDataProviderProps {
  children: ReactNode;
  initialAccounts: AccountWithDetails[];
  initialLabels: LabelSimple[];
}

export function ServerDataProvider({
  children,
  initialAccounts,
  initialLabels,
}: ServerDataProviderProps) {
  const [accounts, setAccounts] = useState<AccountWithDetails[]>(initialAccounts);
  const [labels, setLabels] = useState<LabelSimple[]>(initialLabels);
  const [loading, setLoading] = useState(false);
  const [filterLabelIds, setFilterLabelIds] = useState<number[]>([]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsData, labelsData] = await Promise.all([
        api<AccountWithDetails[]>("/api/accounts"),
        api<LabelSimple[]>("/api/labels"),
      ]);
      setAccounts(accountsData);
      setLabels(labelsData);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "刷新数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Account mutations ───

  const handleCreateAccount = useCallback(async (email: string, labelNames: string[] = []) => {
    try {
      await api("/api/accounts", {
        method: "POST",
        body: JSON.stringify({ email, labelNames }),
      });
      await refreshData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "创建账户失败");
      throw e;
    }
  }, [refreshData]);

  const handleDeleteAccount = useCallback(async (id: number) => {
    try {
      await api(`/api/accounts/${id}`, { method: "DELETE" });
      await refreshData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "删除账户失败");
    }
  }, [refreshData]);

  // ─── Address mutations ───

  const handleCreateAddress = useCallback(async (accountId: number, email: string) => {
    try {
      await api(`/api/accounts/${accountId}/addresses`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      await refreshData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "创建地址失败");
      throw e;
    }
  }, [refreshData]);

  const handleUpdateAddress = useCallback(async (accountId: number, addressId: number, email: string) => {
    try {
      await api(`/api/accounts/${accountId}/addresses/${addressId}`, {
        method: "PATCH",
        body: JSON.stringify({ email }),
      });
      await refreshData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "更新地址失败");
      throw e;
    }
  }, [refreshData]);

  const handleDeleteAddress = useCallback(async (accountId: number, addressId: number) => {
    try {
      await api(`/api/accounts/${accountId}/addresses/${addressId}`, { method: "DELETE" });
      await refreshData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "删除地址失败");
    }
  }, [refreshData]);

  const handlePromoteAddress = useCallback(async (accountId: number, addressId: number) => {
    try {
      await api(`/api/accounts/${accountId}/addresses/${addressId}/promote`, { method: "POST" });
      await refreshData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "设为主邮箱失败");
    }
  }, [refreshData]);

  // ─── Label mutations ───

  const handleAddLabel = useCallback(async (accountId: number, addressId: number, labelName: string) => {
    try {
      await api(`/api/accounts/${accountId}/addresses/${addressId}`, {
        method: "PATCH",
        body: JSON.stringify({ addLabelNames: [labelName] }),
      });
      await refreshData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "添加标签失败");
    }
  }, [refreshData]);

  const handleRemoveLabel = useCallback(async (accountId: number, addressId: number, labelId: number) => {
    try {
      await api(`/api/accounts/${accountId}/addresses/${addressId}`, {
        method: "PATCH",
        body: JSON.stringify({ removeLabelIds: [labelId] }),
      });
      await refreshData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "移除标签失败");
    }
  }, [refreshData]);

  const handleCreateLabel = useCallback(async (name: string): Promise<LabelSimple | null> => {
    try {
      const updatedLabels = await api<LabelSimple[]>("/api/labels", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setLabels(updatedLabels);
      return updatedLabels.find((l) => l.name === name) ?? null;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "创建标签失败");
      return null;
    }
  }, []);

  const handleDeleteLabel = useCallback(async (id: number) => {
    try {
      await api(`/api/labels/${id}`, { method: "DELETE" });
      await refreshData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "删除标签失败");
    }
  }, [refreshData]);

  const handleUpdateLabel = useCallback(async (id: number, name: string) => {
    try {
      await api(`/api/labels/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      await refreshData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "更新标签失败");
    }
  }, [refreshData]);

  const handleReorderAccounts = useCallback(async (orderedIds: number[]) => {
    // Optimistic: apply new order immediately so UI doesn't jump
    setAccounts((prev) => {
      const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
      return [...prev].sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      );
    });

    try {
      await api("/api/accounts/reorder", {
        method: "PUT",
        body: JSON.stringify({ orderedIds }),
      });
      await refreshData();
    } catch (e: unknown) {
      // Revert on failure
      await refreshData();
      toast.error(e instanceof Error ? e.message : "排序失败");
    }
  }, [refreshData]);

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
