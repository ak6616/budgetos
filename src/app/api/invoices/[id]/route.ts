import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { invoices, invoiceItems } from "@/lib/db/schema";
import { getBusinessIdFromRequest } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

const updateSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const { id } = await params;

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)));

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    return NextResponse.json({ ...invoice, items });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Get invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Update invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
