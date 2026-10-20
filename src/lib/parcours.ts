import { PAGE_COMPLETER, profilIncomplet } from "@/lib/coordonnees";
import { prisma } from "@/lib/prisma";
import { aAccesEspace, PAGE_ATTENTE } from "@/lib/session";

/**
 * Parcours d'accueil (/bienvenue) : après l'inscription, puis à chaque connexion tant qu'il n'est pas terminé.
 * Une étape est « faite » d'après les données du compte, « passée » quand le participant l'a sautée.
 * Les étapes des défis n'apparaissent qu'une fois l'inscription validée : un compte en attente prépare sa photo et son entreprise.
 */
export const PAGE_PARCOURS = "/bienvenue";

export type EtapeId = "photo" | "entreprise" | "pitch" | "tombola";

export type EtapeEtat = { id: EtapeId; fait: boolean; passee: boolean };

export type EtatParcours = {
  etapes: EtapeEtat[];
  /** Le participant a dépassé l'écran d'introduction. */
  commence: boolean;
  termine: boolean;
  /** Étapes ni faites ni passées : celles où le parcours reprend. */
  restantes: number;
  /** Étapes non faites, passées comprises : ce qu'il reste à compléter. */
  aCompleter: number;
};

export const ETAPES: EtapeId[] = ["photo", "entreprise", "pitch", "tombola"];
export const estEtape = (v: unknown): v is EtapeId => typeof v === "string" && (ETAPES as string[]).includes(v);

const selection = {
  id: true,
  acces: true,
  statut: true,
  company: true,
  role: true,
  phone: true,
  sector: true,
  photo: true,
  participationsDefis: { select: { defi: true } },
  parcoursAccueil: { select: { passees: true, termineLe: true } },
} as const;

type Compte = { acces: string; statut: string; company: string | null; role: string | null; sector: string | null; photo: string | null; participationsDefis: { defi: string }[]; parcoursAccueil: { passees: string[]; termineLe: Date | null } | null };

function etatDe(u: Compte): EtatParcours {
  const acces = aAccesEspace(u as Parameters<typeof aAccesEspace>[0]);
  const defis = new Set(u.participationsDefis.map((p) => p.defi));
  const passees = new Set(u.parcoursAccueil?.passees ?? []);
  const faits: Record<EtapeId, boolean> = {
    photo: Boolean(u.photo),
    entreprise: Boolean(u.company && u.role && u.sector),
    pitch: defis.has("pitch"),
    tombola: defis.has("tombola"),
  };
  const etapes = ETAPES.filter((id) => acces || (id !== "pitch" && id !== "tombola")).map((id) => ({ id, fait: faits[id], passee: passees.has(id) }));
  return {
    etapes,
    commence: Boolean(u.parcoursAccueil),
    termine: Boolean(u.parcoursAccueil?.termineLe),
    restantes: etapes.filter((e) => !e.fait && !e.passee).length,
    aCompleter: etapes.filter((e) => !e.fait).length,
  };
}

export async function etatParcours(userId: number): Promise<EtatParcours> {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: selection });
  return etatDe(u);
}

/**
 * Page où envoyer un compte après la connexion ou l'inscription : parcours d'accueil tant qu'il n'est pas terminé,
 * sinon la page demandée (ou l'attente de validation).
 */
export async function pageApresConnexion(userId: number, next = "/"): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: selection });
  if (!u) return next;
  if (u.acces === "ADMIN") return next === "/" ? "/admin" : next;
  if (u.statut === "REFUSE") return PAGE_ATTENTE;
  if (u.statut === "EN_ATTENTE" && profilIncomplet(u)) return PAGE_COMPLETER;
  const etat = etatDe(u);
  const parcours = next === "/" ? PAGE_PARCOURS : `${PAGE_PARCOURS}?next=${encodeURIComponent(next)}`;
  if (u.statut === "EN_ATTENTE") return etat.restantes ? parcours : PAGE_ATTENTE;
  return etat.termine ? next : parcours;
}
