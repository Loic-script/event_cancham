export const SESSION_COOKIE = "session";

export const LOGIN_PATH = "/connexion";

// /api/paiements/vanillapay : notification du prestataire de paiement ; /simulateur-vanillapay : simulateur local, hors production.
export const PUBLIC_PATHS = ["/connexion", "/inscription", "/mot-de-passe-oublie", "/creer-mot-de-passe", "/confidentialite", "/suppression-donnees", "/api/health", "/api/auth", "/api/paiements/vanillapay", "/simulateur-vanillapay"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (isPublicPath(value)) return "/";
  return value;
}
