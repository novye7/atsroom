import { db } from "@/db";
import { accounts, addresses, labels, addressLabels } from "@/db/schema";
import { eq, inArray, sql, and, desc, asc, max } from "drizzle-orm";
import type { AccountWithDetails, LabelSimple, AddressWithLabels } from "@/types";

// ─── Helpers ───

function buildAccountsWithDetails(accountRows: AccountRow[]): AccountWithDetails[] {
  if (accountRows.length === 0) return [];
  const accountIds = accountRows.map((a) => a.id);

  // Batch load all addresses
  const allAddresses = db
    .select()
    .from(addresses)
    .where(inArray(addresses.accountId, accountIds))
    .orderBy(desc(addresses.isPrimary), asc(addresses.createdAt))
    .all();

  const addressIds = allAddresses.map((a) => a.id);

  // Batch load all address-label joins
  const allAddressLabels =
    addressIds.length > 0
      ? db
          .select({ addressId: addressLabels.addressId, labelId: labels.id, labelName: labels.name })
          .from(addressLabels)
          .innerJoin(labels, eq(addressLabels.labelId, labels.id))
          .where(inArray(addressLabels.addressId, addressIds))
          .all()
      : [];

  // Group addresses by account
  const addressesByAccount = new Map<number, typeof allAddresses>();
  for (const addr of allAddresses) {
    if (!addressesByAccount.has(addr.accountId)) addressesByAccount.set(addr.accountId, []);
    addressesByAccount.get(addr.accountId)!.push(addr);
  }

  // Group labels by address
  const labelsByAddress = new Map<number, LabelSimple[]>();
  for (const al of allAddressLabels) {
    if (!labelsByAddress.has(al.addressId)) labelsByAddress.set(al.addressId, []);
    labelsByAddress.get(al.addressId)!.push({ id: al.labelId, name: al.labelName });
  }

  return accountRows.map((account) => ({
    ...account,
    addresses: (addressesByAccount.get(account.id) || []).map(
      (addr): AddressWithLabels => ({
        ...addr,
        labels: labelsByAddress.get(addr.id) || [],
      })
    ),
  }));
}

type AccountRow = {
  id: number;
  sortOrder: number;
  createdAt: string;
};

// ─── Accounts ───

export function getAllAccounts(): AccountWithDetails[] {
  const accountRows = db.select().from(accounts).orderBy(asc(accounts.sortOrder)).all();
  return buildAccountsWithDetails(accountRows);
}

export function getFilteredAccountIds(labelIds: number[]): number[] | null {
  if (labelIds.length === 0) return null;
  const result = db
    .select({ addressId: addressLabels.addressId })
    .from(addressLabels)
    .where(inArray(addressLabels.labelId, labelIds))
    .groupBy(addressLabels.addressId)
    .having(sql`count(distinct ${addressLabels.labelId}) = ${labelIds.length}`)
    .all();
  if (result.length === 0) return [];
  const addressIds = result.map((r) => r.addressId);
  const accountRows = db
    .select({ accountId: addresses.accountId })
    .from(addresses)
    .where(inArray(addresses.id, addressIds))
    .all();
  return [...new Set(accountRows.map((r) => r.accountId))];
}

export function getFilteredAccounts(labelIds: number[]): AccountWithDetails[] {
  const filteredIds = getFilteredAccountIds(labelIds);
  if (filteredIds === null) return getAllAccounts();
  if (filteredIds.length === 0) return [];
  const idSet = new Set(filteredIds);
  const accountRows = db
    .select()
    .from(accounts)
    .orderBy(asc(accounts.sortOrder))
    .all()
    .filter((a) => idSet.has(a.id));
  return buildAccountsWithDetails(accountRows);
}

export function createAccountWithEmail(email: string, labelNames: string[] = []) {
  return db.transaction((tx) => {
    const maxOrder = tx.select({ value: max(accounts.sortOrder) }).from(accounts).get();
    const sortOrder = (maxOrder?.value ?? -1) + 1;
    const account = tx.insert(accounts).values({ sortOrder }).returning().get();
    const address = tx
      .insert(addresses)
      .values({ accountId: account.id, email, isPrimary: true })
      .returning()
      .get();
    for (const name of labelNames) {
      const existingLabel = tx.select().from(labels).where(eq(labels.name, name)).get();
      const labelId = existingLabel ? existingLabel.id : tx.insert(labels).values({ name }).returning().get().id;
      tx.insert(addressLabels).values({ addressId: address.id, labelId }).run();
    }
    return account;
  });
}

export function deleteAccount(id: number) {
  return db.delete(accounts).where(eq(accounts.id, id)).returning().get();
}

export function reorderAccounts(orderedIds: number[]) {
  const unique = new Set(orderedIds);
  if (unique.size !== orderedIds.length) throw new Error("orderedIds contains duplicates");
  db.transaction((tx) => {
    const existing = tx
      .select({ id: accounts.id })
      .from(accounts)
      .all()
      .map((r) => r.id);
    const existingSet = new Set(existing);
    if (unique.size !== existingSet.size || orderedIds.some((id) => !existingSet.has(id))) {
      throw new Error("orderedIds does not match existing accounts");
    }
    orderedIds.forEach((id, index) => {
      tx.update(accounts).set({ sortOrder: index }).where(eq(accounts.id, id)).run();
    });
  });
}

// ─── Addresses ───

export function getAddressesByAccount(accountId: number) {
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.accountId, accountId))
    .orderBy(desc(addresses.isPrimary), asc(addresses.createdAt))
    .all();
}

export function createAddress(accountId: number, email: string) {
  const account = db.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, accountId)).get();
  if (!account) throw new Error("Account does not exist");
  return db.insert(addresses).values({ accountId, email, isPrimary: false }).returning().get();
}

export function updateAddress(id: number, email: string) {
  return db.update(addresses).set({ email }).where(eq(addresses.id, id)).returning().get();
}

export function deleteAddress(id: number) {
  return db.delete(addresses).where(eq(addresses.id, id)).returning().get();
}

export function promoteAddress(accountId: number, addressId: number) {
  db.transaction((tx) => {
    const target = tx
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.accountId, accountId)))
      .get();
    if (!target) throw new Error("目标地址不存在");
    tx.update(addresses)
      .set({ isPrimary: false })
      .where(and(eq(addresses.accountId, accountId), eq(addresses.isPrimary, true)))
      .run();
    tx.update(addresses).set({ isPrimary: true }).where(eq(addresses.id, addressId)).run();
  });
}

// ─── Labels ───

export function getAllLabels(): LabelSimple[] {
  return db
    .select({ id: labels.id, name: labels.name })
    .from(labels)
    .orderBy(asc(labels.sortOrder), asc(labels.name))
    .all();
}

export function createLabel(name: string) {
  return db.insert(labels).values({ name }).returning().get();
}

export function updateLabel(id: number, name: string) {
  return db.update(labels).set({ name }).where(eq(labels.id, id)).returning().get();
}

export function deleteLabel(id: number) {
  return db.delete(labels).where(eq(labels.id, id)).returning().get();
}

// ─── Address Labels ───

export function updateAddressLabels(
  addressId: number,
  data: { addLabelNames?: string[]; removeLabelIds?: number[] }
) {
  return db.transaction((tx) => {
    if (data.addLabelNames?.length) {
      for (const name of data.addLabelNames) {
        const existingLabel = tx.select().from(labels).where(eq(labels.name, name)).get();
        const labelId = existingLabel ? existingLabel.id : tx.insert(labels).values({ name }).returning().get().id;
        const existing = tx
          .select()
          .from(addressLabels)
          .where(and(eq(addressLabels.addressId, addressId), eq(addressLabels.labelId, labelId)))
          .get();
        if (!existing) tx.insert(addressLabels).values({ addressId, labelId }).run();
      }
    }
    if (data.removeLabelIds?.length) {
      for (const labelId of data.removeLabelIds) {
        tx.delete(addressLabels)
          .where(and(eq(addressLabels.addressId, addressId), eq(addressLabels.labelId, labelId)))
          .run();
      }
    }
  });
}
