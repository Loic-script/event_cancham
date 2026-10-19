import { prisma } from "@/lib/prisma";
import { refusSiNonAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const refus = await refusSiNonAdmin();
  if (refus) return refus;
  const comptes = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { id: true, firstName: true, lastName: true, company: true, acces: true, statut: true, createdAt: true },
  });
  return Response.json(
    { ok: true, comptes: comptes.map((c) => ({ id: c.id, nom: `${c.firstName} ${c.lastName}`.trim(), entreprise: c.company, acces: c.acces, enAttente: c.acces === "MEMBRE" && c.statut === "EN_ATTENTE", t: c.createdAt.getTime() })) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
