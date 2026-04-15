import Dexie, { type EntityTable } from "dexie";

interface DbAccount {
  id?: number;
  sortOrder: number;
  createdAt: string;
}

interface DbAddress {
  id?: number;
  accountId: number;
  email: string;
  isPrimary: boolean;
  createdAt: string;
}

interface DbLabel {
  id?: number;
  name: string;
  sortOrder: number;
  createdAt: string;
}

interface DbAddressLabel {
  addressId: number;
  labelId: number;
}

class HowManyAtDB extends Dexie {
  accounts!: EntityTable<DbAccount, "id">;
  addresses!: EntityTable<DbAddress, "id">;
  labels!: EntityTable<DbLabel, "id">;
  addressLabels!: EntityTable<DbAddressLabel, never>;

  constructor() {
    super("howmanyat");
    this.version(1).stores({
      accounts: "++id, sortOrder",
      addresses: "++id, accountId, email, isPrimary",
      labels: "++id, name, sortOrder",
      addressLabels: "[addressId+labelId], addressId, labelId",
    });
  }
}

export const db = new HowManyAtDB();
export { useLiveQuery } from "dexie-react-hooks";
