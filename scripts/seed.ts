import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { businesses, categories } from "../src/lib/db/schema";

const TEST_EMAIL = "test@budgetos.app";
const TEST_PASSWORD = "Test123!";
const TEST_COMPANY = "Demo Company";

const defaultCategories = [
  { name: "Office Supplies", type: "expense" as const, color: "#ef4444" },
  { name: "Travel", type: "expense" as const, color: "#f97316" },
  { name: "Utilities", type: "expense" as const, color: "#eab308" },
  { name: "Salaries", type: "expense" as const, color: "#84cc16" },
  { name: "Marketing", type: "expense" as const, color: "#06b6d4" },
  { name: "Sales", type: "revenue" as const, color: "#22c55e" },
  { name: "Services", type: "revenue" as const, color: "#3b82f6" },
  { name: "Other Income", type: "revenue" as const, color: "#8b5cf6" },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Check if test account already exists
  const existing = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.ownerEmail, TEST_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Test account (${TEST_EMAIL}) already exists — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  const [business] = await db
    .insert(businesses)
    .values({
      ownerEmail: TEST_EMAIL,
      passwordHash,
      companyName: TEST_COMPANY,
      currency: "USD",
    })
    .returning();

  await db.insert(categories).values(
    defaultCategories.map((cat) => ({
      businessId: business.id,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      isDefault: true,
    }))
  );

  console.log(`Test account created: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
  console.log(`Business ID: ${business.id}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
