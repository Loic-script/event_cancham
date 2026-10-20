import type { Courriel } from "@/lib/courriel";
import { DUREE_LIEN_MINUTES } from "@/lib/reinitialisation";

/** Modèles des e-mails envoyés par la plateforme (texte brut et HTML, mêmes informations). */

const echapper = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

const DISCRET = "color:#5b6b7a;font-size:13px";

function bouton(lien: string, libelle: string) {
  return `<p style="margin:24px 0"><a href="${echapper(lien)}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#c94d0c;color:#ffffff;font-weight:bold;text-decoration:none">${echapper(libelle)}</a></p>`;
}

const page = (contenu: string) => `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0f1d2c;max-width:560px">${contenu}</div>`;

const p = (texte: string, style = "") => `<p${style ? ` style="${style}"` : ""}>${echapper(texte)}</p>`;

function tableau(lignes: [string, string][]) {
  const cellules = lignes.map(([cle, valeur]) => `<tr><td style="padding:4px 16px 4px 0;color:#5b6b7a;white-space:nowrap">${echapper(cle)}</td><td style="padding:4px 0"><b>${echapper(valeur)}</b></td></tr>`).join("");
  return `<table style="border-collapse:collapse;margin:12px 0">${cellules}</table>`;
}

/** Mot de passe seul sur sa ligne, en police à chasse fixe : un triple clic le sélectionne sans rien autour. */
function blocMotDePasse(libelle: string, motDePasse: string) {
  return `<p style="margin:16px 0 4px;color:#5b6b7a">${echapper(libelle)}</p><p style="display:inline-block;margin:0 0 8px;padding:10px 16px;border:1px solid #e1e7ee;border-radius:8px;background:#f4f6f9;font-family:Consolas,Menlo,monospace;font-size:20px;font-weight:bold;letter-spacing:0.06em">${echapper(motDePasse)}</p>`;
}

const bonjour = (prenom: string) => (prenom.trim() ? `Bonjour ${prenom.trim()},` : "Bonjour,");

export function courrielReinitialisation(email: string, prenom: string, lien: string): Courriel {
  return {
    a: email,
    sujet: "Choisissez un nouveau mot de passe – La Traversée",
    texte: `${bonjour(prenom)}\n\nVous avez demandé à changer le mot de passe de votre compte La Traversée (${email}).\nOuvrez ce lien pour en choisir un nouveau (valable ${DUREE_LIEN_MINUTES} minutes, une seule fois) :\n\n${lien}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.\n\nL’équipe CanCham Madagascar`,
    html: page(
      p(bonjour(prenom)) +
        p(`Vous avez demandé à changer le mot de passe de votre compte La Traversée (${email}).`) +
        bouton(lien, "Choisir un nouveau mot de passe") +
        `<p style="${DISCRET}">Ce lien est valable ${DUREE_LIEN_MINUTES} minutes et ne sert qu’une fois. Si le bouton ne marche pas, copiez cette adresse dans votre navigateur :<br><span style="word-break:break-all">${echapper(lien)}</span></p>` +
        p("Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.", DISCRET) +
        p("L’équipe CanCham Madagascar"),
    ),
  };
}

export type Inscrit = { firstName: string; lastName: string; email: string; company: string | null; role: string | null; phone: string | null; via: string };

/** Aux administrateurs : une personne vient de s'inscrire et attend la validation de son accès. */
export function courrielNouvelleInscription(u: Inscrit, admins: string[], base: string | null): Courriel {
  const nom = `${u.firstName} ${u.lastName}`.trim() || u.email;
  const lignes: [string, string][] = [
    ["Nom", nom],
    ["Entreprise", u.company || "—"],
    ["Rôle", u.role || "—"],
    ["E-mail", u.email],
    ["Téléphone", u.phone || "—"],
    ["Inscription", u.via],
  ];
  const lien = base ? `${base}/admin/acces` : null;
  const ouSeRendre = lien ? `Pour donner l’accès ou refuser : ${lien}` : "Pour donner l’accès ou refuser : back-office › Participants › Demandes d’accès.";
  return {
    a: admins,
    sujet: `Nouvelle inscription : ${nom}${u.company ? ` (${u.company})` : ""}`,
    texte: `Bonjour,\n\nUne nouvelle personne s’est inscrite à La Traversée et attend la validation de son accès.\n\n${lignes.map(([c, v]) => `${c} : ${v}`).join("\n")}\n\n${ouSeRendre}\n\nMessage automatique de la plateforme La Traversée.`,
    html: page(
      p("Bonjour,") +
        p("Une nouvelle personne s’est inscrite à La Traversée et attend la validation de son accès.") +
        tableau(lignes) +
        (lien ? bouton(lien, "Donner l’accès ou refuser") : p("Pour donner l’accès ou refuser : back-office › Participants › Demandes d’accès.")) +
        p("Message automatique de la plateforme La Traversée.", DISCRET),
    ),
  };
}

/** Au nouvel administrateur : ses identifiants, avec un mot de passe provisoire à changer. */
export function courrielNouvelAdmin(d: { email: string; prenom: string; createur: string; motDePasse: string; base: string }): Courriel {
  const lien = `${d.base}/connexion`;
  return {
    a: d.email,
    sujet: "Votre accès administrateur à La Traversée",
    texte: `${bonjour(d.prenom)}\n\n${d.createur} vous a créé un compte administrateur sur La Traversée, la plateforme du gala des 10 ans de CanCham Madagascar.\n\nAdresse e-mail : ${d.email}\nMot de passe provisoire : ${d.motDePasse}\n\nConnexion : ${lien}\n\nAprès votre première connexion, choisissez votre propre mot de passe dans « Mon compte » (back-office), puis supprimez cet e-mail.\n\nL’équipe CanCham Madagascar`,
    html: page(
      p(bonjour(d.prenom)) +
        p(`${d.createur} vous a créé un compte administrateur sur La Traversée, la plateforme du gala des 10 ans de CanCham Madagascar.`) +
        tableau([["Adresse e-mail", d.email]]) +
        blocMotDePasse("Mot de passe provisoire", d.motDePasse) +
        bouton(lien, "Se connecter") +
        p("Après votre première connexion, choisissez votre propre mot de passe dans « Mon compte » (back-office), puis supprimez cet e-mail.", DISCRET) +
        p("L’équipe CanCham Madagascar"),
    ),
  };
}

/** À un membre devenu administrateur : un nouveau mot de passe tiré au hasard remplace l'ancien. */
export function courrielPromotionAdmin(d: { email: string; prenom: string; createur: string; motDePasse: string; base: string }): Courriel {
  const lien = `${d.base}/connexion`;
  return {
    a: d.email,
    sujet: "Vous êtes maintenant administrateur de La Traversée",
    texte: `${bonjour(d.prenom)}\n\n${d.createur} vous a donné les droits d’administrateur sur La Traversée. Voici vos identifiants pour vous connecter ; ce mot de passe remplace l’ancien.\n\nAdresse e-mail : ${d.email}\nMot de passe : ${d.motDePasse}\n\nConnexion : ${lien}\n\nVous pourrez le changer dans « Mon compte » (back-office), puis supprimer cet e-mail.\n\nL’équipe CanCham Madagascar`,
    html: page(
      p(bonjour(d.prenom)) +
        p(`${d.createur} vous a donné les droits d’administrateur sur La Traversée. Voici vos identifiants pour vous connecter ; ce mot de passe remplace l’ancien.`) +
        tableau([["Adresse e-mail", d.email]]) +
        blocMotDePasse("Mot de passe", d.motDePasse) +
        bouton(lien, "Se connecter") +
        p("Vous pourrez le changer dans « Mon compte » (back-office), puis supprimer cet e-mail.", DISCRET) +
        p("L’équipe CanCham Madagascar"),
    ),
  };
}
