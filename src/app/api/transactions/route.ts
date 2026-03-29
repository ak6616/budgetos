import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { getBusinessIdFromRequest } from "@/lib/auth";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

const createSchema = z.object({
  categoryId: z.string().uuid().optional(),
  type: z.enum(["expense", "revenue"]),
  amountCents: z.number().int().positive(),
  currency: z.string().default("USD"),
  description: z.string().min(1),
  notes: z.string().optional(),
  transactionDate: z.string(), // YYYY-MM-DD
  receiptUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const categoryId = url.searchParams.get("categoryId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 50;
    const offset = (page - 1) * limit;

    const conditions = [eq(transactions.businessId, businessId)];
    if (type) conditions.push(eq(transactions.type, type));
    if (from) conditions.push(gte(transactions.transactionDate, from));
    if (to) conditions.push(lte(transactions.transactionDate, to));
    if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));

    const rows = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.transactionDate))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(...conditions));

    return NextResponse.json({
      data: rows,
      pagination: { page, limit, total: Number(count) },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("List transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const body = await req.json();
    const data = createSchema.parse(body);

    const [transaction] = await db
      .insert(transactions)
      .values({ ...data, businessId })
      .returning();

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
