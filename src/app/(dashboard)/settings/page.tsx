"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { PlusIcon, TrashIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  isDefault: boolean;
}

interface Client {
  id: string;
  name: string;
  email: string;
  address: string | null;
  taxId: string | null;
}

export default function SettingsPage() {
  const { business } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [catForm, setCatForm] = useState({
    name: "",
    type: "expense",
    color: "#6366f1",
  });
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    address: "",
    taxId: "",
  });

  const loadData = useCallback(async () => {
    try {
      const [cats, cls] = await Promise.all([
        apiFetch<Category[]>("/categories"),
        apiFetch<Client[]>("/clients"),
      ]);
      setCategories(cats);
      setClients(cls);
    } catch {
      // API may not be ready
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch("/categories", {
      method: "POST",
      body: JSON.stringify({
        name: catForm.name,
        type: catForm.type,
        color: catForm.color,
      }),
    });
    setCatDialogOpen(false);
    setCatForm({ name: "", type: "expense", color: "#6366f1" });
    loadData();
  }

  async function handleDeleteCategory(id: string) {
    await apiFetch(`/categories/${id}`, { method: "DELETE" });
    loadData();
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch("/clients", {
      method: "POST",
      body: JSON.stringify({
        name: clientForm.name,
        email: clientForm.email,
        address: clientForm.address || undefined,
        taxId: clientForm.taxId || undefined,
      }),
    });
    setClientDialogOpen(false);
    setClientForm({ name: "", email: "", address: "", taxId: "" });
    loadData();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>
            Your registered business information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground text-xs">
                Company Name
              </Label>
              <p className="font-medium">{business?.companyName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="font-medium">{business?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Currency</Label>
              <p className="font-medium">{business?.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expense & Revenue Categories</CardTitle>
              <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                <DialogTrigger render={<Button size="sm" />}>
                  <PlusIcon className="h-4 w-4 mr-1" /> Add Category
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Category</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddCategory} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="catName">Name</Label>
                      <Input
                        id="catName"
                        required
                        value={catForm.name}
                        onChange={(e) =>
                          setCatForm((f) => ({ ...f, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="catType">Type</Label>
                      <Select
                        value={catForm.type}
                        onValueChange={(v) =>
                          setCatForm((f) => ({ ...f, type: v ?? "expense" }))
                        }
                      >
                        <SelectTrigger id="catType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="revenue">Revenue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="catColor">Color</Label>
                      <Input
                        id="catColor"
                        type="color"
                        value={catForm.color}
                        onChange={(e) =>
                          setCatForm((f) => ({ ...f, color: e.target.value }))
                        }
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Create Category
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No categories yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">
                          {cat.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{cat.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {cat.color && (
                            <div
                              className="h-4 w-4 rounded-full border"
                              style={{ backgroundColor: cat.color }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(cat.id)}
                            aria-label="Delete category"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Clients</CardTitle>
              <Dialog
                open={clientDialogOpen}
                onOpenChange={setClientDialogOpen}
              >
                <DialogTrigger render={<Button size="sm" />}>
                  <PlusIcon className="h-4 w-4 mr-1" /> Add Client
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Client</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddClient} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Name</Label>
                      <Input
                        id="clientName"
                        required
                        value={clientForm.name}
                        onChange={(e) =>
                          setClientForm((f) => ({
                            ...f,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        required
                        value={clientForm.email}
                        onChange={(e) =>
                          setClientForm((f) => ({
                            ...f,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientAddress">Address (optional)</Label>
                      <Input
                        id="clientAddress"
                        value={clientForm.address}
                        onChange={(e) =>
                          setClientForm((f) => ({
                            ...f,
                            address: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientTaxId">Tax ID (optional)</Label>
                      <Input
                        id="clientTaxId"
                        value={clientForm.taxId}
                        onChange={(e) =>
                          setClientForm((f) => ({
                            ...f,
                            taxId: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Create Client
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No clients yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.address || "—"}
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
