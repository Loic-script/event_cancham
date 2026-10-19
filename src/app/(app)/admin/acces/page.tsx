import type { Metadata } from "next";
import { AdminAcces } from "@/components/traversee/admin/AdminAcces";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Demandes d’accès · Back-office" };

export default async function Page() {
  const comptes = await prisma.user.findMany({
    where: { acces: "MEMBRE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, firstName: true, lastName: true, email: true, company: true, role: true, phone: true, statut: true, createdAt: true, decisionLe: true },
  });

  return (
    <AdminAcces
      comptes={comptes.map((c) => ({
        id: c.id,
        nom: `${c.firstName} ${c.lastName}`.trim(),
        email: c.email,
        entreprise: c.company ?? "",
        role: c.role ?? "",
        telephone: c.phone ?? "",
        statut: c.statut,
        inscritLe: c.createdAt.toISOString(),
        decisionLe: c.decisionLe?.toISOString() ?? null,
      }))}
    />
  );
}
