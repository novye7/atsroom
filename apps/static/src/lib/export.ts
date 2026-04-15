import type { ExportData } from "@howmanyat/ui/types";
import { db } from "@/db";

export async function exportAllData(): Promise<ExportData> {
  const [rawAccounts, rawAddresses, rawLabels, rawAddressLabels] = await Promise.all([
    db.accounts.orderBy("sortOrder").toArray(),
    db.addresses.toArray(),
    db.labels.orderBy("sortOrder").toArray(),
    db.addressLabels.toArray(),
  ]);

  const labelMap = new Map(rawLabels.map((l) => [l.id!, l]));

  const addressLabelNames = new Map<number, string[]>();
  for (const al of rawAddressLabels) {
    const names = addressLabelNames.get(al.addressId) ?? [];
    const label = labelMap.get(al.labelId);
    if (label) names.push(label.name);
    addressLabelNames.set(al.addressId, names);
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: rawAccounts.map((account) => ({
      id: account.id!,
      sortOrder: account.sortOrder,
      createdAt: account.createdAt,
      addresses: rawAddresses
        .filter((a) => a.accountId === account.id)
        .map((addr) => ({
          id: addr.id!,
          email: addr.email,
          isPrimary: addr.isPrimary,
          createdAt: addr.createdAt,
          labelNames: addressLabelNames.get(addr.id!) ?? [],
        })),
    })),
    labels: rawLabels.map((l) => ({
      id: l.id!,
      name: l.name,
      sortOrder: l.sortOrder,
      createdAt: l.createdAt,
    })),
  };
}

export async function importAllData(data: ExportData): Promise<void> {
  await db.transaction("rw", ["accounts", "addresses", "labels", "addressLabels"], async () => {
    // Clear all tables
    await db.accounts.clear();
    await db.addresses.clear();
    await db.labels.clear();
    await db.addressLabels.clear();

    // Import labels first, build name -> new id mapping
    const labelIdMap = new Map<number, number>();
    for (const label of data.labels) {
      const newId = await db.labels.add({
        name: label.name,
        sortOrder: label.sortOrder,
        createdAt: label.createdAt,
      });
      labelIdMap.set(label.id, newId as number);
    }

    // Import accounts and addresses
    for (const account of data.accounts) {
      const newAccountId = await db.accounts.add({
        sortOrder: account.sortOrder,
        createdAt: account.createdAt,
      });

      for (const addr of account.addresses) {
        const newAddressId = await db.addresses.add({
          accountId: newAccountId as number,
          email: addr.email,
          isPrimary: addr.isPrimary,
          createdAt: addr.createdAt,
        });

        // Resolve labels by name, fall back to id mapping
        for (const labelName of addr.labelNames) {
          // Find label by name in imported labels
          const matchingLabel = data.labels.find((l) => l.name === labelName);
          if (matchingLabel) {
            const mappedId = labelIdMap.get(matchingLabel.id);
            if (mappedId !== undefined) {
              await db.addressLabels.add({
                addressId: newAddressId as number,
                labelId: mappedId,
              });
            }
          }
        }
      }
    }
  });
}
