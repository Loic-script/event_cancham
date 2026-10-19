import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { connecterAvecProfil, pageErreurSociale } from "@/lib/connexion-sociale";
import { COOKIE_OAUTH, estFournisseur, lireProfil, urlRetour } from "@/lib/oauth";
import { urlPublique } from "@/lib/url";

export const dynamic = "force-dynamic";

type Etat = { f?: string; state?: string; verificateur?: string; next?: string; depuis?: string };

/** Retour de Google ou Facebook : vérifie l'état, lit le profil, puis connecte (ou crée) le compte. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/auth/[fournisseur]/callback">) {
  const { fournisseur } = await ctx.params;
  const jar = await cookies();
  let etat: Etat = {};
  try {
    etat = JSON.parse(jar.get(COOKIE_OAUTH)?.value ?? "{}") as Etat;
  } catch {
    etat = {};
  }
  jar.set(COOKIE_OAUTH, "", { path: "/api/auth", maxAge: 0 });

  const q = req.nextUrl.searchParams;
  const depuis = etat.depuis === "inscription" ? "inscription" : "connexion";
  const next = safeNext(etat.next);
  if (!estFournisseur(fournisseur) || etat.f !== fournisseur || !etat.state || etat.state !== q.get("state") || !etat.verificateur) {
    redirect(pageErreurSociale(depuis, fournisseur, "etat", next));
  }
  const code = q.get("code");
  if (!code) redirect(pageErreurSociale(depuis, fournisseur, "refus", next));

  let destination: string;
  try {
    const profil = await lireProfil(fournisseur, code, etat.verificateur, urlRetour(await urlPublique(), fournisseur));
    const r = await connecterAvecProfil(fournisseur, profil, next);
    destination = "destination" in r ? r.destination : pageErreurSociale(depuis, fournisseur, r.erreur, next);
  } catch (error) {
    console.error(`Connexion ${fournisseur} impossible :`, error);
    destination = pageErreurSociale(depuis, fournisseur, "erreur", next);
  }
  redirect(destination);
}
