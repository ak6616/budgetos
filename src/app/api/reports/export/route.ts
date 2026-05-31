import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, categories } from "@/lib/db/schema";
import { requireBusinessId } from "@/lib/api-auth";
import { eq, and, gte, lt, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const businessId = await requireBusinessId(req);
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));
    const format = url.searchParams.get("format") || "csv";

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const rows = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amountCents: transactions.amountCents,
        currency: transactions.currency,
        description: transactions.description,
        transactionDate: transactions.transactionDate,
        categoryName: categories.name,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.businessId, businessId),
          gte(transactions.transactionDate, startDate),
          lt(transactions.transactionDate, endDate)
        )
      )
      .orderBy(desc(transactions.transactionDate));

    if (format === "csv") {
      const header = "Date,Type,Category,Description,Amount,Currency";
      const csvRows = rows.map(
        (r) =>
          `${r.transactionDate},${r.type},${r.categoryName || "Uncategorized"},"${r.description.replace(/"/g, '""')}",${(r.amountCents / 100).toFixed(2)},${r.currency}`
      );
      const csv = [header, ...csvRows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="report-${year}-${month}.csv"`,
        },
      });
    }

    // JSON export fallback
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Export report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
