// ─── Base Entity Types (framework-agnostic) ───

export interface Account {
  id: number;
  sortOrder: number;
  createdAt: string;
}

export interface Address {
  id: number;
  accountId: number;
  email: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface Label {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface AddressLabel {
  addressId: number;
  labelId: number;
}

// ─── Composite Types ───

export type LabelSimple = Pick<Label, "id" | "name">;

export type AddressWithLabels = Address & {
  labels: LabelSimple[];
};

export type AccountWithDetails = Account & {
  addresses: AddressWithLabels[];
};

// ─── Domain-Aggregated View ───

export interface DomainGroup {
  domain: string;
  accounts: AccountWithDetails[];
}

// ─── Export/Import ───

export interface ExportData {
  version: 1;
  exportedAt: string;
  accounts: Array<{
    id: number;
    sortOrder: number;
    createdAt: string;
    addresses: Array<{
      id: number;
      email: string;
      isPrimary: boolean;
      createdAt: string;
      labelNames: string[];
    }>;
  }>;
  labels: Array<{
    id: number;
    name: string;
    sortOrder: number;
    createdAt: string;
  }>;
}
