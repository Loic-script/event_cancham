"use client";

/** Photo réduite dans le navigateur (data URL) envoyée au serveur (/api/fil/images) ; renvoie son adresse. */
export async function envoyerImage(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const reponse = await fetch("/api/fil/images", { method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob });
  const corps = (await reponse.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!reponse.ok || !corps.url) throw new Error(corps.message ?? "La photo n’a pas pu être envoyée.");
  return corps.url;
}

/** Vidéo envoyée telle quelle sur /api/videos, avec la progression en pourcentage ; renvoie son adresse. */
export function envoyerVideo(f: File, progression?: (pourcent: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/videos");
    xhr.setRequestHeader("Content-Type", f.type || "application/octet-stream");
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) progression?.(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      let corps: { ok?: boolean; url?: string; message?: string } = {};
      try {
        corps = JSON.parse(xhr.responseText);
      } catch {
        corps = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && corps.url) resolve(corps.url);
      else reject(new Error(corps.message ?? "La vidéo n’a pas pu être envoyée."));
    };
    xhr.onerror = () => reject(new Error("Connexion interrompue pendant l’envoi de la vidéo."));
    xhr.send(f);
  });
}
