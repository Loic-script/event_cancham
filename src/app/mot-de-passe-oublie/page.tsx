import type { Metadata, Viewport } from "next";
import { AuthScene } from "@/components/auth/AuthScene";
import { DemandeLienForm } from "@/components/auth/MotDePasseOublie";

export const metadata: Metadata = {
  title: { absolute: "Mot de passe oublié – La Traversée" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1a30",
  viewportFit: "cover",
};

export default async function MotDePasseOubliePage({ searchParams }: PageProps<"/mot-de-passe-oublie">) {
  const { email } = await searchParams;
  return (
    <AuthScene headline={{ first: "Retrouvez", accent: "votre accès." }} lead="Un lien par e-mail suffit pour choisir un nouveau mot de passe." cardTitle="Mot de passe oublié">
      <DemandeLienForm emailInitial={typeof email === "string" ? email.slice(0, 254) : ""} />
    </AuthScene>
  );
}
