import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { AuthScene } from "@/components/auth/AuthScene";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { safeNext } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Créer un compte – La Traversée" },
  description: "Créez votre compte pour rejoindre La Traversée, le réseau du gala des 10 ans de CanCham Madagascar.",
};

export const viewport: Viewport = {
  themeColor: "#0b1a30",
  viewportFit: "cover",
};

export default async function RegisterPage({ searchParams }: PageProps<"/inscription">) {
  const { next } = await searchParams;
  const destination = safeNext(next);

  if (await getCurrentUser()) redirect(destination);

  return (
    <AuthScene
      headline={{ first: "Rejoignez", accent: "La Traversée." }}
      lead="Un réseau qui ouvre de nouvelles perspectives."
      cardTitle="Créer un compte"
      inverse
    >
      <RegisterForm next={destination} />
    </AuthScene>
  );
}
