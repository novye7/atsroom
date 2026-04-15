import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── Accounts (container for primary + alias emails) ───

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  addresses: many(addresses),
}));

// ─── Addresses (individual email addresses) ───

export const addresses = sqliteTable("addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  account: one(accounts, { fields: [addresses.accountId], references: [accounts.id] }),
  addressLabels: many(addressLabels),
}));

// ─── Labels (unified tagging system) ───

export const labels = sqliteTable("labels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const labelsRelations = relations(labels, ({ many }) => ({
  addressLabels: many(addressLabels),
}));

// ─── Address-Label junction ───

export const addressLabels = sqliteTable("address_labels", {
  addressId: integer("address_id").notNull().references(() => addresses.id, { onDelete: "cascade" }),
  labelId: integer("label_id").notNull().references(() => labels.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.addressId, table.labelId] }),
]);

export const addressLabelsRelations = relations(addressLabels, ({ one }) => ({
  address: one(addresses, { fields: [addressLabels.addressId], references: [addresses.id] }),
  label: one(labels, { fields: [addressLabels.labelId], references: [labels.id] }),
}));
