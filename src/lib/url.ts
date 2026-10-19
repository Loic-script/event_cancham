import { headers } from "next/headers";

/**
 * Adresse publique du site, sans « / » final : APP_URL (ex. https://latraversee.cancham.mg), sinon l'hôte de la requête.
 * `fiable` : pour un lien envoyé par e-mail, l'hôte de la requête ne suffit pas en production (en-tête Host falsifiable).
 */
export async function urlPublique({ fiable = false }: { fiable?: boolean } = {}): Promise<string> {
  const configuree = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (configuree) return configuree;
  if (fiable && process.env.NODE_ENV === "production") throw new Error("APP_URL non configurée");
  const h = await headers();
  const hote = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000").split(",")[0].trim();
  const local = /^(localhost|127\.|\[::1\])/.test(hote);
  const proto = (h.get("x-forwarded-proto") ?? (local ? "http" : "https")).split(",")[0].trim();
  return `${proto}://${hote}`;
}
