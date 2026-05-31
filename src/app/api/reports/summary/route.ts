import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, categories } from "@/lib/db/schema";
import { requireBusinessId } from "@/lib/api-auth";
import { eq, and, sql, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const businessId = await requireBusinessId(req);
    const year = new Date().getFullYear();
    const startDate = `${year}-01-01`;

    const conditions = [
      eq(transactions.businessId, businessId),
      gte(transactions.transactionDate, startDate),
    ];

    const summary = await db
      .select({
        type: transactions.type,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        total: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(transactions.type, transactions.categoryId, categories.name);

    const revenue = summary.filter((s) => s.type === "revenue");
    const expenses = summary.filter((s) => s.type === "expense");
    const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.total), 0);
    const totalExpenses = expenses.reduce((sum, r) => sum + Number(r.total), 0);

    return NextResponse.json({
      year,
      ytdRevenue: totalRevenue,
      ytdExpenses: totalExpenses,
      ytdNetIncome: totalRevenue - totalExpenses,
      revenueByCategory: revenue,
      expensesByCategory: expenses,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Summary report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
