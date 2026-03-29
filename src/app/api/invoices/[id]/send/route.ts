import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { getBusinessIdFromRequest } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(
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

    if (invoice.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft invoices can be sent" },
        { status: 400 }
      );
    }

    // Update status to sent
    const [updated] = await db
      .update(invoices)
      .set({ status: "sent", updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();

    return NextResponse.json({
      ...updated,
      message: "Invoice marked as sent. Email delivery requires SMTP configuration.",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Send invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
