import { event } from "@/lib/evenement";

export const IMG = (name: string) => `/traversee/${name}.jpg`;
export const LOGO_BLANC = "/impact261/logo-blanc.svg";
export const LOGO_CANCHAM_BLANC = "/cancham/logo-blanc.png";
/** Version PNG du logo blanc, pour le dessin dans un canvas (affiche des défis). */
export const LOGO_BLANC_PNG = "/impact261/logo-blanc.png";
export const SIGLE = "/impact261/pictogramme.svg";
export const DIX_ANS = "/traversee/10-ans.png";

export const DATE_LABEL = "Vendredi 18 décembre 2026";
export const LIEU = event.venue;
export const LIEU_LONG = `${event.venue}, ${event.city}`;
export const LIEN_INSCRIPTION = "https://cancham.mg/la-traversee";
export const PAGE_FACEBOOK = "https://www.facebook.com/canchammadagascar";

export type ProgCat = "Expositions" | "Panels" | "Réseautage" | "Gala";
export const CATS: ProgCat[] = ["Expositions", "Panels", "Réseautage", "Gala"];
export const IMAGES = ["accueil", "pitch", "groupe", "ecran", "rdv", "formation", "public", "reseau", "musique", "hero", "salle", "diner", "equipe", "oratrice", "assistance"];

export const SECTEURS = ["Agroalimentaire", "Conseil", "Finance", "Logistique", "Numérique", "Textile", "Tourisme", "Autre"];

export const ROLES = ["Directrice générale", "Directeur commercial", "Responsable export", "Directrice financière", "Responsable marketing", "Gérant", "Fondatrice", "Chargé de développement"];

export type Actu = { id: string; tag: string; date: string; img: string; t: string; x: string; n: number; c: number };
export const ACTUS: Actu[] = [
  { id: "cmubrm6xs000301nqohq96wsz", tag: "Vie de la chambre", date: "22 septembre 2026", img: "actu-3cc8a4e1", t: "MECC 8 restituée, MECC 9 lancée : la mission continue", x: "MECC 8, restituée. MECC 9, lancée. Entre les deux, pas de pause. Juste la suite logique d’un travail qui avance.", n: 24, c: 3 },
  { id: "cmujnq3vx000101lhekif7lt1", tag: "Vie de la chambre", date: "25 mai 2026", img: "actu-cb529212", t: "Desjardins, le plus grand groupe financier coopératif d’Amérique du Nord.", x: "Depuis plus de 120 ans, Desjardins accompagne des millions de particuliers, d’entrepreneurs et d’organisations en offrant une vaste gamme de services financiers : comptes bancaires, financement, investissement, assurances et accompagnement au développement des entreprises.", n: 18, c: 2 },
  { id: "cmujnvjt8000301lhx1aybw3b", tag: "Vie de la chambre", date: "22 mai 2026", img: "actu-7c37480c", t: "35 personnes. Une délégation au Canada. Et beaucoup plus qu’une mission économique.", x: "Cette 8ème édition de la MECC s’est achevée, et nous prenons le temps de partager ce moment avec vous.", n: 41, c: 6 },
  { id: "cmujo0uy8000601lhvpcvq0px", tag: "Vie de la chambre", date: "2 mai 2026", img: "actu-36add624", t: "Une journée de rencontres, de découvertes et de connexions !", x: "Aujourd’hui, nous avons pu rassembler la diaspora malgache, les participants de la mission et des entrepreneurs canadiens autour d’un objectif commun : créer du lien et ouvrir des opportunités concrètes.", n: 33, c: 4 },
];

export const CRENEAUX: string[] = [];
for (let hh = 10; hh < 17; hh++) for (let mm = 0; mm < 60; mm += 20) CRENEAUX.push(`${hh} h ${String(mm).padStart(2, "0")}`);
export const LIEUX = [
  { nom: "Espace B2B A", desc: "Premier emplacement" },
  { nom: "Espace B2B B", desc: "Deuxième emplacement" },
  { nom: "Espace B2B C", desc: "Troisième emplacement" },
];

export function ajusteSousTitres(src: string) {
  let t = String(src || "").replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").replace(/([,;:!?])(?=\S)/g, "$1 ").trim();
  t = t.replace(/\bcancham\b/gi, "CanCham").replace(/\bc etait\b/gi, "c’était").replace(/\bsoiree\b/gi, "soirée").replace(/\btres\b/gi, "très").replace(/\bmerci a\b/gi, "merci à");
  t = t.replace(/(^|[.!?]\s+)([a-zàâçéèêëîïôûùüÿœ])/g, (_, a: string, b: string) => a + b.toUpperCase());
  if (t && !/[.!?…]$/.test(t)) t += ".";
  return t;
}

export const LEGENDE_JY_SERAI = `J’y serai ! La Traversée, pour les 10 ans de la Chambre de Commerce et de Coopération Canada Madagascar, vendredi 18 décembre à ${LIEU_LONG}. Inscrivez-vous sur ce lien : ${LIEN_INSCRIPTION} #JySerai @canchammadagascar`;

export type AnnonceType = "info" | "programme" | "urgent";
export const TYPES_ANNONCE: Record<AnnonceType, string> = { info: "Information", programme: "Programme", urgent: "Important" };
export const DESTINATIONS: { href: string; label: string; nom: string }[] = [
  { href: "/", label: "Voir l’accueil", nom: "Accueil" },
  { href: "/programme", label: "Voir le programme", nom: "Programme" },
  { href: "/defis/pitch", label: "Voir les défis", nom: "Gagnez un voyage au Canada" },
  { href: "/defis/tombola", label: "Voir le défi 3 000 000 Ar", nom: "Gagnez 3 000 000 Ar" },
  { href: "/annuaire", label: "Voir l’annuaire", nom: "Annuaire" },
  { href: "/rdv", label: "Mes rendez-vous", nom: "Mes rendez-vous" },
  { href: "/messages", label: "Écrire à l’équipe", nom: "Messagerie" },
  { href: "/ressources", label: "Voir les ressources", nom: "Ressources" },
  { href: "/photos", label: "Voir les photos", nom: "Photos et vidéos" },
  { href: "/profil", label: "Mon profil", nom: "Profil" },
];
export const MODELES_ANNONCE: { titre: string; message: string; type: AnnonceType; cta: string }[] = [
  { titre: "Le 5 à 7 commence", message: "Rejoignez-nous à l’espace réseautage : le 5 à 7 démarre maintenant.", type: "programme", cta: "/programme" },
  { titre: "Le Gala ouvre ses portes", message: "Les portes du Gala des 10 ans sont ouvertes. Retrouvez le déroulé de la soirée dans le programme.", type: "info", cta: "/programme" },
  { titre: "Finale des pitchs : votez", message: "Les trois finalistes sont sur scène. Votez maintenant pour le grand gagnant.", type: "urgent", cta: "/defis/pitch" },
];

export function heureAnn(t: number) {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} à ${p(d.getHours())} h ${p(d.getMinutes())}`;
}
