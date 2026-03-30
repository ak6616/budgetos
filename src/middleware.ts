import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const ipRequests = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const now = Date.now();
    const entry = ipRequests.get(ip);

    if (!entry || now > entry.resetAt) {
      ipRequests.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      entry.count++;
      if (entry.count > RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: "Demo rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};