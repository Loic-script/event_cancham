import { promises as fs } from "node:fs";
import path from "node:path";

const ID = /^[a-z0-9]{8,40}$/i;
const PAGE = /^[1-9]\d{0,4}$/;

export function racineStockage(): string {
  return process.env.STOCKAGE_DIR ? path.resolve(process.env.STOCKAGE_DIR) : path.join(process.cwd(), "stockage");
}

function sur(id: string): string {
  if (!ID.test(id)) throw new Error("Identifiant invalide");
  return id;
}

export function idValide(id: unknown): id is string {
  return typeof id === "string" && ID.test(id);
}

export function numeroPageValide(n: unknown): n is string {
  return typeof n === "string" && PAGE.test(n);
}

export const dossierTemp = () => path.join(racineStockage(), "tmp");
export const dossierRessource = (id: string) => path.join(racineStockage(), "ressources", sur(id));
export const dossierPages = (id: string) => path.join(dossierRessource(id), "pages");
export const fichierPage = (id: string, n: number | string) => path.join(dossierPages(id), `${Number(n)}.png`);
export const fichierRessource = (id: string, nom: string) => path.join(dossierRessource(id), path.basename(nom));
export const dossierBlocs = (id: string) => path.join(dossierRessource(id), "blocs");
export const fichierBloc = (id: string, nom: string) => path.join(dossierBlocs(id), path.basename(nom));
export const dossierImages = (id: string) => path.join(racineStockage(), "dossiers", sur(id));
export const fichierImageDossier = (id: string, nom: string) => path.join(dossierImages(id), path.basename(nom));

export async function existe(chemin: string): Promise<boolean> {
  try {
    await fs.access(chemin);
    return true;
  } catch {
    return false;
  }
}

export async function supprimer(chemin: string): Promise<void> {
  await fs.rm(chemin, { recursive: true, force: true, maxRetries: 6, retryDelay: 120 });
}

export async function copierSiExiste(source: string, destination: string): Promise<void> {
  if (!(await existe(source))) return;
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, { recursive: true, force: true });
}

export async function deplacer(source: string, destination: string): Promise<void> {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  try {
    await fs.rename(source, destination);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "EXDEV") throw e;
    await fs.cp(source, destination, { recursive: true, force: true });
    await supprimer(source);
  }
}

export async function listerBlocs(id: string): Promise<string[]> {
  try {
    return await fs.readdir(dossierBlocs(id));
  } catch {
    return [];
  }
}
