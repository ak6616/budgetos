import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { verifyToken, signAccessToken, signRefreshToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = refreshSchema.parse(body);

    const payload = verifyToken(refreshToken);

    // Sesja musi wskazywać na nadal istniejące konto. Bez tego token z usuniętego
    // (np. odtworzonego) konta byłby w nieskończoność re-podpisywany i celował w martwy businessId.
    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.id, payload.businessId))
      .limit(1);

    if (!business) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const tokenPayload = {
      businessId: payload.businessId,
      email: payload.email,
    };

    return NextResponse.json({
      accessToken: signAccessToken(tokenPayload),
      refreshToken: signRefreshToken(tokenPayload),
    });
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
