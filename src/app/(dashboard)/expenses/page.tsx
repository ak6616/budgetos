"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, formatCents, parseCents } from "@/lib/api";
import { PlusIcon, TrashIcon, PencilIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
}

interface Transaction {
  id: string;
  categoryId: string | null;
  type: string;
  amountCents: number;
  currency: string;
  description: string;
  notes: string | null;
  transactionDate: string;
}

export default function ExpensesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [form, setForm] = useState({
    amount: "",
    description: "",
    notes: "",
    categoryId: "",
    transactionDate: new Date().toISOString().split("T")[0],
  });

  const load = useCallback(async () => {
    try {
      const [txRes, catRes] = await Promise.all([
        apiFetch<{ data: Transaction[]; pagination: { total: number } }>(
          `/transactions?type=expense&page=${page}`
        ),
        apiFetch<Category[]>("/categories?type=expense"),
      ]);
      setTransactions(txRes.data);
      setTotal(txRes.pagination.total);
      setCategories(catRes);
    } catch {
      // API may not be ready
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm({
      amount: "",
      description: "",
      notes: "",
      categoryId: "",
      transactionDate: new Date().toISOString().split("T")[0],
    });
    setEditingTx(null);
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx);
    setForm({
      amount: (tx.amountCents / 100).toFixed(2),
      description: tx.description,
      notes: tx.notes || "",
      categoryId: tx.categoryId || "",
      transactionDate: tx.transactionDate,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      type: "expense" as const,
      amountCents: parseCents(form.amount),
      description: form.description,
      notes: form.notes || undefined,
      categoryId: form.categoryId || undefined,
      transactionDate: form.transactionDate,
    };
    if (editingTx) {
      await apiFetch(`/transactions/${editingTx.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    } else {
      await apiFetch("/transactions", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
    setDialogOpen(false);
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    await apiFetch(`/transactions/${id}`, { method: "DELETE" });
    load();
  }

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger render={<Button />}>
            <PlusIcon className="h-4 w-4 mr-1" /> Add Expense
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTx ? "Edit Expense" : "New Expense"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, categoryId: v ?? "" }))
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={form.transactionDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      transactionDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                {editingTx ? "Update" : "Add"} Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Loading...
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No expenses recorded yet.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground">
                        {tx.transactionDate}
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell>
                        {tx.categoryId && categoryMap[tx.categoryId] ? (
                          <Badge
                            variant="secondary"
                            style={{
                              borderColor:
                                categoryMap[tx.categoryId].color || undefined,
                            }}
                          >
                            {categoryMap[tx.categoryId].name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        -{formatCents(tx.amountCents, tx.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(tx)}
                            aria-label="Edit"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(tx.id)}
                            aria-label="Delete"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {total > 50 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * 50 >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
