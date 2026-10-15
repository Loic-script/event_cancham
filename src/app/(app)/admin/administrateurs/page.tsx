import type { Metadata } from "next";
import { AdminAdministrateurs } from "@/components/traversee/admin/AdminAdministrateurs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Administrateurs · Back-office" };

export default async function Page() {
  const moi = await requireAdmin();
  const [admins, membres] = await Promise.all([
    prisma.user.findMany({
      where: { acces: "ADMIN" },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { acces: "MEMBRE" },
      orderBy: { email: "asc" },
      select: { email: true, firstName: true, lastName: true },
    }),
  ]);

  return (
    <AdminAdministrateurs
      moi={moi.id}
      admins={admins.map((a) => ({ id: a.id, email: a.email, nom: `${a.firstName} ${a.lastName}`, depuis: a.createdAt.toISOString() }))}
      membres={membres.map((m) => ({ email: m.email, nom: `${m.firstName} ${m.lastName}` }))}
    />
  );
}
