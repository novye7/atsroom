"use client";

import { createContext, useContext } from "react";
import type { AccountWithDetails, LabelSimple } from "./types";

// ─── DataContext Type ───

export interface DataContextType {
  accounts: AccountWithDetails[];
  labels: LabelSimple[];
  loading: boolean;
  filterLabelIds: number[];
  setFilterLabelIds: (ids: number[]) => void;
  refreshData: () => Promise<void>;
  // Account mutations
  createAccount: (email: string, labelNames?: string[]) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
  // Address mutations
  createAddress: (accountId: number, email: string) => Promise<void>;
  updateAddress: (accountId: number, addressId: number, email: string) => Promise<void>;
  deleteAddress: (accountId: number, addressId: number) => Promise<void>;
  promoteAddress: (accountId: number, addressId: number) => Promise<void>;
  // Label mutations
  addLabel: (accountId: number, addressId: number, labelName: string) => Promise<void>;
  removeLabel: (accountId: number, addressId: number, labelId: number) => Promise<void>;
  createLabel: (name: string) => Promise<LabelSimple | null>;
  deleteLabel: (id: number) => Promise<void>;
  updateLabel: (id: number, name: string) => Promise<void>;
  // Reorder
  reorderAccounts: (orderedIds: number[]) => Promise<void>;
}

export const DataContext = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
