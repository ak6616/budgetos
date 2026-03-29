import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, categories } from "@/lib/db/schema";
import { getBusinessIdFromRequest } from "@/lib/auth";
import { eq, and, sql, gte, lt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const dateConditions = [
      eq(transactions.businessId, businessId),
      gte(transactions.transactionDate, startDate),
      lt(transactions.transactionDate, endDate),
    ];

    // Revenue by category
    const revenueByCategory = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        total: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...dateConditions, eq(transactions.type, "revenue")))
      .groupBy(transactions.categoryId, categories.name);

    // Expenses by category
    const expensesByCategory = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        total: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...dateConditions, eq(transactions.type, "expense")))
      .groupBy(transactions.categoryId, categories.name);

    const totalRevenue = revenueByCategory.reduce((sum, r) => sum + Number(r.total), 0);
    const totalExpenses = expensesByCategory.reduce((sum, r) => sum + Number(r.total), 0);

    return NextResponse.json({
      year,
      month,
      revenue: {
        total: totalRevenue,
        byCategory: revenueByCategory,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
      },
      netIncome: totalRevenue - totalExpenses,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Monthly report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
