export const SESSION_COOKIE = "session";

export const LOGIN_PATH = "/connexion";

export const PUBLIC_PATHS = ["/connexion", "/inscription", "/mot-de-passe-oublie", "/api/health", "/api/auth"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (isPublicPath(value)) return "/";
  return value;
}
