import { AppShell } from "@/components/app/AppShell";
import { SessionIdentityProvider } from "@/components/profile/useProfile";
import { prisma } from "@/lib/prisma";
import { requireMembreActif } from "@/lib/session";
import { estSuperAdmin } from "@/lib/super-admin";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireMembreActif();
  const enAttente = user.acces === "ADMIN" ? await prisma.user.count({ where: { acces: "MEMBRE", statut: "EN_ATTENTE" } }) : 0;
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
    superAdmin: estSuperAdmin(user),
    createdAt: user.createdAt.toISOString(),
  };

  return (
    <SessionIdentityProvider user={identity}>
      <AppShell enAttente={enAttente}>{children}</AppShell>
    </SessionIdentityProvider>
  );
}
