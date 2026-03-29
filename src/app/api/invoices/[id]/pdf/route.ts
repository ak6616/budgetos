import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, invoiceItems, businesses, clients } from "@/lib/db/schema";
import { getBusinessIdFromRequest } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1a1a1a" },
  companyInfo: { textAlign: "right", color: "#666" },
  section: { marginBottom: 15 },
  label: { fontSize: 8, color: "#999", marginBottom: 2, textTransform: "uppercase" },
  value: { fontSize: 10, color: "#333" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
    marginBottom: 5,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totals: { marginTop: 15, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 3 },
  totalLabel: { width: 100, textAlign: "right", marginRight: 10 },
  totalValue: { width: 80, textAlign: "right" },
  grandTotal: { fontSize: 14, fontWeight: "bold", marginTop: 5 },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, textAlign: "center", color: "#999", fontSize: 8 },
});

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function InvoicePDF({
  invoice,
  items,
  business,
  client,
}: {
  invoice: typeof invoices.$inferSelect;
  items: (typeof invoiceItems.$inferSelect)[];
  business: typeof businesses.$inferSelect;
  client: typeof clients.$inferSelect;
}) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.title }, "INVOICE"),
          React.createElement(Text, { style: { color: "#666", marginTop: 5 } }, `#${invoice.invoiceNumber}`)
        ),
        React.createElement(
          View,
          { style: styles.companyInfo },
          React.createElement(Text, { style: { fontWeight: "bold" } }, business.companyName),
          business.companyAddress
            ? React.createElement(Text, null, business.companyAddress)
            : null,
          business.taxId
            ? React.createElement(Text, null, `Tax ID: ${business.taxId}`)
            : null
        )
      ),
      React.createElement(
        View,
        { style: { flexDirection: "row", marginBottom: 20 } },
        React.createElement(
          View,
          { style: { flex: 1 } },
          React.createElement(Text, { style: styles.label }, "Bill To"),
          React.createElement(Text, { style: styles.value }, client.name),
          React.createElement(Text, { style: styles.value }, client.email),
          client.address
            ? React.createElement(Text, { style: styles.value }, client.address)
            : null
        ),
        React.createElement(
          View,
          { style: { flex: 1, alignItems: "flex-end" } },
          React.createElement(Text, { style: styles.label }, "Issue Date"),
          React.createElement(Text, { style: styles.value }, invoice.issueDate),
          React.createElement(Text, { style: { ...styles.label, marginTop: 8 } }, "Due Date"),
          React.createElement(Text, { style: styles.value }, invoice.dueDate),
          React.createElement(Text, { style: { ...styles.label, marginTop: 8 } }, "Status"),
          React.createElement(Text, { style: styles.value }, invoice.status.toUpperCase())
        )
      ),
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: styles.colDesc }, "Description"),
        React.createElement(Text, { style: styles.colQty }, "Qty"),
        React.createElement(Text, { style: styles.colPrice }, "Unit Price"),
        React.createElement(Text, { style: styles.colTotal }, "Total")
      ),
      ...items.map((item, i) =>
        React.createElement(
          View,
          { key: i, style: styles.tableRow },
          React.createElement(Text, { style: styles.colDesc }, item.description),
          React.createElement(Text, { style: styles.colQty }, String(item.quantity)),
          React.createElement(Text, { style: styles.colPrice }, formatCents(item.unitPriceCents)),
          React.createElement(Text, { style: styles.colTotal }, formatCents(item.totalCents))
        )
      ),
      React.createElement(
        View,
        { style: styles.totals },
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "Subtotal:"),
          React.createElement(Text, { style: styles.totalValue }, formatCents(invoice.subtotalCents))
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, `Tax (${invoice.taxRate}%):`),
          React.createElement(Text, { style: styles.totalValue }, formatCents(invoice.taxCents))
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: { ...styles.totalLabel, ...styles.grandTotal } }, "Total:"),
          React.createElement(Text, { style: { ...styles.totalValue, ...styles.grandTotal } }, formatCents(invoice.totalCents))
        )
      ),
      invoice.notes
        ? React.createElement(
            View,
            { style: { marginTop: 30 } },
            React.createElement(Text, { style: styles.label }, "Notes"),
            React.createElement(Text, { style: styles.value }, invoice.notes)
          )
        : null,
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, `Generated by BudgetOS | ${business.companyName}`)
      )
    )
  );
}

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

    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId));

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, invoice.clientId));

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDF, { invoice, items, business, client })
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Generate PDF error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
