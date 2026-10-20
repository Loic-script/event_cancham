import path from "node:path";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { racineStockage, supprimer } from "@/lib/ressources/stockage";
import { SIGLE } from "@/lib/traversee/data";

/**
 * Messagerie : conversation directe entre deux comptes (cle « u12-u34 »), ou conversation d'un participant avec
 * l'équipe CanCham (cle « equipe-u12 ») à laquelle répondent les administrateurs (côté « equipe »).
 */
export type Cote = "membre" | "equipe";

export const MAX_TEXTE_MESSAGE = 4000;
export const TAILLE_MAX_AUDIO = 4 * 1024 * 1024;
export const DUREE_MAX_AUDIO = 120;

export const cleDirecte = (a: number, b: number) => `u${Math.min(a, b)}-u${Math.max(a, b)}`;
export const cleEquipe = (userId: number) => `equipe-u${userId}`;

// ——— Messages vocaux ———

export const FORMATS_AUDIO = { webm: "audio/webm", ogg: "audio/ogg", m4a: "audio/mp4" } as const;
export type FormatAudio = keyof typeof FORMATS_AUDIO;

const ID_AUDIO = /^[a-f0-9]{32}$/;
export const URL_AUDIO = /^\/api\/messages\/audio\/([a-f0-9]{32})$/;
export const idAudioValide = (id: unknown): id is string => typeof id === "string" && ID_AUDIO.test(id);

export function cheminAudio(id: string, format: FormatAudio): string {
  if (!idAudioValide(id)) throw new Error("Identifiant de message vocal invalide");
  return path.join(racineStockage(), "messages", `${id}.${format}`);
}

/** Formats enregistrés par les navigateurs : WebM (Chrome, Firefox), Ogg, MP4/M4A (Safari). */
export function detecterAudio(entete: Buffer): FormatAudio | null {
  if (entete.length >= 4 && entete[0] === 0x1a && entete[1] === 0x45 && entete[2] === 0xdf && entete[3] === 0xa3) return "webm";
  if (entete.length >= 4 && entete.subarray(0, 4).toString("latin1") === "OggS") return "ogg";
  if (entete.length >= 8 && entete.subarray(4, 8).toString("latin1") === "ftyp") return "m4a";
  return null;
}

export async function effacerAudios(urls: (string | null)[]): Promise<void> {
  const ids = urls.map((u) => u?.match(URL_AUDIO)?.[1]).filter((id): id is string => Boolean(id));
  await Promise.all(ids.flatMap((id) => (Object.keys(FORMATS_AUDIO) as FormatAudio[]).map((f) => supprimer(cheminAudio(id, f))))).catch((e) =>
    console.error("Messages vocaux non effacés :", e),
  );
}

// ——— Affichage ———

const FUSEAU = "Indian/Antananarivo";
const JOUR = new Intl.DateTimeFormat("fr-CA", { timeZone: FUSEAU });
const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: FUSEAU });
const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU });

const heure = (d: Date) => HEURE.format(d).replace(":", " h ");

/** « Aujourd’hui », « Hier » ou « 18 octobre », à l'heure de Madagascar. */
export function libelleJour(d: Date): string {
  const jour = JOUR.format(d);
  if (jour === JOUR.format(new Date())) return "Aujourd’hui";
  if (jour === JOUR.format(new Date(Date.now() - 86_400_000))) return "Hier";
  return DATE.format(d);
}

/** Heure pour un message du jour, sinon la date courte : pour la liste des conversations. */
function quandCourt(d: Date): string {
  const jour = libelleJour(d);
  return jour === "Aujourd’hui" ? heure(d) : jour === "Hier" ? "Hier" : DATE.format(d);
}

export type Interlocuteur = {
  userId: number | null;
  firstName: string;
  lastName: string;
  name: string;
  hue: number;
  photo?: string;
  role: string;
  company: string;
  sector?: string;
  city?: string;
  country?: string;
  bio?: string;
};

export type MessageVue = { id: string; fromMe: boolean; text: string; time: string; jour: string; iso: string; audio?: { src: string; seconds: number } };

export type ConversationResume = {
  id: string;
  /** Conversation avec l'équipe CanCham. */
  equipe: boolean;
  name: string;
  firstName: string;
  lastName: string;
  hue: number;
  photo?: string;
  company: string;
  lastText: string;
  lastFromMe: boolean;
  lastWhen: string;
  /** Date ISO du dernier message. */
  lastIso: string;
  unread: number;
};

const EQUIPE: Interlocuteur = { userId: null, firstName: "Équipe", lastName: "CanCham", name: "Équipe CanCham", hue: 0, photo: SIGLE, role: "Organisation de La Traversée", company: "CanCham Madagascar" };

const selectionPersonne = { id: true, firstName: true, lastName: true, role: true, company: true, sector: true, city: true, country: true, bio: true, photo: true } as const;
type Personne = Prisma.UserGetPayload<{ select: typeof selectionPersonne }>;

function interlocuteur(u: Personne | null | undefined): Interlocuteur {
  if (!u) return { userId: null, firstName: "Compte", lastName: "supprimé", name: "Compte supprimé", hue: 0, role: "", company: "" };
  return {
    userId: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    name: `${u.firstName} ${u.lastName}`.trim(),
    hue: (u.id * 47) % 360,
    photo: u.photo ?? undefined,
    role: u.role ?? "",
    company: u.company ?? "",
    sector: u.sector ?? undefined,
    city: u.city ?? undefined,
    country: u.country === "CA" ? "Canada" : u.country ? "Madagascar" : undefined,
    bio: u.bio ?? undefined,
  };
}

const selectionMessage = { id: true, auteurId: true, texte: true, audio: true, audioSecondes: true, creeLe: true } as const;
type LigneMessage = Prisma.MessageGetPayload<{ select: typeof selectionMessage }>;

export function vueMessage(m: LigneMessage, deMoi: (auteurId: number) => boolean): MessageVue {
  return {
    id: m.id,
    fromMe: deMoi(m.auteurId),
    text: m.audio ? "Message vocal" : m.texte,
    time: heure(m.creeLe),
    jour: libelleJour(m.creeLe),
    iso: m.creeLe.toISOString(),
    ...(m.audio ? { audio: { src: m.audio, seconds: m.audioSecondes ?? 1 } } : {}),
  };
}

const apercu = (m: { texte: string; audio: string | null }) => (m.audio ? "Message vocal" : m.texte);

// ——— Création ———

async function obtenir(cle: string, equipe: boolean, membres: number[]): Promise<string> {
  const existante = await prisma.conversation.findUnique({ where: { cle }, select: { id: true } });
  if (existante) return existante.id;
  try {
    const creee = await prisma.conversation.create({ data: { cle, equipe, participants: { create: membres.map((userId) => ({ userId })) } }, select: { id: true } });
    return creee.id;
  } catch (e) {
    // Deux ouvertures simultanées : la conversation vient d'être créée par l'autre requête.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const deja = await prisma.conversation.findUnique({ where: { cle }, select: { id: true } });
      if (deja) return deja.id;
    }
    throw e;
  }
}

export const obtenirConversationDirecte = (moi: number, autre: number) => obtenir(cleDirecte(moi, autre), false, [moi, autre]);
export const obtenirConversationEquipe = (membre: number) => obtenir(cleEquipe(membre), true, [membre]);

// ——— Listes et non-lus ———

/** Conversations d'un compte (côté membre), les plus récentes d'abord, avec le nombre de messages non lus. */
export async function listeConversations(moi: number): Promise<ConversationResume[]> {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: moi } }, messages: { some: {} } },
    orderBy: { dernierMessage: "desc" },
    select: {
      id: true,
      equipe: true,
      participants: { select: { userId: true, user: { select: selectionPersonne } } },
      messages: { orderBy: { creeLe: "desc" }, take: 1, select: { auteurId: true, texte: true, audio: true, creeLe: true } },
    },
  });
  const nonLus = await nonLusParConversation(moi);
  return conversations.map((c) => {
    const autre = c.equipe ? EQUIPE : interlocuteur(c.participants.find((p) => p.userId !== moi)?.user);
    const dernier = c.messages[0];
    return {
      id: c.id,
      equipe: c.equipe,
      name: autre.name,
      firstName: autre.firstName,
      lastName: autre.lastName,
      hue: autre.hue,
      photo: autre.photo,
      company: autre.company,
      lastText: apercu(dernier),
      lastFromMe: dernier.auteurId === moi,
      lastWhen: quandCourt(dernier.creeLe),
      lastIso: dernier.creeLe.toISOString(),
      unread: nonLus.get(c.id) ?? 0,
    };
  });
}

async function nonLusParConversation(moi: number): Promise<Map<string, number>> {
  const lignes = await prisma.$queryRaw<{ conversation_id: string; n: bigint }[]>`
    SELECT m.conversation_id, COUNT(*) AS n
    FROM messages m
    JOIN conversation_participants p ON p.conversation_id = m.conversation_id AND p.user_id = ${moi}
    WHERE m.auteur_id <> ${moi} AND (p.lu_le IS NULL OR m.cree_le > p.lu_le)
    GROUP BY m.conversation_id`;
  return new Map(lignes.map((l) => [l.conversation_id, Number(l.n)]));
}

export async function nonLusMembre(moi: number): Promise<number> {
  let total = 0;
  for (const n of (await nonLusParConversation(moi)).values()) total += n;
  return total;
}

/** Messages des participants que l'équipe n'a pas encore lus, par conversation. */
async function nonLusEquipeParConversation(): Promise<Map<string, number>> {
  const lignes = await prisma.$queryRaw<{ conversation_id: string; n: bigint }[]>`
    SELECT m.conversation_id, COUNT(*) AS n
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id AND c.equipe
    JOIN conversation_participants p ON p.conversation_id = c.id AND p.user_id = m.auteur_id
    WHERE c.equipe_lu_le IS NULL OR m.cree_le > c.equipe_lu_le
    GROUP BY m.conversation_id`;
  return new Map(lignes.map((l) => [l.conversation_id, Number(l.n)]));
}

export async function nonLusEquipe(): Promise<number> {
  let total = 0;
  for (const n of (await nonLusEquipeParConversation()).values()) total += n;
  return total;
}

/** Boîte de l'équipe (back-office) : conversations des participants avec l'équipe. */
export async function listeEquipe(): Promise<ConversationResume[]> {
  const conversations = await prisma.conversation.findMany({
    where: { equipe: true, messages: { some: {} } },
    orderBy: { dernierMessage: "desc" },
    select: {
      id: true,
      participants: { take: 1, select: { userId: true, user: { select: selectionPersonne } } },
      messages: { orderBy: { creeLe: "desc" }, take: 1, select: { auteurId: true, texte: true, audio: true, creeLe: true } },
    },
  });
  const nonLus = await nonLusEquipeParConversation();
  return conversations.map((c) => {
    const membre = c.participants[0];
    const p = interlocuteur(membre?.user);
    const dernier = c.messages[0];
    return {
      id: c.id,
      equipe: true,
      name: p.name,
      firstName: p.firstName,
      lastName: p.lastName,
      hue: p.hue,
      photo: p.photo,
      company: p.company,
      lastText: apercu(dernier),
      lastFromMe: dernier.auteurId !== membre?.userId,
      lastWhen: quandCourt(dernier.creeLe),
      lastIso: dernier.creeLe.toISOString(),
      unread: nonLus.get(c.id) ?? 0,
    };
  });
}

/** Participants à qui écrire : comptes membres validés (pas soi-même). */
export async function contacts(moi: number) {
  const users = await prisma.user.findMany({
    where: { acces: "MEMBRE", statut: "ACTIF", id: { not: moi } },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true, company: true, photo: true },
  });
  return users.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), company: u.company ?? "", photo: u.photo ?? undefined }));
}

// ——— Accès, fil et lecture ———

type Conv = { id: string; equipe: boolean; equipeLuLe: Date | null; participants: { userId: number; luLe: Date | null; user: Personne }[] };

/**
 * Conversation vue d'un côté : « membre » (le compte y participe) ou « equipe » (administrateur, conversation avec l'équipe).
 * Renvoie null si le compte n'y a pas accès.
 */
export async function accesConversation(conversationId: string, user: { id: number; acces: string }, cote: Cote): Promise<Conv | null> {
  if (typeof conversationId !== "string" || conversationId.length > 40) return null;
  const c = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, equipe: true, equipeLuLe: true, participants: { select: { userId: true, luLe: true, user: { select: selectionPersonne } } } },
  });
  if (!c) return null;
  if (cote === "membre") return c.participants.some((p) => p.userId === user.id) ? c : null;
  return c.equipe && user.acces === "ADMIN" ? c : null;
}

/** Qui est « moi » dans cette conversation : côté équipe, tout message qui n'est pas du participant. */
export function auteurEstMoi(c: Conv, user: { id: number }, cote: Cote) {
  if (cote === "equipe") {
    const membre = c.participants[0]?.userId;
    return (auteurId: number) => auteurId !== membre;
  }
  return (auteurId: number) => auteurId === user.id;
}

/** Jusqu'où l'autre côté a lu (pour « Vu »). */
export function luParLAutre(c: Conv, user: { id: number }, cote: Cote): Date | null {
  if (cote === "equipe") return c.participants[0]?.luLe ?? null;
  if (c.equipe) return c.equipeLuLe;
  return c.participants.find((p) => p.userId !== user.id)?.luLe ?? null;
}

export function interlocuteurDe(c: Conv, user: { id: number }, cote: Cote): Interlocuteur {
  if (cote === "equipe") return interlocuteur(c.participants[0]?.user);
  if (c.equipe) return EQUIPE;
  return interlocuteur(c.participants.find((p) => p.userId !== user.id)?.user);
}

export async function marquerLu(c: Conv, user: { id: number }, cote: Cote): Promise<void> {
  const maintenant = new Date();
  if (cote === "equipe") await prisma.conversation.update({ where: { id: c.id }, data: { equipeLuLe: maintenant } });
  else await prisma.participantConversation.update({ where: { conversationId_userId: { conversationId: c.id, userId: user.id } }, data: { luLe: maintenant } });
}

export async function messagesDe(conversationId: string, deMoi: (auteurId: number) => boolean, apres?: Date): Promise<MessageVue[]> {
  const lignes = await prisma.message.findMany({
    where: { conversationId, ...(apres ? { creeLe: { gt: apres } } : {}) },
    orderBy: { creeLe: apres ? "asc" : "desc" },
    take: apres ? 200 : 300,
    select: selectionMessage,
  });
  if (!apres) lignes.reverse();
  return lignes.map((m) => vueMessage(m, deMoi));
}

export async function ajouterMessage(c: Conv, auteurId: number, data: { texte?: string; audio?: string; audioSecondes?: number }) {
  const m = await prisma.message.create({ data: { conversationId: c.id, auteurId, texte: data.texte ?? "", audio: data.audio, audioSecondes: data.audioSecondes }, select: selectionMessage });
  await prisma.conversation.update({ where: { id: c.id }, data: { dernierMessage: m.creeLe } });
  return m;
}

/** À la suppression d'un compte : ses conversations (et leurs vocaux) disparaissent avec lui. */
export async function supprimerConversationsDe(userId: number): Promise<void> {
  const conversations = await prisma.conversation.findMany({ where: { participants: { some: { userId } } }, select: { id: true } });
  const ids = conversations.map((c) => c.id);
  const vocaux = await prisma.message.findMany({ where: { OR: [{ conversationId: { in: ids } }, { auteurId: userId }], audio: { not: null } }, select: { audio: true } });
  await prisma.conversation.deleteMany({ where: { id: { in: ids } } });
  await effacerAudios(vocaux.map((v) => v.audio));
}
