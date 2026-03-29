import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { businesses, categories } from "@/lib/db/schema";
import { hashPassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1),
  companyAddress: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().default("USD"),
});

const defaultCategories = [
  { name: "Office Supplies", type: "expense" as const, color: "#ef4444" },
  { name: "Travel", type: "expense" as const, color: "#f97316" },
  { name: "Utilities", type: "expense" as const, color: "#eab308" },
  { name: "Salaries", type: "expense" as const, color: "#84cc16" },
  { name: "Marketing", type: "expense" as const, color: "#06b6d4" },
  { name: "Sales", type: "revenue" as const, color: "#22c55e" },
  { name: "Services", type: "revenue" as const, color: "#3b82f6" },
  { name: "Other Income", type: "revenue" as const, color: "#8b5cf6" },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.ownerEmail, data.email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);

    const [business] = await db
      .insert(businesses)
      .values({
        ownerEmail: data.email,
        passwordHash,
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        taxId: data.taxId,
        currency: data.currency,
      })
      .returning();

    // Create default categories
    await db.insert(categories).values(
      defaultCategories.map((cat) => ({
        businessId: business.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        isDefault: true,
      }))
    );

    const tokenPayload = { businessId: business.id, email: data.email };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return NextResponse.json({
      accessToken,
      refreshToken,
      business: {
        id: business.id,
        email: business.ownerEmail,
        companyName: business.companyName,
        currency: business.currency,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
