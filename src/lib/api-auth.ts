import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { getBusinessIdFromRequest } from "@/lib/auth";

/**
 * Zwraca businessId z tokena ORAZ potwierdza, że konto nadal istnieje w bazie.
 *
 * Bez tej weryfikacji zapytania filtrowane po nieistniejącym businessId (np. token
 * ze skasowanego/odtworzonego konta) zwracałyby pustą listę zamiast 401 — użytkownik
 * widziałby pusty panel zamiast zostać wylogowany. Rzucamy ten sam komunikat co przy
 * braku nagłówka, więc istniejące bloki catch w handlerach mapują to na 401, a klient
 * (apiFetch) próbuje odświeżyć token → refresh też zwraca 401 → wylogowanie.
 */
export async function requireBusinessId(req: NextRequest): Promise<string> {
  const businessId = getBusinessIdFromRequest(req);

  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    throw new Error("Missing or invalid authorization header");
  }

  return businessId;
}
