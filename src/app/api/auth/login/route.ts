import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { verifyPassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.ownerEmail, data.email))
      .limit(1);

    if (!business) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(data.password, business.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const tokenPayload = {
      businessId: business.id,
      email: business.ownerEmail,
    };
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
