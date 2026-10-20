import type { MessageNonLu } from "@/app/api/messages/non-lus/route";
import type { Activite } from "@/lib/activite";
import type { AnnonceVue } from "@/lib/annonces";
import type { NotifRdv } from "@/lib/rendezvous";
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

const lue = (s: TraverseeState, id: string) => !!s.notifsLues[id];

function trier(liste: Notif[]): Notif[] {
  return liste.sort((a, b) => (b.t ?? 0) - (a.t ?? 0));
}

/** Conversations non lues (messagerie en base) : une notification par conversation, jusqu'au prochain message. */
function depuisMessages(s: TraverseeState, messages: MessageNonLu[]): Notif[] {
  return messages.map((m) => {
    const id = `msg-${m.id}-${m.t}`;
    return { id, type: "message", titre: m.nonLus > 1 ? `${m.nom} vous a envoyé ${m.nonLus} messages` : `${m.nom} vous a écrit`, texte: m.texte, href: m.href, t: m.t, acteur: m.nom, lue: lue(s, id) };
  });
}

/** Activité tirée de la base (publications, défis, livre d'or, photos, stories). */
function depuisActivite(s: TraverseeState, activite: Activite[]): Notif[] {
  return activite.map((e) => ({ id: e.id, type: e.type, titre: e.titre, texte: e.texte, href: e.href, t: e.t, acteur: e.acteur, lue: lue(s, e.id) }));
}

export function notificationsParticipant(s: TraverseeState, o: { maintenant: number; creeLe?: string | null; messages: MessageNonLu[]; annonces: AnnonceVue[]; rdv: NotifRdv[]; activite: Activite[] }): Notif[] {
  const liste = depuisActivite(s, o.activite);

  for (const a of o.annonces) {
    const id = `ann-${a.id}`;
    liste.push({ id, type: "annonce", titre: a.titre, texte: a.message, href: "/", t: a.t, annonce: a, lue: a.vue || lue(s, id) });
  }

  liste.push(...depuisMessages(s, o.messages));

  for (const r of o.rdv) {
    const id = `rdv-${r.id}`;
    const qui = r.ent ? `${r.nom} · ${r.ent}` : r.nom;
    if (r.genre === "demande") liste.push({ id, type: "rdv", titre: `${qui} vous propose un rendez-vous`, texte: `${r.quand} · 20 minutes`, href: "/rdv", t: r.t, quand: "À valider", acteur: r.nom, lue: lue(s, id) });
    else if (r.genre === "confirme") liste.push({ id, type: "rdv", titre: `${r.nom} a validé votre rendez-vous`, texte: `${r.quand} · 20 minutes`, href: "/rdv", t: r.t, acteur: r.nom, lue: lue(s, id) });
    else liste.push({ id, type: "rdv", titre: `${r.nom} a décliné votre demande de rendez-vous`, texte: "L’emplacement est libéré : proposez un autre créneau.", href: "/rdv", t: r.t, acteur: r.nom, lue: lue(s, id) });
  }

  if (o.creeLe) {
    liste.push({ id: "bienvenue", type: "compte", titre: "Bienvenue sur La Traversée", texte: "Votre compte est créé. Complétez votre profil pour apparaître dans l’annuaire.", href: "/profil", t: Date.parse(o.creeLe), lue: lue(s, "bienvenue") });
  }

  return trier(liste);
}

export function notificationsAdmin(s: TraverseeState, o: { comptes: CompteRecent[]; moi?: number; messages: MessageNonLu[]; activite: Activite[] }): Notif[] {
  const liste = depuisActivite(s, o.activite);

  liste.push(...depuisMessages(s, o.messages));

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
