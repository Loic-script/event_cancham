import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { MESSAGE_FORMAT, detecterFormat, tailleLisible, type Detection } from "./formats";
import { ErreurRessource, type FichierRecu } from "./reception";
import { copierSiExiste, deplacer, dossierRessource, existe, supprimer } from "./stockage";

sharp.cache(false);

export { ErreurRessource, recevoirFlux, type FichierRecu } from "./reception";

export type ResultatTraitement = {
  format: Detection["format"];
  fichier: string;
  pages: number;
  taille: string;
  tailleOctets: number;
  couverture: string | null;
};

type Execution = { code: number | null; sortie: string; erreur: string };

function executer(commande: string, args: string[], delaiMs: number): Promise<Execution> {
  return new Promise((resolve, reject) => {
    const enfant = spawn(commande, args, { windowsHide: true });
    let sortie = "";
    let erreur = "";
    const minuteur = setTimeout(() => enfant.kill("SIGKILL"), delaiMs);
    enfant.stdout.on("data", (d) => (sortie += d.toString()));
    enfant.stderr.on("data", (d) => (erreur += d.toString()));
    enfant.on("error", (e) => {
      clearTimeout(minuteur);
      reject(e);
    });
    enfant.on("close", (code) => {
      clearTimeout(minuteur);
      resolve({ code, sortie, erreur });
    });
  });
}

async function compterPages(dossier: string): Promise<number> {
  const noms = await fs.readdir(dossier);
  return noms.filter((n) => /^\d+\.png$/.test(n)).length;
}

export async function convertirPdfEnPages(pdf: string, sortie: string): Promise<number> {
  await fs.mkdir(sortie, { recursive: true });
  const pdftoppm = process.env.PDFTOPPM_PATH || "pdftoppm";
  try {
    const prefixe = path.join(sortie, "p");
    const r = await executer(pdftoppm, ["-r", "110", "-png", pdf, prefixe], 15 * 60 * 1000);
    if (r.code === 0) {
      for (const nom of await fs.readdir(sortie)) {
        const m = nom.match(/^p-(\d+)\.png$/);
        if (m) await fs.rename(path.join(sortie, nom), path.join(sortie, `${Number(m[1])}.png`));
      }
      const n = await compterPages(sortie);
      if (n > 0) return n;
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  const script = path.join(process.cwd(), "scripts", "pdf-en-pages.mjs");
  const r = await executer(process.execPath, [script, pdf, sortie, "110"], 15 * 60 * 1000);
  if (r.code !== 0) throw new Error(r.erreur || "Conversion PDF impossible");
  const n = await compterPages(sortie);
  if (!n) throw new Error("Aucune page produite");
  return n;
}

function cheminsLibreOffice(): string[] {
  const liste = [process.env.SOFFICE_PATH, "soffice", "libreoffice"];
  if (process.platform === "win32") liste.push("C:\\Program Files\\LibreOffice\\program\\soffice.exe", "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe");
  if (process.platform === "darwin") liste.push("/Applications/LibreOffice.app/Contents/MacOS/soffice");
  return liste.filter((x): x is string => Boolean(x));
}

export async function convertirDocxEnPdf(docx: string, dossierTravail: string): Promise<string> {
  const profil = path.join(tmpdir(), `lo-${randomUUID()}`);
  try {
    for (const commande of cheminsLibreOffice()) {
      try {
        const r = await executer(commande, [`-env:UserInstallation=${pathToFileURL(profil).href}`, "--headless", "--norestore", "--convert-to", "pdf", "--outdir", dossierTravail, docx], 5 * 60 * 1000);
        const pdf = path.join(dossierTravail, `${path.parse(docx).name}.pdf`);
        if (r.code === 0 && (await existe(pdf))) return pdf;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      }
    }
  } finally {
    await supprimer(profil);
  }
  throw new Error("LibreOffice indisponible ou conversion échouée");
}

export async function genererCouverture(source: string, destination: string): Promise<void> {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await sharp(source).rotate().resize({ width: 720, height: 960, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 78, mozjpeg: true }).toFile(destination);
}

export async function normaliserImage(source: string, destination: string, format: "png" | "webp" | "jpeg", largeurMax = 2400): Promise<void> {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const base = sharp(source, { limitInputPixels: 268402689 }).rotate().resize({ width: largeurMax, height: largeurMax, fit: "inside", withoutEnlargement: true });
  if (format === "png") await base.png({ compressionLevel: 9 }).toFile(destination);
  else if (format === "webp") await base.webp({ quality: 82 }).toFile(destination);
  else await base.flatten({ background: "#ffffff" }).jpeg({ quality: 82, mozjpeg: true }).toFile(destination);
}

export async function traiterEnvoi(ressourceId: string, recu: FichierRecu, nomOriginal: string, garderCouverturePerso: boolean): Promise<ResultatTraitement> {
  const detection = detecterFormat(recu.entete, nomOriginal);
  if (!detection) {
    await supprimer(recu.chemin);
    throw new ErreurRessource(MESSAGE_FORMAT, 415);
  }
  const final = dossierRessource(ressourceId);
  const travail = `${final}.travail-${randomUUID()}`;
  try {
    await fs.mkdir(path.join(travail, "pages"), { recursive: true });
    const fichier = `original.${detection.extension}`;
    await deplacer(recu.chemin, path.join(travail, fichier));
    let pages = 0;
    if (detection.format === "pdf") {
      pages = await convertirPdfEnPages(path.join(travail, fichier), path.join(travail, "pages"));
    } else if (detection.format === "docx") {
      const conversion = path.join(travail, "conversion");
      await fs.mkdir(conversion, { recursive: true });
      const pdf = await convertirDocxEnPdf(path.join(travail, fichier), conversion);
      pages = await convertirPdfEnPages(pdf, path.join(travail, "pages"));
      await supprimer(conversion);
    } else if (detection.format === "photo") {
      await normaliserImage(path.join(travail, fichier), path.join(travail, "pages", "1.png"), "png");
      pages = 1;
    }
    let couverture: string | null = null;
    if (garderCouverturePerso && (await existe(path.join(final, "couverture-perso.jpg")))) {
      await copierSiExiste(path.join(final, "couverture-perso.jpg"), path.join(travail, "couverture-perso.jpg"));
      couverture = "couverture-perso.jpg";
    } else if (pages > 0) {
      await genererCouverture(path.join(travail, "pages", "1.png"), path.join(travail, "couverture.jpg"));
      couverture = "couverture.jpg";
    }
    await supprimer(final);
    await deplacer(travail, final);
    return {
      format: detection.format,
      fichier: detection.format === "video" ? "original.mp4" : fichier,
      pages,
      taille: tailleLisible(recu.octets),
      tailleOctets: recu.octets,
      couverture,
    };
  } catch (e) {
    await supprimer(travail);
    await supprimer(recu.chemin);
    if (e instanceof ErreurRessource) throw e;
    throw new ErreurRessource(`« ${nomOriginal} » n’a pas pu être converti, enregistrez-le en PDF.`, 422);
  }
}

export async function enregistrerCouverturePerso(ressourceId: string, recu: FichierRecu): Promise<string> {
  const detection = detecterFormat(recu.entete, "");
  if (detection?.format !== "photo") {
    await supprimer(recu.chemin);
    throw new ErreurRessource("La couverture doit être une photo JPEG, PNG ou WebP.", 415);
  }
  try {
    await genererCouverture(recu.chemin, path.join(dossierRessource(ressourceId), "couverture-perso.jpg"));
    return "couverture-perso.jpg";
  } catch {
    throw new ErreurRessource("Cette photo n’a pas pu être lue.", 422);
  } finally {
    await supprimer(recu.chemin);
  }
}
