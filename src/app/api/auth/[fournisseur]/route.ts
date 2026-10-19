import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { pageErreurSociale } from "@/lib/connexion-sociale";
import { COOKIE_OAUTH, estFournisseur, fournisseurConfigure, nouvelEtat, urlAutorisation, urlRetour } from "@/lib/oauth";
import { urlPublique } from "@/lib/url";

export const dynamic = "force-dynamic";

/** Départ vers Google ou Facebook : ?depuis=connexion|inscription&next=/page */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/auth/[fournisseur]">) {
  const { fournisseur } = await ctx.params;
  const depuis = req.nextUrl.searchParams.get("depuis") === "inscription" ? "inscription" : "connexion";
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  if (!estFournisseur(fournisseur)) redirect(pageErreurSociale(depuis, "", "erreur", next));
  if (!fournisseurConfigure(fournisseur)) redirect(pageErreurSociale(depuis, fournisseur, "config", next));

  const { state, verificateur, defi } = nouvelEtat();
  (await cookies()).set(COOKIE_OAUTH, JSON.stringify({ f: fournisseur, state, verificateur, next, depuis }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 600,
  });
  redirect(urlAutorisation(fournisseur, { state, defi, redirectUri: urlRetour(await urlPublique(), fournisseur) }));
}
