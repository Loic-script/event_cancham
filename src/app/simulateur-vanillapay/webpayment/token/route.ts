import { identifiantsValides, JETON_SIMULE, reponse, SIMULATEUR_ACTIF } from "@/lib/simulateur-vanillapay";

export const dynamic = "force-dynamic";

/** Simulateur : jeton (GET /webpayment/token avec Client-Id et Client-Secret). */
export async function GET(request: Request) {
  if (!SIMULATEUR_ACTIF) return new Response(null, { status: 404 });
  if (!identifiantsValides(request.headers)) return reponse(401, "Identifiants invalides", null, 401);
  return reponse(200, "Succès", { Token: JETON_SIMULE, Expiration: new Date(Date.now() + 3600_000).toISOString() });
}
