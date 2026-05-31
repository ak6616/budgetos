"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, downloadFile, formatCents } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeftIcon, DownloadIcon, SendIcon, LinkIcon } from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  unitPriceCents: number;
  totalCents: number;
}

interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotalCents: number;
  taxRate: string;
  taxCents: number;
  totalCents: number;
  notes: string | null;
  items: InvoiceItem[];
}

interface Client {
  id: string;
  name: string;
  email: string;
  address: string | null;
}

const statusColor: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default",
  sent: "secondary",
  draft: "secondary",
  overdue: "destructive",
  cancelled: "destructive",
};

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { business } = useAuth();
  const currency = business?.currency || "USD";

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const inv = await apiFetch<Invoice>(`/invoices/${id}`);
      setInvoice(inv);
      try {
        const clients = await apiFetch<Client[]>("/clients");
        setClient(clients.find((c) => c.id === inv.clientId) || null);
      } catch {
        // nazwa klienta nie jest krytyczna
      }
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("not found")) {
        setNotFound(true);
      } else {
        setActionError(err instanceof Error ? err.message : "Failed to load invoice");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDownload() {
    setActionError(null);
    setActionMsg(null);
    setBusy(true);
    try {
      await downloadFile(
        `/invoices/${id}/pdf`,
        `invoice-${invoice?.invoiceNumber || id}.pdf`
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkSent() {
    setActionError(null);
    setActionMsg(null);
    setBusy(true);
    try {
      await apiFetch(`/invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "sent" }),
      });
      setActionMsg("Invoice marked as sent.");
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update invoice");
    } finally {
      setBusy(false);
    }
  }

  async function handlePaymentLink() {
    setActionError(null);
    setActionMsg(null);
    setBusy(true);
    try {
      const res = await apiFetch<{ paymentIntentId: string }>(
        `/invoices/${id}/payment-link`,
        { method: "POST" }
      );
      setActionMsg(`Payment link ready (PaymentIntent ${res.paymentIntentId}).`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to create payment link"
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" render={<Link href="/invoices" />} aria-label="Back">
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" render={<Link href="/invoices" />} aria-label="Back">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
          <Badge variant={statusColor[invoice.status] || "secondary"}>
            {invoice.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          {invoice.status === "draft" && (
            <Button variant="outline" onClick={handleMarkSent} disabled={busy}>
              <SendIcon className="h-4 w-4 mr-1" /> Mark Sent
            </Button>
          )}
          <Button variant="outline" onClick={handlePaymentLink} disabled={busy}>
            <LinkIcon className="h-4 w-4 mr-1" /> Payment Link
          </Button>
          <Button onClick={handleDownload} disabled={busy}>
            <DownloadIcon className="h-4 w-4 mr-1" /> Download PDF
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {actionMsg && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {actionMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bill To</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p className="font-medium">{client?.name || "—"}</p>
          {client?.email && <p className="text-muted-foreground">{client.email}</p>}
          {client?.address && <p className="text-muted-foreground">{client.address}</p>}
          <div className="flex gap-8 pt-3 text-muted-foreground">
            <span>Issue: {invoice.issueDate}</span>
            <span>Due: {invoice.dueDate}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.description}</TableCell>
                  <TableCell className="text-right">{it.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCents(it.unitPriceCents, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCents(it.totalCents, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCents(invoice.subtotalCents, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
              <span>{formatCents(invoice.taxCents, currency)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-1">
              <span>Total</span>
              <span>{formatCents(invoice.totalCents, currency)}</span>
            </div>
          </div>
          {invoice.notes && (
            <div className="mt-4 text-sm">
              <p className="text-xs uppercase text-muted-foreground mb-1">Notes</p>
              <p>{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
