import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { requireBusinessId } from "@/lib/api-auth";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = await requireBusinessId(req);
    const { id } = await params;

    const [deleted] = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.businessId, businessId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
