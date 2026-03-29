import {
  pgTable,
  uuid,
  text,
  boolean,
  bigint,
  numeric,
  integer,
  date,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerEmail: text("owner_email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  companyName: text("company_name").notNull(),
  companyAddress: text("company_address"),
  taxId: text("tax_id"),
  currency: text("currency").notNull().default("USD"),
  stripeAccountId: text("stripe_account_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(), // 'expense' | 'revenue'
    color: text("color"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("categories_business_name_type_idx").on(
      table.businessId,
      table.name,
      table.type
    ),
  ]
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id),
    categoryId: uuid("category_id").references(() => categories.id),
    type: text("type").notNull(), // 'expense' | 'revenue'
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("USD"),
    description: text("description").notNull(),
    notes: text("notes"),
    transactionDate: date("transaction_date").notNull(),
    receiptUrl: text("receipt_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_transactions_business").on(table.businessId),
    index("idx_transactions_date").on(table.businessId, table.transactionDate),
    index("idx_transactions_type").on(table.businessId, table.type),
  ]
);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  address: text("address"),
  taxId: text("tax_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    invoiceNumber: text("invoice_number").notNull(),
    status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    subtotalCents: bigint("subtotal_cents", { mode: "number" })
      .notNull()
      .default(0),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    taxCents: bigint("tax_cents", { mode: "number" }).notNull().default(0),
    totalCents: bigint("total_cents", { mode: "number" }).notNull().default(0),
    notes: text("notes"),
    stripePaymentIntent: text("stripe_payment_intent"),
    pdfUrl: text("pdf_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("invoices_business_number_idx").on(
      table.businessId,
      table.invoiceNumber
    ),
    index("idx_invoices_business").on(table.businessId),
    index("idx_invoices_status").on(table.businessId, table.status),
  ]
);

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPriceCents: bigint("unit_price_cents", { mode: "number" }).notNull(),
  totalCents: bigint("total_cents", { mode: "number" }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});
