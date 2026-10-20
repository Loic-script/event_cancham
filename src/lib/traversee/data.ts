import { event } from "@/lib/mock/data";

export const IMG = (name: string) => `/traversee/${name}.jpg`;
export const LOGO_BLANC = "/impact261/logo-blanc.svg";
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

export type Entreprise = { nom: string; secteur: string; activite: string };
export const ANNUAIRE: Entreprise[] = [
  { nom: "Atelier Vanille Rouge", secteur: "Agroalimentaire", activite: "Épices et vanille préparées pour l’export." },
  { nom: "Baobab Conseil", secteur: "Conseil", activite: "Accompagnement à l’export et études de marché." },
  { nom: "Hauts Plateaux Textile", secteur: "Textile", activite: "Confection et artisanat textile." },
  { nom: "Lagon Numérique", secteur: "Numérique", activite: "Développement web et applications." },
  { nom: "Tsara Logistique", secteur: "Logistique", activite: "Transit, fret aérien et maritime." },
  { nom: "Zébu Finance", secteur: "Finance", activite: "Financement des PME et microcrédit." },
  { nom: "Ravinala Tourisme", secteur: "Tourisme", activite: "Circuits et séjours d’affaires." },
  { nom: "Mada Cacao Fin", secteur: "Agroalimentaire", activite: "Chocolat et cacao de terroir." },
];
export const SECTEURS = ["Agroalimentaire", "Conseil", "Finance", "Logistique", "Numérique", "Textile", "Tourisme", "Autre"];

export const ROLES = ["Directrice générale", "Directeur commercial", "Responsable export", "Directrice financière", "Responsable marketing", "Gérant", "Fondatrice", "Chargé de développement"];
export const PRENOMS = ["Hery", "Lova", "Miora", "Tiana", "Fara", "Rado", "Vola", "Tojo", "Haja", "Soa", "Mamy", "Nirina"];
export const NOMS_FAMILLE = ["Rakoto", "Rabe", "Randria", "Rasoa", "Andria", "Razafy", "Ravelo", "Ratsimba", "Rajao"];

export type Personne = { nom: string; role: string; ent: string; sect: string; act: string; img: string };
export function personnes(): Personne[] {
  const bandeaux = ["salle", "ecran", "diner", "accueil", "assistance", "public", "hero", "rdv"];
  const l: Personne[] = [];
  for (let i = 0; i < 16; i++) {
    const e = ANNUAIRE[i % ANNUAIRE.length];
    l.push({
      nom: `${PRENOMS[(i * 5 + 3) % PRENOMS.length]} ${NOMS_FAMILLE[(i * 4 + 1) % NOMS_FAMILLE.length]}`,
      role: ROLES[(i * 3 + (i > 7 ? 1 : 0)) % ROLES.length],
      ent: e.nom,
      sect: e.secteur,
      act: e.activite,
      img: bandeaux[i % bandeaux.length],
    });
  }
  return l.sort((x, y) => (x.nom < y.nom ? -1 : 1));
}

export type Siege = { nom: string; ent: string; role: string; sect: string } | null;
export type Sieges = Record<number, Siege[]>;
export function siegesInitiaux(): Sieges {
  const s: Sieges = {};
  for (let n = 1; n <= 24; n++) {
    s[n] = [];
    const o = Math.min(10, (n * 7 + 3) % 12);
    for (let k = 0; k < 10; k++) {
      const e = ANNUAIRE[(n * 3 + k * 5) % ANNUAIRE.length];
      s[n].push(k < o ? { nom: `${PRENOMS[(n * 5 + k * 7) % PRENOMS.length]} ${NOMS_FAMILLE[(n * 2 + k * 3) % NOMS_FAMILLE.length]}`, ent: e.nom, role: ROLES[(n + k * 3) % ROLES.length], sect: e.secteur } : null);
    }
  }
  return s;
}
export function ouEst(n: number) {
  const rang = Math.ceil(n / 6);
  const col = (n - 1) % 6;
  return `Rang ${rang} depuis la scène, ${col < 2 ? "côté gauche" : col > 3 ? "côté droit" : "au centre"}`;
}

export type Actu = { id: string; tag: string; date: string; img: string; t: string; x: string; n: number; c: number };
export const ACTUS: Actu[] = [
  { id: "cmubrm6xs000301nqohq96wsz", tag: "Vie de la chambre", date: "22 septembre 2026", img: "actu-3cc8a4e1", t: "MECC 8 restituée, MECC 9 lancée : la mission continue", x: "MECC 8, restituée. MECC 9, lancée. Entre les deux, pas de pause. Juste la suite logique d’un travail qui avance.", n: 24, c: 3 },
  { id: "cmujnq3vx000101lhekif7lt1", tag: "Vie de la chambre", date: "25 mai 2026", img: "actu-cb529212", t: "Desjardins, le plus grand groupe financier coopératif d’Amérique du Nord.", x: "Depuis plus de 120 ans, Desjardins accompagne des millions de particuliers, d’entrepreneurs et d’organisations en offrant une vaste gamme de services financiers : comptes bancaires, financement, investissement, assurances et accompagnement au développement des entreprises.", n: 18, c: 2 },
  { id: "cmujnvjt8000301lhx1aybw3b", tag: "Vie de la chambre", date: "22 mai 2026", img: "actu-7c37480c", t: "35 personnes. Une délégation au Canada. Et beaucoup plus qu’une mission économique.", x: "Cette 8ème édition de la MECC s’est achevée, et nous prenons le temps de partager ce moment avec vous.", n: 41, c: 6 },
  { id: "cmujo0uy8000601lhvpcvq0px", tag: "Vie de la chambre", date: "2 mai 2026", img: "actu-36add624", t: "Une journée de rencontres, de découvertes et de connexions !", x: "Aujourd’hui, nous avons pu rassembler la diaspora malgache, les participants de la mission et des entrepreneurs canadiens autour d’un objectif commun : créer du lien et ouvrir des opportunités concrètes.", n: 33, c: 4 },
];

export type Produit = { id: string; nom: string; prix: number };
export const CARTE: { cat: string; items: Produit[] }[] = [
  { cat: "Boissons", items: [{ id: "eau", nom: "Eau minérale", prix: 5000 }, { id: "jus", nom: "Jus de fruits frais", prix: 10000 }, { id: "soda", nom: "Soda", prix: 8000 }, { id: "cafe", nom: "Café ou thé", prix: 6000 }, { id: "vin", nom: "Verre de vin", prix: 20000 }, { id: "cocktail", nom: "Cocktail maison", prix: 25000 }] },
  { cat: "Autres", items: [{ id: "coffret", nom: "Coffret souvenir La Traversée", prix: 80000 }, { id: "tirage", nom: "Tirage photo de la soirée", prix: 15000 }] },
];
export const PRODUITS: Record<string, Produit> = Object.fromEntries(CARTE.flatMap((c) => c.items).map((p) => [p.id, p]));
export const MOYENS = ["Carte bancaire", "MVola", "Orange Money", "Airtel Money"];
export function ar(n: number) {
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} Ar`;
}

export const CRENEAUX: string[] = [];
for (let hh = 10; hh < 17; hh++) for (let mm = 0; mm < 60; mm += 20) CRENEAUX.push(`${hh} h ${String(mm).padStart(2, "0")}`);
export const LIEUX = [
  { nom: "Espace B2B A", desc: "Premier emplacement" },
  { nom: "Espace B2B B", desc: "Deuxième emplacement" },
  { nom: "Espace B2B C", desc: "Troisième emplacement" },
];

export type Dossier = { nom: string; acces: string };
export type Ressource = { nom: string; type: "PDF" | "Image" | "Vidéo" | "Lien"; dossier: string; date: number };
export const DOSSIERS: Dossier[] = [
  { nom: "Kit du participant", acces: "Tous les participants" },
  { nom: "Défis", acces: "Tous les participants" },
];
export const RESSOURCES: Ressource[] = [
  { nom: "Guide du participant", type: "PDF", dossier: "Kit du participant", date: 20 },
  { nom: "Programme de la journée", type: "PDF", dossier: "Kit du participant", date: 19 },
  { nom: `Plan d’accès ${LIEU}`, type: "PDF", dossier: "Kit du participant", date: 18 },
  { nom: "Règlement des défis", type: "PDF", dossier: "Défis", date: 17 },
  { nom: "Template photo CanCham 10 ans", type: "Image", dossier: "Défis", date: 16 },
];

export type Souvenir = { id: string; img: string; duree: string; nom: string; texte: string; etat: "valide" | "attente" | "refuse"; moi?: boolean; vid?: string };
export const LIVRE: Souvenir[] = [
  { id: "l0", img: "diner", duree: "0:42", nom: "Participante · exemple", texte: "Dix ans de rencontres qui ont changé la trajectoire de notre entreprise. Merci à toute l’équipe.", etat: "valide" },
  { id: "l1", img: "ecran", duree: "1:05", nom: "Intervenante · exemple", texte: "Ce que je retiens de cette journée, c’est l’envie de construire ensemble, des deux côtés de l’océan.", etat: "valide" },
  { id: "l2", img: "salle", duree: "0:31", nom: "Équipe · exemple", texte: "Bravo à tous les exposants, et rendez-vous pour les dix prochaines années.", etat: "valide" },
  { id: "l9", img: "accueil", duree: "0:38", nom: "Participant · exemple", texte: "merci a la cancham pour cette soiree   c etait une tres belle rencontre ,on reviendra", etat: "attente" },
];
export function ajusteSousTitres(src: string) {
  let t = String(src || "").replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").replace(/([,;:!?])(?=\S)/g, "$1 ").trim();
  t = t.replace(/\bcancham\b/gi, "CanCham").replace(/\bc etait\b/gi, "c’était").replace(/\bsoiree\b/gi, "soirée").replace(/\btres\b/gi, "très").replace(/\bmerci a\b/gi, "merci à");
  t = t.replace(/(^|[.!?]\s+)([a-zàâçéèêëîïôûùüÿœ])/g, (_, a: string, b: string) => a + b.toUpperCase());
  if (t && !/[.!?…]$/.test(t)) t += ".";
  return t;
}

export type Demi = { ent: string; sect: string; desc: string; porteur: string };
export const DEMI: Demi[] = [
  { ent: "Atelier Vanille Rouge", sect: "Agroalimentaire", desc: "Épices et vanille préparées pour l’export.", porteur: "Hery Rabe" },
  { ent: "Baobab Conseil", sect: "Conseil", desc: "Accompagnement à l’export et études de marché.", porteur: "Lova Rakoto" },
  { ent: "Hauts Plateaux Textile", sect: "Textile", desc: "Confection et artisanat textile.", porteur: "Miora Randria" },
  { ent: "Lagon Numérique", sect: "Numérique", desc: "Développement web et applications.", porteur: "Tiana Razafy" },
  { ent: "Tsara Logistique", sect: "Logistique", desc: "Transit, fret aérien et maritime.", porteur: "Fara Ravelo" },
];
export const VOIX_INIT = [212, 187, 164, 151, 139];
export const VIGNETTES = ["salle", "ecran", "diner", "accueil", "assistance", "public", "hero", "rdv", "formation", "pitch"];
export const CLASSEMENT_INIT: { nom: string; reactions: number }[] = [
  { nom: "Baobab Conseil", reactions: 412 },
  { nom: "Lagon Numérique", reactions: 388 },
  { nom: "Mada Cacao Fin", reactions: 351 },
  { nom: "Tsara Logistique", reactions: 296 },
  { nom: "Ravinala Tourisme", reactions: 254 },
  { nom: "Zébu Finance", reactions: 201 },
  { nom: "Hauts Plateaux Textile", reactions: 173 },
];
export const LEGENDE_JY_SERAI = `J’y serai ! La Traversée, pour les 10 ans de la Chambre de Commerce et de Coopération Canada Madagascar, vendredi 18 décembre à ${LIEU_LONG}. Inscrivez-vous sur ce lien : ${LIEN_INSCRIPTION} #JySerai @canchammadagascar`;

export type Media = { id: string; src: string; video: boolean; par: "CanCham" | "vous"; moi: boolean };
const PHOTOS = ["hero", "accueil", "public", "reseau", "pitch", "musique", "groupe", "oratrice", "rdv", "equipe", "assistance", "diner", "formation", "salle", "ecran"];
export const GALERIE: Media[] = PHOTOS.map((p, i) => ({ id: `g${i}`, src: IMG(p), video: i === 5 || i === 12, par: "CanCham", moi: [0, 3, 8, 10].includes(i) }));

export type Story = { id: string; img: string; texte: string };
export const STORIES: Story[] = [
  { id: "s1", img: IMG("musique"), texte: "Rendez-vous le 18 décembre pour le Gala des 10 ans." },
  { id: "s2", img: IMG("pitch"), texte: "Gagnez un voyage au Canada : envoyez votre pitch avant le 11 décembre." },
  { id: "s3", img: IMG("reseau"), texte: "Réservez vos rendez-vous B2B depuis l’annuaire." },
];

export type Promo = { ann: string; titre: string; texte: string; img: string; lien: string };
export const PROMOS: Promo[] = [
  { ann: "Atelier Vanille Rouge", titre: "Retrouvez-nous sur notre stand", texte: "Épices et vanille préparées pour l’export.", img: IMG("diner"), lien: "/annuaire" },
  { ann: "Baobab Conseil", titre: "Un diagnostic export offert", texte: "Prenez rendez-vous pendant le 5 à 7.", img: IMG("rdv"), lien: "/rdv" },
  { ann: "Tsara Logistique", titre: "Votre fret vers le Canada", texte: "Transit, fret aérien et maritime.", img: IMG("accueil"), lien: "/annuaire" },
  { ann: "Zébu Finance", titre: "Financez votre premier conteneur", texte: "Solutions de financement pour les PME.", img: IMG("ecran"), lien: "/programme" },
];

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

export type Commande = { id: string; nom: string; t: number; q: string; m: number; moyen: string; p: "Payé" | "À régler"; e: "À servir" | "Servie" };
export const COMMANDES: Commande[] = [
  { id: "c1", nom: "Hery Rabe", t: 4, q: "2 × Jus de fruits frais, 1 × Café ou thé", m: 26000, moyen: "À table", p: "À régler", e: "À servir" },
  { id: "c2", nom: "Fara Rasoa", t: 11, q: "1 × Cocktail maison", m: 25000, moyen: "MVola", p: "Payé", e: "À servir" },
  { id: "c3", nom: "Tojo Andria", t: 7, q: "3 × Eau minérale", m: 15000, moyen: "Carte bancaire", p: "Payé", e: "Servie" },
  { id: "c4", nom: "Soa Ravelo", t: 18, q: "1 × Coffret souvenir La Traversée", m: 80000, moyen: "Orange Money", p: "Payé", e: "À servir" },
  { id: "c5", nom: "Rado Rakoto", t: 2, q: "2 × Verre de vin", m: 40000, moyen: "À table", p: "À régler", e: "Servie" },
];

export function initiales(nom: string) {
  return nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0].toUpperCase()).join("") || "?";
}
export function heureAnn(t: number) {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} à ${p(d.getHours())} h ${p(d.getMinutes())}`;
}
export function heureNow() {
  const h = new Date();
  return `${String(h.getHours()).padStart(2, "0")}:${String(h.getMinutes()).padStart(2, "0")}`;
}
