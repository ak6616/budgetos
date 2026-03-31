export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function isDemoWriteRequest(method: string, pathname: string): boolean {
  if (!isDemoMode()) return false;
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return false;
  if (!pathname.startsWith("/api/")) return false;
  if (pathname.includes("/auth/") || pathname.endsWith("/auth")) return false;
  return true;
}
