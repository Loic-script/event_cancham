import { promises as fs } from "node:fs";
import path from "node:path";
import { racineStockage } from "./stockage";

const SOUS_DOSSIERS = ["tmp", "ressources", "dossiers", "photos", "videos", "fil"];

export async function preparerStockage(): Promise<void> {
  const racine = racineStockage();
  try {
    await Promise.all(SOUS_DOSSIERS.map((d) => fs.mkdir(path.join(racine, d), { recursive: true })));
    const essai = path.join(racine, "tmp", `.essai-ecriture-${process.pid}`);
    await fs.writeFile(essai, "ok");
    await fs.rm(essai, { force: true });
    console.log(`Stockage prêt : ${racine}`);
  } catch (e) {
    console.error(
      `Stockage inaccessible en écriture (${racine}) : ${e instanceof Error ? e.message : String(e)}. Montez un volume persistant et définissez STOCKAGE_DIR, ou donnez les droits d’écriture à l’utilisateur qui lance le serveur.`,
    );
  }
}
