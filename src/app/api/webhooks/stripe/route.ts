import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, transactions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = paymentIntent.metadata.invoiceId;

      if (invoiceId) {
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, invoiceId));

        if (invoice && invoice.status !== "paid") {
          await db
            .update(invoices)
            .set({ status: "paid", updatedAt: new Date() })
            .where(eq(invoices.id, invoiceId));

          // Auto-record revenue transaction
          await db.insert(transactions).values({
            businessId: invoice.businessId,
            type: "revenue",
            amountCents: invoice.totalCents,
            currency: "USD",
            description: `Payment for invoice #${invoice.invoiceNumber}`,
            transactionDate: new Date().toISOString().split("T")[0],
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
