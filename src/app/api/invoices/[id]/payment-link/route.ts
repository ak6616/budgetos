import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { getBusinessIdFromRequest } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
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

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
    }

    if (invoice.stripePaymentIntent) {
      const existing = await stripe.paymentIntents.retrieve(
        invoice.stripePaymentIntent
      );
      return NextResponse.json({
        clientSecret: existing.client_secret,
        paymentIntentId: existing.id,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: invoice.totalCents,
      currency: "usd",
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        businessId,
      },
    });

    await db
      .update(invoices)
      .set({ stripePaymentIntent: paymentIntent.id, updatedAt: new Date() })
      .where(eq(invoices.id, id));

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Payment link error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
