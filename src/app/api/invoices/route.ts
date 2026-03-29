import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { invoices, invoiceItems } from "@/lib/db/schema";
import { getBusinessIdFromRequest } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPriceCents: z.number().int().positive(),
  sortOrder: z.number().int().default(0),
});

const createSchema = z.object({
  clientId: z.string().uuid(),
  invoiceNumber: z.string().min(1),
  issueDate: z.string(),
  dueDate: z.string(),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const conditions = [eq(invoices.businessId, businessId)];
    if (status) conditions.push(eq(invoices.status, status));

    const rows = await db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("List invoices error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const body = await req.json();
    const data = createSchema.parse(body);

    const subtotalCents = data.items.reduce(
      (sum, item) => sum + Math.round(item.quantity * item.unitPriceCents),
      0
    );
    const taxCents = Math.round(subtotalCents * data.taxRate / 100);
    const totalCents = subtotalCents + taxCents;

    const [invoice] = await db
      .insert(invoices)
      .values({
        businessId,
        clientId: data.clientId,
        invoiceNumber: data.invoiceNumber,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        taxRate: String(data.taxRate),
        notes: data.notes,
        subtotalCents,
        taxCents,
        totalCents,
      })
      .returning();

    const items = await db
      .insert(invoiceItems)
      .values(
        data.items.map((item) => ({
          invoiceId: invoice.id,
          description: item.description,
          quantity: String(item.quantity),
          unitPriceCents: item.unitPriceCents,
          totalCents: Math.round(item.quantity * item.unitPriceCents),
          sortOrder: item.sortOrder,
        }))
      )
      .returning();

    return NextResponse.json({ ...invoice, items }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
