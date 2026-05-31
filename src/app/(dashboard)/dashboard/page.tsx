"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { apiFetch, formatCents } from "@/lib/api";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from "lucide-react";

interface SummaryData {
  year: number;
  ytdRevenue: number;
  ytdExpenses: number;
  ytdNetIncome: number;
  revenueByCategory: { categoryName: string; total: number }[];
  expensesByCategory: { categoryName: string; total: number }[];
}

interface Transaction {
  id: string;
  type: string;
  amountCents: number;
  description: string;
  transactionDate: string;
  currency: string;
}

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<
    { month: string; revenue: number; expenses: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [summaryRes, txRes] = await Promise.all([
          apiFetch<SummaryData>("/reports/summary"),
          apiFetch<{ data: Transaction[] }>("/transactions?page=1"),
        ]);
        setSummary(summaryRes);
        setTransactions(txRes.data.slice(0, 10));

        const now = new Date();
        const months: { month: string; revenue: number; expenses: number }[] =
          [];
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const promises = [];
        for (let m = 0; m < Math.min(now.getMonth() + 1, 6); m++) {
          const month = now.getMonth() - m;
          const year = now.getFullYear();
          promises.push(
            apiFetch<{ revenue: { total: number }; expenses: { total: number } }>(
              `/reports/monthly?year=${year}&month=${month + 1}`
            ).then((r) => ({
              idx: m,
              month: monthNames[month],
              revenue: r.revenue.total / 100,
              expenses: r.expenses.total / 100,
            }))
          );
        }
        const results = await Promise.all(promises);
        results.sort((a, b) => b.idx - a.idx);
        for (const r of results) months.push(r);
        setMonthlyData(months);
        setLoadError(null);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {loadError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ArrowUpIcon className="h-3.5 w-3.5 text-green-600" />
              Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCents(summary?.ytdRevenue ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ArrowDownIcon className="h-3.5 w-3.5 text-red-600" />
              Total Expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCents(summary?.ytdExpenses ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUpIcon className="h-3.5 w-3.5" />
              Net Income
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCents(summary?.ytdNetIncome ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link
            href="/expenses"
            className="text-sm text-primary underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No transactions yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
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
                    <TableCell>
                      <Badge
                        variant={
                          tx.type === "revenue" ? "default" : "secondary"
                        }
                      >
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === "revenue"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.type === "revenue" ? "+" : "-"}
                      {formatCents(tx.amountCents, tx.currency)}
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
