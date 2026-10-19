import { createHash, createHmac, randomBytes } from "node:crypto";

/** Connexion et inscription avec Google ou Facebook (flux « authorization code », sans bibliothèque). */
export type Fournisseur = "google" | "facebook";
export type ProfilSocial = { id: string; email: string | null; emailVerifie: boolean; prenom: string; nom: string };

export const NOMS_FOURNISSEURS: Record<Fournisseur, string> = { google: "Google", facebook: "Facebook" };
export const COOKIE_OAUTH = "oauth_etat";

const VERSION_GRAPH = process.env.META_GRAPH_VERSION ?? "v23.0";

export const estFournisseur = (v: unknown): v is Fournisseur => v === "google" || v === "facebook";

function identifiants(f: Fournisseur) {
  return f === "google"
    ? { id: process.env.GOOGLE_CLIENT_ID ?? "", secret: process.env.GOOGLE_CLIENT_SECRET ?? "" }
    : { id: process.env.FACEBOOK_APP_ID || process.env.META_APP_ID || "", secret: process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET || "" };
}

export const fournisseurConfigure = (f: Fournisseur) => Boolean(identifiants(f).id && identifiants(f).secret);

export function fournisseursActifs(): Record<Fournisseur, boolean> {
  return { google: fournisseurConfigure("google"), facebook: fournisseurConfigure("facebook") };
}

/** Adresse de retour à déclarer chez Google et Facebook. */
export const urlRetour = (base: string, f: Fournisseur) => `${base}/api/auth/${f}/callback`;

export function nouvelEtat() {
  const verificateur = randomBytes(32).toString("base64url");
  return { state: randomBytes(16).toString("base64url"), verificateur, defi: createHash("sha256").update(verificateur).digest("base64url") };
}

export function urlAutorisation(f: Fournisseur, { state, defi, redirectUri }: { state: string; defi: string; redirectUri: string }): string {
  const { id } = identifiants(f);
  if (f === "google") {
    const p = new URLSearchParams({ client_id: id, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", state, code_challenge: defi, code_challenge_method: "S256", prompt: "select_account" });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
  }
  const p = new URLSearchParams({ client_id: id, redirect_uri: redirectUri, response_type: "code", scope: "email,public_profile", state });
  return `https://www.facebook.com/${VERSION_GRAPH}/dialog/oauth?${p}`;
}

async function json<T>(r: Response, quoi: string): Promise<T> {
  const data = (await r.json().catch(() => ({}))) as T & { error?: unknown };
  if (!r.ok || data.error) throw new Error(`${quoi} : ${r.status} ${JSON.stringify(data.error ?? "")}`);
  return data;
}

const delai = () => AbortSignal.timeout(10_000);

/** Échange le code contre un jeton, puis lit l'identité du compte. */
export async function lireProfil(f: Fournisseur, code: string, verificateur: string, redirectUri: string): Promise<ProfilSocial> {
  const { id, secret } = identifiants(f);
  if (f === "google") {
    const jeton = await json<{ access_token: string }>(
      await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: redirectUri, grant_type: "authorization_code", code_verifier: verificateur }),
        signal: delai(),
        cache: "no-store",
      }),
      "Jeton Google",
    );
    const u = await json<{ sub: string; email?: string; email_verified?: boolean; given_name?: string; family_name?: string }>(
      await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${jeton.access_token}` }, signal: delai(), cache: "no-store" }),
      "Profil Google",
    );
    return { id: u.sub, email: u.email?.toLowerCase() ?? null, emailVerifie: u.email_verified === true, prenom: u.given_name ?? "", nom: u.family_name ?? "" };
  }

  const graph = `https://graph.facebook.com/${VERSION_GRAPH}`;
  const jeton = await json<{ access_token: string }>(
    await fetch(`${graph}/oauth/access_token?${new URLSearchParams({ client_id: id, client_secret: secret, redirect_uri: redirectUri, code })}`, { signal: delai(), cache: "no-store" }),
    "Jeton Facebook",
  );
  const preuve = createHmac("sha256", secret).update(jeton.access_token).digest("hex");
  const u = await json<{ id: string; email?: string; first_name?: string; last_name?: string }>(
    await fetch(`${graph}/me?${new URLSearchParams({ fields: "id,first_name,last_name,email", access_token: jeton.access_token, appsecret_proof: preuve })}`, { signal: delai(), cache: "no-store" }),
    "Profil Facebook",
  );
  // Facebook ne transmet que l'adresse principale confirmée du compte.
  return { id: u.id, email: u.email?.toLowerCase() ?? null, emailVerifie: Boolean(u.email), prenom: u.first_name ?? "", nom: u.last_name ?? "" };
}

export type CodeErreurSociale = "refus" | "etat" | "email" | "non-verifie" | "admin" | "config" | "erreur";

export function messageErreurSociale(code: unknown, via: unknown): string | null {
  const nom = estFournisseur(via) ? NOMS_FOURNISSEURS[via] : "ce service";
  switch (code) {
    case "refus":
      return `Connexion avec ${nom} annulée.`;
    case "etat":
      return `La connexion avec ${nom} a expiré. Réessayez.`;
    case "email":
      return `Votre compte ${nom} ne partage pas d’adresse e-mail : créez votre compte avec le formulaire.`;
    case "non-verifie":
      return `L’adresse e-mail de votre compte ${nom} n’est pas vérifiée : créez votre compte avec le formulaire.`;
    case "admin":
      return `Ce compte administrateur se connecte avec son adresse e-mail et son mot de passe, pas avec ${nom}.`;
    case "config":
      return `La connexion avec ${nom} n’est pas encore activée.`;
    case "erreur":
      return `La connexion avec ${nom} a échoué. Réessayez dans un instant.`;
    default:
      return null;
  }
}
