import { AppShell } from "@/components/app/AppShell";
import { activiteParticipant } from "@/lib/activite";
import { annoncesPour } from "@/lib/annonces";
import { notificationsRdv } from "@/lib/rendezvous";
import { SessionIdentityProvider } from "@/components/profile/useProfile";
import { nonLusEquipe, nonLusMembre } from "@/lib/messagerie";
import { etatParcours } from "@/lib/parcours";
import { prisma } from "@/lib/prisma";
import { requireMembreActif } from "@/lib/session";
import { estSuperAdmin } from "@/lib/super-admin";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireMembreActif();
  const admin = user.acces === "ADMIN";
  const [enAttente, nonLus, nonLusDeLEquipe, annonces, rdv, activite, parcours] = await Promise.all([
    admin ? prisma.user.count({ where: { acces: "MEMBRE", statut: "EN_ATTENTE" } }) : 0,
    nonLusMembre(user.id),
    admin ? nonLusEquipe() : 0,
    admin ? [] : annoncesPour(user.id),
    admin ? [] : notificationsRdv(user.id),
    admin ? [] : activiteParticipant(),
    admin ? null : etatParcours(user.id),
  ]);
  // Rappel en bas de l'espace tant que le profil n'est pas complet (étapes non faites, passées comprises).
  const aCompleter = parcours ? parcours.etapes.filter((e) => !e.fait).map((e) => e.id) : [];
  const identity = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    company: user.company,
    sector: user.sector,
    bio: user.bio,
    phone: user.phone,
    website: user.website,
    city: user.city,
    country: user.country,
    acces: user.acces,
    photo: user.photo,
    couverture: user.couverture,
    couverturePosition: user.couverturePosition,
    codeBillet: user.codeBillet,
    billetPaye: user.billetPaye,
    superAdmin: estSuperAdmin(user),
    createdAt: user.createdAt.toISOString(),
  };

  return (
    <SessionIdentityProvider user={identity}>
      <AppShell enAttente={enAttente} nonLus={nonLus} nonLusEquipe={nonLusDeLEquipe} annonces={annonces} rdv={rdv} activite={activite} aCompleter={aCompleter}>
        {children}
      </AppShell>
    </SessionIdentityProvider>
  );
}
