import { randomUUID } from "node:crypto";
import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { finished } from "node:stream/promises";
import { TAILLE_MAX } from "./formats";
import { dossierTemp, supprimer } from "./stockage";

export class ErreurRessource extends Error {
  constructor(
    message: string,
    public statut = 400,
  ) {
    super(message);
  }
}

export type FichierRecu = { chemin: string; octets: number; entete: Buffer };

const ECRITURE_REFUSEE = new Set(["EACCES", "EPERM", "EROFS"]);

export function erreurStockage(e: unknown): ErreurRessource | null {
  if (e instanceof ErreurRessource) return e;
  const code = (e as NodeJS.ErrnoException | null)?.code;
  if (code && ECRITURE_REFUSEE.has(code)) return new ErreurRessource("Le serveur ne peut pas écrire dans son dossier de stockage : vérifiez le volume monté et la variable STOCKAGE_DIR.", 500);
  if (code === "ENOSPC") return new ErreurRessource("Le disque du serveur est plein.", 507);
  return null;
}

export async function recevoirFlux(flux: ReadableStream<Uint8Array> | null, maxOctets = TAILLE_MAX): Promise<FichierRecu> {
  if (!flux) throw new ErreurRessource("Aucun fichier reçu.");
  try {
    await fs.mkdir(dossierTemp(), { recursive: true });
  } catch (e) {
    throw erreurStockage(e) ?? e;
  }
  const chemin = path.join(dossierTemp(), randomUUID());
  const sortie = createWriteStream(chemin);
  const etat: { erreur: Error | null } = { erreur: null };
  sortie.on("error", (e) => {
    etat.erreur = e;
  });
  const morceauxEntete: Buffer[] = [];
  let tailleEntete = 0;
  let octets = 0;
  const lecteur = flux.getReader();
  try {
    for (;;) {
      const { done, value } = await lecteur.read();
      if (done) break;
      if (etat.erreur) throw etat.erreur;
      octets += value.byteLength;
      if (octets > maxOctets) throw new ErreurRessource(`Fichier trop volumineux : ${Math.round(maxOctets / 1024 / 1024)} Mo maximum.`, 413);
      if (tailleEntete < 64) {
        morceauxEntete.push(Buffer.from(value.subarray(0, 64 - tailleEntete)));
        tailleEntete += Math.min(value.byteLength, 64 - tailleEntete);
      }
      if (!sortie.write(value)) {
        await new Promise<void>((r) => {
          sortie.once("drain", r);
          sortie.once("error", () => r());
        });
      }
    }
    if (etat.erreur) throw etat.erreur;
    sortie.end();
    await finished(sortie);
  } catch (e) {
    lecteur.cancel().catch(() => undefined);
    sortie.destroy();
    await supprimer(chemin).catch(() => undefined);
    throw erreurStockage(e) ?? e;
  }
  if (!octets) {
    await supprimer(chemin);
    throw new ErreurRessource("Le fichier est vide.");
  }
  return { chemin, octets, entete: Buffer.concat(morceauxEntete) };
}
