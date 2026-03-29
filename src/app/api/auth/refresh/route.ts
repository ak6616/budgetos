import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken, signAccessToken, signRefreshToken } from "@/lib/auth";

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = refreshSchema.parse(body);

    const payload = verifyToken(refreshToken);
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
