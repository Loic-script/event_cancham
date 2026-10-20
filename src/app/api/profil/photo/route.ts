import { remplacerImageProfil, retirerImageProfil } from "@/lib/profil-images";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Remplace la photo de profil du compte connecté. */
export const POST = (req: Request) => remplacerImageProfil(req, "photo");

/** Retire la photo de profil du compte connecté. */
export const DELETE = () => retirerImageProfil("photo");
