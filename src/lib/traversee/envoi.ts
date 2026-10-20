"use client";

/** Photo réduite dans le navigateur (data URL) envoyée au serveur (/api/fil/images) ; renvoie son adresse. */
export async function envoyerImage(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const reponse = await fetch("/api/fil/images", { method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob });
  const corps = (await reponse.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!reponse.ok || !corps.url) throw new Error(corps.message ?? "La photo n’a pas pu être envoyée.");
  return corps.url;
}
