import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { AuthScene } from "@/components/auth/AuthScene";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNext } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "La Traversée – Gala des 10 ans" },
  description: "Connectez-vous à La Traversée, le réseau du gala des 10 ans de CanCham Madagascar.",
};

export const viewport: Viewport = {
  themeColor: "#0b1a30",
  viewportFit: "cover",
};

export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  const { next } = await searchParams;
  const destination = safeNext(next);

  if (await getCurrentUser()) redirect(destination);

  return (
    <AuthScene
      headline={{ first: "Connectez-vous", prefix: "à ", accent: "La Traversée." }}
      lead="Un réseau qui ouvre de nouvelles perspectives."
      cardTitle="Se connecter"
    >
      <LoginForm next={destination} />
    </AuthScene>
  );
}
