import { prisma } from "@/lib/prisma";

/** Participations aux défis en base : « pitch » (vidéo et note du jury) et « tombola » (publication et réactions). */
export type Defi = "pitch" | "tombola";

export type MaParticipation = { lien: string; envoi: number; reactions: number | null; commentaires: number | null; partages: number | null; releveLe: number | null; retire: boolean };

export type Participant = {
  id: string;
  userId: number;
  porteur: string;
  ent: string;
  role: string;
  sect: string;
  photo: string | null;
  lien: string;
  envoi: number;
  reactions: number | null;
  releveLe: number | null;
  retire: boolean;
  note: { note: number; avis: string; t: number } | null;
};

export async function maParticipation(userId: number, defi: Defi): Promise<MaParticipation | null> {
  const p = await prisma.participationDefi.findUnique({ where: { defi_userId: { defi, userId } } });
  if (!p) return null;
  return { lien: p.lien, envoi: p.creeLe.getTime(), reactions: p.reactions, commentaires: p.commentaires, partages: p.partages, releveLe: p.releveLe?.getTime() ?? null, retire: p.retire };
}

/** Participants d'un défi (back-office et classement), les plus récents d'abord. */
export async function participants(defi: Defi): Promise<Participant[]> {
  const lignes = await prisma.participationDefi.findMany({
    where: { defi },
    orderBy: { creeLe: "desc" },
    select: {
      id: true,
      userId: true,
      lien: true,
      reactions: true,
      releveLe: true,
      retire: true,
      note: true,
      avis: true,
      noteLe: true,
      creeLe: true,
      user: { select: { firstName: true, lastName: true, company: true, role: true, sector: true, photo: true } },
    },
  });
  return lignes.map((p) => ({
    id: p.id,
    userId: p.userId,
    porteur: `${p.user.firstName} ${p.user.lastName}`.trim(),
    ent: p.user.company ?? "",
    role: p.user.role ?? "",
    sect: p.user.sector ?? "",
    photo: p.user.photo,
    lien: p.lien,
    envoi: p.creeLe.getTime(),
    reactions: p.reactions,
    releveLe: p.releveLe?.getTime() ?? null,
    retire: p.retire,
    note: p.note === null ? null : { note: p.note, avis: p.avis, t: (p.noteLe ?? p.creeLe).getTime() },
  }));
}

/** Relevé des réactions fait par le serveur (API Facebook) pour la publication enregistrée par ce compte. */
export async function enregistrerReleve(userId: number, lien: string, r: { reactions: number; comments: number; shares: number; at?: number }) {
  await prisma.participationDefi.updateMany({
    where: { defi: "tombola", userId, lien },
    data: { reactions: r.reactions, commentaires: r.comments, partages: r.shares, releveLe: new Date(r.at ?? Date.now()) },
  });
}
