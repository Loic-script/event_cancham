import { notFound, redirect } from "next/navigation";
import { obtenirConversationEquipe } from "@/lib/messagerie";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** L'équipe écrit à un participant : sa conversation avec l'équipe, créée au premier passage. */
export default async function AdminAvecPage(props: PageProps<"/admin/messagerie/avec/[userId]">) {
  const { userId } = await props.params;
  await requireAdmin();
  const membre = Number(userId);
  if (!Number.isInteger(membre) || membre <= 0) notFound();
  const cible = await prisma.user.findUnique({ where: { id: membre }, select: { acces: true } });
  if (!cible || cible.acces !== "MEMBRE") notFound();
  redirect(`/admin/messagerie/${await obtenirConversationEquipe(membre)}`);
}
