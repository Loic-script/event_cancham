/** L'événement : nom, dates et lieu affichés partout (connexion, billet, parcours d'accueil, accueil). */
export const event = {
  name: "La Traversée",
  edition: "Gala des 10 ans",
  organizer: "CanCham Madagascar",
  date: "2027-02-19T18:30:00+03:00",
  dateLabel: "Vendredi 19 février 2027",
  timeLabel: "18 h 30",
  venue: "CCI Ivato",
  city: "Antananarivo",
  dressCode: "Tenue de soirée",
};

export type Country = "MG" | "CA";

export function fullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`.trim();
}
