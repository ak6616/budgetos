"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { apiFetch, formatCents, downloadFile } from "@/lib/api";
import { FileDownIcon, PlusIcon } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalCents: number;
  issueDate: string;
  dueDate: string;
}

const statusColor: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default",
  sent: "secondary",
  draft: "secondary",
  overdue: "destructive",
  cancelled: "destructive",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function handleDownload(inv: Invoice) {
    setLoadError(null);
    try {
      await downloadFile(
        `/invoices/${inv.id}/pdf`,
        `invoice-${inv.invoiceNumber}.pdf`
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to download PDF");
    }
  }

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Invoice[]>("/invoices");
      setInvoices(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <div className="h-32 flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button render={<Link href="/invoices/new" />}>
          <PlusIcon className="h-4 w-4 mr-1" /> New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No invoices yet.{" "}
              <Link href="/invoices/new" className="text-primary underline">
                Create your first invoice
              </Link>
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-medium">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>{inv.issueDate}</TableCell>
                    <TableCell>{inv.dueDate}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor[inv.status] || "secondary"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCents(inv.totalCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Download PDF"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(inv);
                        }}
                      >
                        <FileDownIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
