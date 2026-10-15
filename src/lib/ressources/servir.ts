import { createReadStream, promises as fs } from "node:fs";
import { Readable } from "node:stream";

export const ENTETES_PROTEGES: Record<string, string> = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Disposition": "inline",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Robots-Tag": "noindex, nofollow",
};

export function refus(statut: number, message: string): Response {
  return new Response(message, { status: statut, headers: { ...ENTETES_PROTEGES, "Content-Type": "text/plain; charset=utf-8" } });
}

export function json(statut: number, corps: unknown): Response {
  return new Response(JSON.stringify(corps), { status: statut, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function reponseFichier(chemin: string, type: string): Promise<Response> {
  try {
    const donnees = await fs.readFile(chemin);
    return new Response(new Uint8Array(donnees), { status: 200, headers: { ...ENTETES_PROTEGES, "Content-Type": type, "Content-Length": String(donnees.byteLength) } });
  } catch {
    return refus(404, "Fichier manquant");
  }
}

export async function reponseFlux(requete: Request, chemin: string, type: string): Promise<Response> {
  let taille: number;
  try {
    taille = (await fs.stat(chemin)).size;
  } catch {
    return refus(404, "Fichier manquant");
  }
  const plage = requete.headers.get("range");
  const base = { ...ENTETES_PROTEGES, "Content-Type": type, "Accept-Ranges": "bytes" };
  if (plage) {
    const m = plage.match(/^bytes=(\d*)-(\d*)$/);
    if (!m || (m[1] === "" && m[2] === "")) return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${taille}` } });
    let debut: number;
    let fin: number;
    if (m[1] === "") {
      debut = Math.max(0, taille - Number(m[2]));
      fin = taille - 1;
    } else {
      debut = Number(m[1]);
      fin = m[2] === "" ? taille - 1 : Math.min(Number(m[2]), taille - 1);
    }
    if (debut >= taille || debut > fin) return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${taille}` } });
    const flux = Readable.toWeb(createReadStream(chemin, { start: debut, end: fin })) as ReadableStream<Uint8Array>;
    return new Response(flux, { status: 206, headers: { ...base, "Content-Range": `bytes ${debut}-${fin}/${taille}`, "Content-Length": String(fin - debut + 1) } });
  }
  const flux = Readable.toWeb(createReadStream(chemin)) as ReadableStream<Uint8Array>;
  return new Response(flux, { status: 200, headers: { ...base, "Content-Length": String(taille) } });
}
