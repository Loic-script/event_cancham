// Les trois défis du gala. Le texte en **gras** est mis en évidence à l'affichage.

export type ChallengeSlug = "jy-serai" | "pitch-mecc" | "jy-etais";
export type ChallengeKind = "photo" | "video";
export type ChallengeTheme = "leaf" | "navy" | "palm";

export type Challenge = {
  slug: ChallengeSlug;
  number: 1 | 2 | 3;
  phase: string;
  title: string;
  /** Mot géant en filigrane de la couverture. */
  word: string;
  prize: string;
  prizeNote: string;
  summary: string;
  steps: string[];
  notes: string[];
  kind: ChallengeKind;
  cta: string;
  theme: ChallengeTheme;
  participants: number;
  /** Avant cette date, le défi est verrouillé. */
  opensAt?: string;
  closesAt?: string;
  /** Réservé aux billets scannés à l'entrée du gala. */
  requiresScan?: boolean;
  /** Photo de couverture (chemin dans /public) ; sinon, une composition graphique. */
  coverImage?: string;
};

export const challenges: Challenge[] = [
  {
    slug: "jy-serai",
    number: 1,
    phase: "Avant le gala",
    title: "« J'y serai »",
    word: "J'y serai",
    prize: "5 000 000 Ar",
    prizeNote: "à gagner",
    summary: "Annoncez votre venue au gala sur les réseaux et faites réagir votre communauté.",
    steps: [
      "Publiez une photo de vous sur Facebook ou Instagram en taguant **@CanCham Madagascar** et en annonçant que vous serez au gala.",
      "Invitez votre réseau à réagir à votre publication.",
      "Ajoutez votre photo et le lien de votre publication ci-dessous pour valider votre participation.",
    ],
    notes: [
      "Relevé des réactions par l'équipe le **[date d'arrêt à fixer]**. Les comptes ou réactions suspects sont exclus. La publication doit rester publique jusqu'à l'annonce du gagnant pendant la soirée.",
    ],
    kind: "photo",
    cta: "Participer",
    theme: "leaf",
    participants: 128,
    closesAt: "2026-12-18T19:00:00+03:00",
  },
  {
    slug: "pitch-mecc",
    number: 2,
    phase: "Pitch MECC",
    title: "Gagnez une MECC tout inclus",
    word: "MECC",
    prize: "Une MECC tout inclus",
    prizeNote: "participation, billet d'avion, logement, per diem : tout est pris en charge par la CanCham",
    summary: "Déposez la vidéo de pitch de votre entreprise et décrochez une mission tout inclus.",
    steps: [
      "Déposez la vidéo de pitch de votre entreprise (**2 minutes maximum**) dans l'application.",
      "Le jury étudie toutes les candidatures et présélectionne 10 projets.",
      "Le 18 décembre, les 10 finalistes sont dévoilés dans l'application et le public vote pendant le gala. Le lauréat est annoncé sur scène.",
    ],
    notes: ["Une candidature par entreprise. La vidéo peut être filmée au téléphone : le fond compte plus que la forme. Date limite de dépôt à confirmer."],
    kind: "video",
    cta: "Déposer ma vidéo de pitch",
    theme: "navy",
    participants: 37,
  },
  {
    slug: "jy-etais",
    number: 3,
    phase: "Après le gala",
    title: "« J'y étais »",
    word: "J'y étais",
    prize: "5 000 000 Ar",
    prizeNote: "à gagner",
    summary: "Partagez votre plus belle photo de la soirée et récoltez le plus de réactions.",
    steps: [
      "Publiez une photo de vous prise pendant le gala, en taguant **@CanCham Madagascar**.",
      "Ajoutez votre photo et le lien de votre publication ici pour valider votre participation.",
      "La publication avec le plus de réactions au **28 décembre 2026 à 19 h** (J+10) l'emporte. Annonce en direct sur nos réseaux.",
    ],
    notes: ["Réservé aux participants dont le billet a été scanné à l'entrée du gala."],
    kind: "photo",
    cta: "Participer",
    theme: "palm",
    participants: 0,
    opensAt: "2026-12-18T19:00:00+03:00",
    closesAt: "2026-12-28T19:00:00+03:00",
    requiresScan: true,
  },
];

export type ChallengeStatus = { key: "open" | "locked" | "closed"; label: string };

const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Indian/Antananarivo" });
const longDateTime = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "numeric", timeZone: "Indian/Antananarivo" });

export function challengeStatus(c: Challenge, now = new Date()): ChallengeStatus {
  if (c.opensAt && new Date(c.opensAt) > now) return { key: "locked", label: `Ouvre le ${shortDate.format(new Date(c.opensAt))}` };
  if (c.closesAt && new Date(c.closesAt) < now) return { key: "closed", label: "Terminé" };
  return { key: "open", label: c.kind === "video" ? "Candidatures ouvertes" : "En cours" };
}

/** « 18 décembre à 19 h » */
export function opensAtLabel(c: Challenge): string {
  return c.opensAt ? longDateTime.format(new Date(c.opensAt)).replace(/\s(\d+)$/, " $1 h") : "";
}

/** « 28 décembre à 19 h », ou une chaîne vide si aucune clôture n'est fixée. */
export function closesAtLabel(c: Challenge): string {
  return c.closesAt ? longDateTime.format(new Date(c.closesAt)).replace(/\s(\d+)$/, " $1 h") : "";
}

export function challengeBySlug(slug: string): Challenge | undefined {
  return challenges.find((c) => c.slug === slug);
}
