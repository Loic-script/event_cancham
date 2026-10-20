/** Règles communes à l'inscription et à « Compléter votre profil » (comptes créés avec Google ou Facebook). */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;
export const MIN_PASSWORD_LENGTH = 8;

const MAX_NAME_LENGTH = 60;
const MAX_COMPANY_LENGTH = 80;
const MAX_ROLE_LENGTH = 80;

export type Coordonnees = { firstName: string; lastName: string; company: string; role: string; phone: string };

export function lireCoordonnees(formData: FormData): Coordonnees {
  const champ = (nom: string) => String(formData.get(nom) ?? "").trim();
  return { firstName: champ("firstName"), lastName: champ("lastName"), company: champ("company"), role: champ("role"), phone: champ("phone") };
}

/** Message d'erreur, ou null si les coordonnées sont valides. */
export function erreurCoordonnees(c: Coordonnees): string | null {
  if (!c.firstName || !c.lastName) return "Renseignez votre prénom et votre nom.";
  if (!c.company || !c.role) return "Renseignez votre entreprise et votre rôle.";
  if (c.firstName.length > MAX_NAME_LENGTH || c.lastName.length > MAX_NAME_LENGTH || c.company.length > MAX_COMPANY_LENGTH || c.role.length > MAX_ROLE_LENGTH) {
    return "Un des champs est trop long.";
  }
  if (!PHONE_PATTERN.test(c.phone) || c.phone.replace(/\D/g, "").length < 7) return "Le numéro de téléphone n’est pas valide (exemple : +261 34 00 000 00).";
  return null;
}

/** Page « Compléter votre profil » : comptes créés avec Google ou Facebook, avant la validation. */
export const PAGE_COMPLETER = "/inscription/completer";

/** Profil à compléter avant la validation : comptes créés avec Google ou Facebook. */
export const profilIncomplet = (u: { company: string | null; role: string | null; phone: string | null }) => !u.company || !u.role || !u.phone;
