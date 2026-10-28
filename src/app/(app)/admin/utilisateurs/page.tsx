import type { Metadata } from "next";
import { Utilisateurs } from "@/components/traversee/admin/Utilisateurs";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Utilisateurs · Back-office" };

/** Demandes d'accès (en attente, validés, refusés) et création d'un compte, dans une seule page. */
export default async function Page(props: PageProps<"/admin/utilisateurs">) {
  const { onglet } = await props.searchParams;
  const comptes = await prisma.user.findMany({
    where: { acces: "MEMBRE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, firstName: true, lastName: true, email: true, company: true, role: true, phone: true, statut: true, createdAt: true, decisionLe: true },
  });

  return (
    <Utilisateurs
      ongletInitial={onglet === "creer" ? "creer" : "acces"}
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
