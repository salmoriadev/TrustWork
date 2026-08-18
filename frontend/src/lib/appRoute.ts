export type AppRoute = "landing" | "product";

export function resolveAppRoute(pathname: string): AppRoute {
  return pathname === "/app" || pathname.startsWith("/app/") ? "product" : "landing";
}
