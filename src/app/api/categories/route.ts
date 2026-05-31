import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { requireBusinessId } from "@/lib/api-auth";
import { eq, and } from "drizzle-orm";

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["expense", "revenue"]),
  color: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const businessId = await requireBusinessId(req);
    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    const conditions = [eq(categories.businessId, businessId)];
    if (type) conditions.push(eq(categories.type, type));

    const rows = await db
      .select()
      .from(categories)
      .where(and(...conditions));

    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("List categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const businessId = await requireBusinessId(req);
    const body = await req.json();
    const data = createSchema.parse(body);

    const [category] = await db
      .insert(categories)
      .values({ ...data, businessId })
      .returning();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
