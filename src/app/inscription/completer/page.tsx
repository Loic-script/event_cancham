import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { AuthScene } from "@/components/auth/AuthScene";
import { CompleterProfilForm } from "@/components/auth/CompleterProfilForm";
import { LOGIN_PATH } from "@/lib/auth";
import { profilIncomplet } from "@/lib/coordonnees";
import { aAccesEspace, getCurrentUser, PAGE_ATTENTE } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Compléter votre profil – La Traversée" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1a30",
  viewportFit: "cover",
};

/** Après une inscription avec Google ou Facebook : entreprise, rôle et téléphone, obligatoires comme dans le formulaire. */
export default async function CompleterProfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  if (!profilIncomplet(user)) redirect(aAccesEspace(user) ? "/" : PAGE_ATTENTE);

  return (
    <AuthScene
      headline={user.firstName ? { first: "Bienvenue,", accent: `${user.firstName}.` } : { first: "Rejoignez", accent: "La Traversée." }}
      lead="Encore une étape : présentez-vous aux autres participants."
      cardTitle="Compléter votre profil"
      inverse
    >
      <CompleterProfilForm
        email={user.email}
        initial={{ firstName: user.firstName, lastName: user.lastName, company: user.company ?? "", role: user.role ?? "", phone: user.phone ?? "" }}
      />
    </AuthScene>
  );
}
