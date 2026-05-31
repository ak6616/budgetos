import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { requireBusinessId } from "@/lib/api-auth";
import { eq } from "drizzle-orm";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const businessId = await requireBusinessId(req);
    const rows = await db
      .select()
      .from(clients)
      .where(eq(clients.businessId, businessId));
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("List clients error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const businessId = await requireBusinessId(req);
    const body = await req.json();
    const data = createSchema.parse(body);

    const [client] = await db
      .insert(clients)
      .values({ ...data, businessId })
      .returning();

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
