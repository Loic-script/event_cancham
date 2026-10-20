import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Parcours } from "@/components/bienvenue/Parcours";
import { LOGIN_PATH, safeNext } from "@/lib/auth";
import { PAGE_COMPLETER, profilIncomplet } from "@/lib/coordonnees";
import { maParticipation } from "@/lib/defis";
import { event } from "@/lib/mock/data";
import { etatParcours } from "@/lib/parcours";
import { aAccesEspace, getCurrentUser, PAGE_ATTENTE } from "@/lib/session";

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

  const sp = await props.searchParams;
  const next = safeNext(premier(sp.next));
  const acces = aAccesEspace(user);
  const [etat, pitch, tombola] = await Promise.all([etatParcours(user.id), maParticipation(user.id, "pitch"), maParticipation(user.id, "tombola")]);
  const maintenant = new Date();
  const restant = Math.max(0, Math.floor((new Date(event.date).getTime() - maintenant.getTime()) / 1000));

  return (
    <Suspense>
      <Parcours
        prenom={user.firstName}
        nom={user.lastName}
        photo={user.photo}
        couverture={user.couverture}
        acces={acces}
        etapes={etat.etapes}
        commence={etat.commence}
        sortie={acces ? next : PAGE_ATTENTE}
        profil={{ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "", company: user.company ?? "", role: user.role ?? "", sector: user.sector ?? "", bio: user.bio ?? "" }}
        pitch={pitch?.lien ?? null}
        tombola={tombola?.lien ?? null}
        next={next}
        restant={restant}
      />
    </Suspense>
  );
}
