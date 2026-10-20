import { remplacerImageProfil, retirerImageProfil } from "@/lib/profil-images";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Remplace la photo de couverture du compte connecté (bannière du profil et de la fiche annuaire). */
export const POST = (req: Request) => remplacerImageProfil(req, "couverture");

/** Retire la photo de couverture du compte connecté. */
export const DELETE = () => retirerImageProfil("couverture");
