import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { getBusinessIdFromRequest } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

const updateSchema = z.object({
  categoryId: z.string().uuid().optional(),
  type: z.enum(["expense", "revenue"]).optional(),
  amountCents: z.number().int().positive().optional(),
  description: z.string().min(1).optional(),
  notes: z.string().optional(),
  transactionDate: z.string().optional(),
  receiptUrl: z.string().url().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const [updated] = await db
      .update(transactions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.businessId, businessId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Update transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const { id } = await params;

    const [deleted] = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.businessId, businessId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Delete transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
