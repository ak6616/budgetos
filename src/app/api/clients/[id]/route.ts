import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { getBusinessIdFromRequest } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = getBusinessIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const [updated] = await db
      .update(clients)
      .set(data)
      .where(and(eq(clients.id, id), eq(clients.businessId, businessId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
