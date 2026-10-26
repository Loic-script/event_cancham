import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Parcours } from "@/components/bienvenue/Parcours";
import { LOGIN_PATH, safeNext } from "@/lib/auth";
import { PAGE_COMPLETER, profilIncomplet } from "@/lib/coordonnees";
import { event } from "@/lib/evenement";
import { etatParcours } from "@/lib/parcours";
import { aAccesEspace, getCurrentUser, PAGE_ATTENTE, PAGE_PAIEMENT } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Bienvenue – La Traversée" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1a30",
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

const premier = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Parcours d'accueil : après l'inscription, puis à chaque connexion tant qu'il n'est pas terminé (voir src/lib/parcours.ts). */
export default async function BienvenuePage(props: PageProps<"/bienvenue">) {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  if (user.acces === "ADMIN") redirect("/admin");
  if (user.statut === "REFUSE") redirect(PAGE_ATTENTE);
  if (user.statut === "EN_ATTENTE" && profilIncomplet(user)) redirect(PAGE_COMPLETER);
  // Le billet se règle avant le parcours : il ouvre l'accès.
  if (!aAccesEspace(user)) redirect(PAGE_PAIEMENT);

  const sp = await props.searchParams;
  const next = safeNext(premier(sp.next));
  const etat = await etatParcours(user.id);
  const maintenant = new Date();
  const restant = Math.max(0, Math.floor((new Date(event.date).getTime() - maintenant.getTime()) / 1000));

  return (
    <Suspense>
      <Parcours
        prenom={user.firstName}
        nom={user.lastName}
        photo={user.photo}
        couverture={user.couverture}
        couverturePosition={user.couverturePosition}
        etapes={etat.etapes}
        commence={etat.commence}
        sortie={next}
        profil={{ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "", company: user.company ?? "", role: user.role ?? "", sector: user.sector ?? "", bio: user.bio ?? "" }}
        next={next}
        restant={restant}
      />
    </Suspense>
  );
}
