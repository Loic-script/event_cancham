import type { Metadata } from "next";
import { AdminAdministrateurs } from "@/components/traversee/admin/AdminAdministrateurs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { adressesSuperAdmins, estAdresseSuperAdmin, estSuperAdmin } from "@/lib/super-admin";

export const metadata: Metadata = { title: "Accès & équipe · Back-office" };

export default async function Page() {
  const moi = await requireAdmin();
  const [admins, membres] = await Promise.all([
    prisma.user.findMany({
      where: { acces: "ADMIN" },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        company: true,
        phone: true,
        photo: true,
        acces: true,
        superAdmin: true,
        createdAt: true,
        decisionLe: true,
        // Une session est ouverte à chaque connexion : la plus récente donne la dernière connexion.
        sessions: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
    }),
    prisma.user.findMany({
      where: { acces: "MEMBRE" },
      orderBy: { email: "asc" },
      select: { email: true, firstName: true, lastName: true },
    }),
  ]);

  const liste = admins
    .map((a) => ({
      id: a.id,
      email: a.email,
      firstName: a.firstName,
      lastName: a.lastName,
      nom: `${a.firstName} ${a.lastName}`.trim() || a.email,
      role: a.role ?? "",
      company: a.company ?? "",
      phone: a.phone ?? "",
      photo: a.photo,
      creeLe: a.createdAt.toISOString(),
      adminDepuis: (a.decisionLe ?? a.createdAt).toISOString(),
      derniereConnexion: a.sessions[0]?.createdAt.toISOString() ?? null,
      superAdmin: estSuperAdmin(a),
      // Fixé par SUPER_ADMINS : intouchable depuis la plateforme.
      fixe: estAdresseSuperAdmin(a.email),
    }))
    .sort((a, b) => Number(b.superAdmin) - Number(a.superAdmin));

  return (
    <AdminAdministrateurs
      moi={moi.id}
      superAdmin={estSuperAdmin(moi)}
      superAdmins={adressesSuperAdmins()}
      admins={liste}
      membres={membres.map((m) => ({ email: m.email, nom: `${m.firstName} ${m.lastName}` }))}
    />
  );
}
