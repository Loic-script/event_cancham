import { notFound, redirect } from "next/navigation";
import { obtenirConversationDirecte } from "@/lib/messagerie";
import { prisma } from "@/lib/prisma";
import { requireMembreActif } from "@/lib/session";

export const dynamic = "force-dynamic";

/** « Écrire » à un participant (annuaire, nouveau message) : ouvre la conversation, créée au premier passage. */
export default async function AvecPage(props: PageProps<"/messages/avec/[userId]">) {
  const { userId } = await props.params;
  const user = await requireMembreActif();
  const autre = Number(userId);
  if (!Number.isInteger(autre) || autre <= 0) notFound();
  if (autre === user.id) redirect("/messages");
  const cible = await prisma.user.findUnique({ where: { id: autre }, select: { acces: true, statut: true } });
  if (!cible) notFound();
  // Les administrateurs répondent au nom de l'équipe.
  if (cible.acces === "ADMIN") redirect("/messages/equipe");
  if (cible.statut !== "ACTIF") notFound();
  redirect(`/messages/${await obtenirConversationDirecte(user.id, autre)}`);
}
