import { conversations, fullName, personById } from "@/lib/mock/data";
import { CRENEAUX, LIEUX } from "./data";
import type { Annonce, TraverseeState, TypeNotif } from "./store";

export type Notif = {
  id: string;
  type: TypeNotif;
  titre: string;
  texte: string;
  href: string;
  t?: number;
  quand?: string;
  acteur?: string;
  annonce?: Annonce;
  lue: boolean;
};

export type CompteRecent = { id: number; nom: string; entreprise: string | null; acces: "MEMBRE" | "ADMIN"; enAttente?: boolean; t: number };

const MINUTE = 60_000;

const lue = (s: TraverseeState, id: string) => !!s.notifsLues[id];

function trier(liste: Notif[]): Notif[] {
  return liste.sort((a, b) => (b.t ?? 0) - (a.t ?? 0));
}

function duJournal(s: TraverseeState, pour: "admin" | "participant"): Notif[] {
  return s.journal
    .filter((e) => e.pour === pour)
    .map((e) => ({ id: e.id, type: e.type, titre: e.titre, texte: e.texte, href: e.href, t: e.t, acteur: e.acteur, lue: lue(s, e.id) }));
}

export function notificationsParticipant(s: TraverseeState, o: { maintenant: number; creeLe?: string | null }): Notif[] {
  const liste = duJournal(s, "participant");

  for (const a of s.annonces) {
    const id = `ann-${a.id}`;
    liste.push({ id, type: "annonce", titre: a.titre, texte: a.message, href: "/", t: a.t, annonce: a, lue: !!s.annoncesVues[a.id] || lue(s, id) });
  }

  for (const c of conversations) {
    if (!c.unread) continue;
    const p = personById(c.participantId);
    const dernier = c.messages[c.messages.length - 1];
    const id = `msg-${c.id}-${dernier.id}`;
    const nom = fullName(p);
    liste.push({
      id,
      type: "message",
      titre: c.unread > 1 ? `${nom} vous a envoyé ${c.unread} messages` : `${nom} vous a écrit`,
      texte: dernier.text,
      href: `/messages/${c.id}`,
      t: o.maintenant - dernier.minutesAgo * MINUTE,
      acteur: nom,
      lue: lue(s, id),
    });
  }

  for (const d of s.demandes) {
    const id = `rdv-${d.id}`;
    const [nom] = d.avec.split(" · ");
    const quand = [CRENEAUX[d.ci], LIEUX[d.li]?.nom].filter(Boolean).join(", ");
    liste.push({ id, type: "rdv", titre: `${d.avec} vous propose un rendez-vous`, texte: quand ? `${quand} · 20 minutes` : "Créneau de 20 minutes", href: "/rdv", quand: "À valider", acteur: nom, lue: lue(s, id) });
  }

  if (o.creeLe) {
    liste.push({ id: "bienvenue", type: "compte", titre: "Bienvenue sur La Traversée", texte: "Votre compte est créé. Complétez votre profil pour apparaître dans l’annuaire.", href: "/profil", t: Date.parse(o.creeLe), lue: lue(s, "bienvenue") });
  }

  return trier(liste);
}

export function notificationsAdmin(s: TraverseeState, o: { comptes: CompteRecent[]; moi?: number }): Notif[] {
  const liste = duJournal(s, "admin");

  for (const c of s.aconv) {
    const dernier = c.m[c.m.length - 1];
    if (!dernier || dernier.de !== "eux") continue;
    const id = `aconv-${c.id}-${c.m.length}`;
    liste.push({ id, type: "message", titre: `${c.nom} · ${c.ent} vous a écrit`, texte: dernier.texte, href: `/admin/messagerie/${c.id}`, quand: dernier.h, acteur: c.nom, lue: lue(s, id) });
  }

  for (const c of o.comptes) {
    if (c.id === o.moi) continue;
    const id = `compte-${c.id}`;
    liste.push({
      id,
      type: "compte",
      titre: c.acces === "ADMIN" ? `${c.nom} a un compte administrateur` : `${c.nom} a créé son compte`,
      texte: c.enAttente
        ? `${c.entreprise ? `${c.entreprise} · ` : ""}inscription à valider`
        : c.entreprise
          ? `${c.entreprise} · nouvel inscrit sur la plateforme`
          : "Nouvel inscrit sur la plateforme",
      href: c.enAttente ? "/admin/acces" : "/admin/participants",
      t: c.t,
      acteur: c.nom,
      lue: lue(s, id),
    });
  }

  return trier(liste);
}
