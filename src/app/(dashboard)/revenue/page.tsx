"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch, formatCents } from "@/lib/api";
import { FileTextIcon } from "lucide-react";

interface Transaction {
  id: string;
  categoryId: string | null;
  amountCents: number;
  currency: string;
  description: string;
  transactionDate: string;
}

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

export default function RevenuePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [txRes, invRes] = await Promise.all([
        apiFetch<{ data: Transaction[] }>("/transactions?type=revenue&page=1"),
        apiFetch<Invoice[]>("/invoices"),
      ]);
      setTransactions(txRes.data);
      setInvoices(invRes);
    } catch {
      // API may not be ready
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
        <h1 className="text-2xl font-bold">Revenue</h1>
        <div className="h-32 flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Revenue</h1>
        <Button render={<Link href="/invoices/new" />}>
          <FileTextIcon className="h-4 w-4 mr-1" /> New Invoice
        </Button>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="transactions">Revenue Entries</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No invoices yet.{" "}
                  <Link href="/invoices/new" className="text-primary underline">
                    Create one
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No revenue recorded yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-muted-foreground">
                          {tx.transactionDate}
                        </TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          +{formatCents(tx.amountCents, tx.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
