import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
import {
  businesses,
  categories,
  transactions,
  clients,
  invoices,
  invoiceItems,
} from "../src/lib/db/schema";

const TEST_EMAIL = "test@budgetos.app";

// --- przykładowe wydatki (kategoria po nazwie) ---
const SAMPLE_EXPENSES = [
  { date: "2026-01-12", category: "Office Supplies", description: "Printer paper & toner", amountCents: 8450 },
  { date: "2026-01-23", category: "Travel", description: "Train tickets — client visit", amountCents: 15600 },
  { date: "2026-02-03", category: "Utilities", description: "Electricity — January", amountCents: 31240 },
  { date: "2026-02-15", category: "Salaries", description: "Contractor — UI designer", amountCents: 240000 },
  { date: "2026-02-27", category: "Marketing", description: "Google Ads", amountCents: 65000 },
  { date: "2026-03-08", category: "Office Supplies", description: "Standing desk", amountCents: 42999 },
  { date: "2026-03-19", category: "Utilities", description: "Internet & phone", amountCents: 8999 },
  { date: "2026-04-02", category: "Travel", description: "Hotel — SaaS conference", amountCents: 54000 },
  { date: "2026-04-21", category: "Marketing", description: "LinkedIn campaign", amountCents: 30000 },
  { date: "2026-05-09", category: "Salaries", description: "Freelance developer", amountCents: 320000 },
];

// --- przykładowe przychody ---
const SAMPLE_REVENUES = [
  { date: "2026-01-15", category: "Sales", description: "Product license — Acme Corp", amountCents: 120000 },
  { date: "2026-01-29", category: "Services", description: "Consulting — 10h", amountCents: 150000 },
  { date: "2026-02-10", category: "Sales", description: "Annual subscription — Globex", amountCents: 480000 },
  { date: "2026-02-22", category: "Services", description: "Website maintenance", amountCents: 45000 },
  { date: "2026-03-05", category: "Other Income", description: "Affiliate commission", amountCents: 21550 },
  { date: "2026-03-17", category: "Sales", description: "Product license — Initech", amountCents: 99000 },
  { date: "2026-04-01", category: "Services", description: "Training workshop", amountCents: 200000 },
  { date: "2026-04-18", category: "Sales", description: "Add-on purchase — Umbrella", amountCents: 35000 },
  { date: "2026-05-06", category: "Other Income", description: "Interest income", amountCents: 4230 },
  { date: "2026-05-20", category: "Services", description: "Custom integration — Stark", amountCents: 360000 },
];

// --- klienci dla faktur ---
const SAMPLE_CLIENTS = [
  { key: "acme", name: "Acme Corporation", email: "billing@acme.example", address: "123 Market St, San Francisco, CA", taxId: "US-ACME-01" },
  { key: "globex", name: "Globex Inc", email: "ap@globex.example", address: "500 Globex Plaza, New York, NY", taxId: null },
  { key: "initech", name: "Initech LLC", email: "finance@initech.example", address: "1 Initech Way, Austin, TX", taxId: null },
  { key: "umbrella", name: "Umbrella Co", email: "accounts@umbrella.example", address: "77 Raccoon Ave, Raccoon City", taxId: null },
  { key: "stark", name: "Stark Industries", email: "billing@stark.example", address: "10880 Malibu Point, Malibu, CA", taxId: "US-STARK-01" },
];

// --- faktury (items: qty × unitPriceCents) ---
const SAMPLE_INVOICES = [
  { number: "INV-2026-1001", client: "acme", issue: "2026-01-18", due: "2026-02-01", taxRate: "8.00", status: "paid",
    items: [{ description: "Pro plan — annual license", quantity: "1", unitPriceCents: 120000 }, { description: "Onboarding session", quantity: "2", unitPriceCents: 25000 }] },
  { number: "INV-2026-1002", client: "globex", issue: "2026-02-02", due: "2026-03-04", taxRate: "0.00", status: "paid",
    items: [{ description: "Enterprise subscription", quantity: "1", unitPriceCents: 480000 }] },
  { number: "INV-2026-1003", client: "initech", issue: "2026-02-14", due: "2026-02-28", taxRate: "10.00", status: "sent",
    items: [{ description: "Consulting (hours)", quantity: "12", unitPriceCents: 12500 }] },
  { number: "INV-2026-1004", client: "umbrella", issue: "2026-02-25", due: "2026-03-11", taxRate: "23.00", status: "draft",
    items: [{ description: "Security audit", quantity: "1", unitPriceCents: 300000 }, { description: "Report write-up", quantity: "1", unitPriceCents: 50000 }] },
  { number: "INV-2026-1005", client: "stark", issue: "2026-03-06", due: "2026-04-05", taxRate: "8.00", status: "paid",
    items: [{ description: "Custom integration", quantity: "1", unitPriceCents: 360000 }] },
  { number: "INV-2026-1006", client: "acme", issue: "2026-03-20", due: "2026-04-03", taxRate: "8.00", status: "sent",
    items: [{ description: "Additional seats", quantity: "10", unitPriceCents: 1500 }] },
  { number: "INV-2026-1007", client: "globex", issue: "2026-04-03", due: "2026-05-03", taxRate: "0.00", status: "paid",
    items: [{ description: "Renewal — annual", quantity: "1", unitPriceCents: 480000 }, { description: "Premium support", quantity: "1", unitPriceCents: 60000 }] },
  { number: "INV-2026-1008", client: "initech", issue: "2026-04-22", due: "2026-05-06", taxRate: "10.00", status: "draft",
    items: [{ description: "Website maintenance (Q2)", quantity: "3", unitPriceCents: 15000 }] },
  { number: "INV-2026-1009", client: "umbrella", issue: "2026-05-08", due: "2026-05-22", taxRate: "23.00", status: "sent",
    items: [{ description: "Training workshop", quantity: "1", unitPriceCents: 200000 }] },
  { number: "INV-2026-1010", client: "stark", issue: "2026-05-21", due: "2026-06-20", taxRate: "8.00", status: "draft",
    items: [{ description: "Discovery & scoping", quantity: "8", unitPriceCents: 18000 }, { description: "Prototype", quantity: "1", unitPriceCents: 150000 }] },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerEmail, TEST_EMAIL))
    .limit(1);

  if (!business) {
    console.error(`Test account (${TEST_EMAIL}) not found. Run "npm run db:seed" first.`);
    process.exit(1);
  }
  const businessId = business.id;

  // Idempotency guard — jeśli pierwsza przykładowa faktura już istnieje, nie duplikuj.
  const existingInvoice = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.businessId, businessId), eq(invoices.invoiceNumber, "INV-2026-1001")))
    .limit(1);
  if (existingInvoice.length > 0) {
    console.log("Sample data already seeded (INV-2026-1001 exists) — skipping to avoid duplicates.");
    return;
  }

  // Mapa kategorii po nazwie
  const cats = await db.select().from(categories).where(eq(categories.businessId, businessId));
  const catId = (name: string) => cats.find((c) => c.name === name)?.id ?? null;

  // 1) Wydatki + przychody
  const txRows = [
    ...SAMPLE_EXPENSES.map((e) => ({
      businessId,
      categoryId: catId(e.category),
      type: "expense",
      amountCents: e.amountCents,
      currency: business.currency,
      description: e.description,
      transactionDate: e.date,
    })),
    ...SAMPLE_REVENUES.map((r) => ({
      businessId,
      categoryId: catId(r.category),
      type: "revenue",
      amountCents: r.amountCents,
      currency: business.currency,
      description: r.description,
      transactionDate: r.date,
    })),
  ];
  await db.insert(transactions).values(txRows);
  console.log(`Inserted ${SAMPLE_EXPENSES.length} expenses + ${SAMPLE_REVENUES.length} revenues.`);

  // 2) Klienci
  const insertedClients = await db
    .insert(clients)
    .values(
      SAMPLE_CLIENTS.map((c) => ({
        businessId,
        name: c.name,
        email: c.email,
        address: c.address,
        taxId: c.taxId,
      }))
    )
    .returning();
  const clientId = (key: string) => {
    const name = SAMPLE_CLIENTS.find((c) => c.key === key)!.name;
    return insertedClients.find((c) => c.name === name)!.id;
  };
  console.log(`Inserted ${insertedClients.length} clients.`);

  // 3) Faktury + pozycje (sumy liczone jak w API)
  for (const inv of SAMPLE_INVOICES) {
    const subtotalCents = inv.items.reduce(
      (sum, it) => sum + Math.round(parseFloat(it.quantity) * it.unitPriceCents),
      0
    );
    const taxCents = Math.round((subtotalCents * parseFloat(inv.taxRate)) / 100);
    const totalCents = subtotalCents + taxCents;

    const [createdInvoice] = await db
      .insert(invoices)
      .values({
        businessId,
        clientId: clientId(inv.client),
        invoiceNumber: inv.number,
        status: inv.status,
        issueDate: inv.issue,
        dueDate: inv.due,
        subtotalCents,
        taxRate: inv.taxRate,
        taxCents,
        totalCents,
      })
      .returning();

    await db.insert(invoiceItems).values(
      inv.items.map((it, i) => ({
        invoiceId: createdInvoice.id,
        description: it.description,
        quantity: it.quantity,
        unitPriceCents: it.unitPriceCents,
        totalCents: Math.round(parseFloat(it.quantity) * it.unitPriceCents),
        sortOrder: i,
      }))
    );
  }
  console.log(`Inserted ${SAMPLE_INVOICES.length} invoices with line items.`);
  console.log("Sample data seeding complete.");
}

main().catch((err) => {
  console.error("Sample data seed failed:", err);
  process.exit(1);
});
