import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { AuthScene } from "@/components/auth/AuthScene";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { safeNext } from "@/lib/auth";
import { fournisseursActifs, messageErreurSociale } from "@/lib/oauth";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Créer un compte – La Traversée" },
  description: "Créez votre compte pour rejoindre La Traversée, le réseau du gala des 10 ans de CanCham Madagascar.",
};

export const viewport: Viewport = {
  themeColor: "#0b1a30",
  viewportFit: "cover",
};

/** Champs préremplis par l'adresse (bouton « Réserver mon billet » de cancham.mg) : ?prenom=&nom=&entreprise=&role=&email=&telephone= */
const PREREMPLIS = { prenom: "firstName", nom: "lastName", entreprise: "company", role: "role", email: "email", telephone: "phone" } as const;

function prerempli(params: Record<string, string | string[] | undefined>) {
  const initial: Partial<Record<(typeof PREREMPLIS)[keyof typeof PREREMPLIS], string>> = {};
  for (const [param, champ] of Object.entries(PREREMPLIS)) {
    const v = params[param];
    if (typeof v === "string" && v.trim()) initial[champ] = v.trim().slice(0, 120);
  }
  return initial;
}

export default async function RegisterPage({ searchParams }: PageProps<"/inscription">) {
  const params = await searchParams;
  const { next, erreur, via } = params;
  const destination = safeNext(next);

  if (await getCurrentUser()) redirect(destination);

  return (
    <AuthScene
      headline={{ first: "Rejoignez", accent: "La Traversée." }}
      lead="Un réseau qui ouvre de nouvelles perspectives."
      cardTitle="Créer un compte"
      inverse
    >
      <RegisterForm next={destination} fournisseurs={fournisseursActifs()} erreurSociale={messageErreurSociale(erreur, via)} initial={prerempli(params)} />
    </AuthScene>
  );
}
