"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { apiFetch, formatCents } from "@/lib/api";
import { PlusIcon, TrashIcon, FileDownIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Client {
  id: string;
  name: string;
  email: string;
  address: string | null;
  taxId: string | null;
}

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

export default function InvoiceBuilderPage() {
  const router = useRouter();
  const { business } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    clientId: "",
    invoiceNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    taxRate: "0",
    notes: "",
  });

  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);

  useEffect(() => {
    apiFetch<Client[]>("/clients").then(setClients).catch(() => {});
  }, []);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { description: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof LineItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  const subtotalCents = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + Math.round(qty * price * 100);
  }, 0);

  const taxRate = parseFloat(form.taxRate) || 0;
  const taxCents = Math.round(subtotalCents * (taxRate / 100));
  const totalCents = subtotalCents + taxCents;

  const selectedClient = clients.find((c) => c.id === form.clientId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/invoices", {
        method: "POST",
        body: JSON.stringify({
          clientId: form.clientId,
          invoiceNumber: form.invoiceNumber,
          issueDate: form.issueDate,
          dueDate: form.dueDate,
          taxRate: parseFloat(form.taxRate) || 0,
          notes: form.notes || undefined,
          items: items.map((item, idx) => ({
            description: item.description,
            quantity: parseFloat(item.quantity) || 0,
            unitPriceCents: Math.round(
              (parseFloat(item.unitPrice) || 0) * 100
            ),
            sortOrder: idx,
          })),
        }),
      });
      router.push("/revenue");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Invoice Builder</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice #</Label>
                  <Input
                    id="invoiceNumber"
                    required
                    placeholder="INV-2026-001"
                    value={form.invoiceNumber}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        invoiceNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={form.clientId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, clientId: v ?? "" }))
                    }
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    required
                    value={form.issueDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, issueDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dueDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.taxRate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, taxRate: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <PlusIcon className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      required
                      value={item.description}
                      onChange={(e) =>
                        updateItem(idx, "description", e.target.value)
                      }
                      placeholder="Service or product"
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(idx, "quantity", e.target.value)
                      }
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Unit Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(idx, "unitPrice", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    aria-label="Remove item"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Payment terms, thank-you note, etc."
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Creating..." : "Create Invoice"}
          </Button>
        </form>

        {/* Live Preview */}
        <div className="hidden lg:block">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDownIcon className="h-4 w-4" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-white p-6 text-sm space-y-4 min-h-[500px]">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold text-lg">
                      {business?.companyName || "Your Company"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">INVOICE</p>
                    <p className="text-muted-foreground">
                      {form.invoiceNumber || "INV-XXXX"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground mb-1">Bill To</p>
                    {selectedClient ? (
                      <>
                        <p>{selectedClient.name}</p>
                        <p>{selectedClient.email}</p>
                        {selectedClient.address && (
                          <p>{selectedClient.address}</p>
                        )}
                      </>
                    ) : (
                      <p>Select a client</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p>Issue: {form.issueDate || "—"}</p>
                    <p>Due: {form.dueDate || "—"}</p>
                  </div>
                </div>

                <Separator />

                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 font-medium">Item</th>
                      <th className="text-right py-1 font-medium">Qty</th>
                      <th className="text-right py-1 font-medium">Price</th>
                      <th className="text-right py-1 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const qty = parseFloat(item.quantity) || 0;
                      const price = parseFloat(item.unitPrice) || 0;
                      const lineTotal = qty * price;
                      return (
                        <tr key={idx} className="border-b border-dashed">
                          <td className="py-1">
                            {item.description || "—"}
                          </td>
                          <td className="py-1 text-right">{qty}</td>
                          <td className="py-1 text-right">
                            ${price.toFixed(2)}
                          </td>
                          <td className="py-1 text-right">
                            ${lineTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="flex flex-col items-end gap-1 text-xs">
                  <div className="flex justify-between w-40">
                    <span>Subtotal</span>
                    <span>{formatCents(subtotalCents)}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between w-40">
                      <span>Tax ({taxRate}%)</span>
                      <span>{formatCents(taxCents)}</span>
                    </div>
                  )}
                  <Separator className="w-40" />
                  <div className="flex justify-between w-40 font-bold">
                    <span>Total</span>
                    <span>{formatCents(totalCents)}</span>
                  </div>
                </div>

                {form.notes && (
                  <div className="text-xs text-muted-foreground mt-4">
                    <p className="font-medium text-foreground">Notes</p>
                    <p>{form.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
