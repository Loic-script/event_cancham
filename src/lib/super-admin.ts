import { randomBytes } from "node:crypto";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

/**
 * Super admins : les adresses de SUPER_ADMINS (séparées par des virgules), fixées par la configuration du serveur et
 * intouchables depuis la plateforme, plus les administrateurs promus super admin par un super admin (colonne super_admin).
 * Eux seuls créent des administrateurs, changent leur niveau, leur retirent les droits ou suppriment leur compte.
 */
export function adressesSuperAdmins(): string[] {
  return (process.env.SUPER_ADMINS ?? "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
}

export const estAdresseSuperAdmin = (email: string) => adressesSuperAdmins().includes(email.trim().toLowerCase());

export const estSuperAdmin = (u: { acces: string; email: string; superAdmin?: boolean }) => u.acces === "ADMIN" && (Boolean(u.superAdmin) || estAdresseSuperAdmin(u.email));

const motDePasseInconnu = async () => hashPassword(randomBytes(32).toString("base64url"));

/**
 * Au démarrage : chaque adresse de SUPER_ADMINS a un compte administrateur. Un compte créé ou repris reçoit un mot de passe
 * que personne ne connaît (et ses sessions sont fermées) : on y entre par « Mot de passe oublié », qui prouve qu'on lit cette boîte.
 * Ainsi, s'inscrire avec l'adresse du super admin avant lui ne donne aucun droit.
 */
export async function assurerSuperAdmins(): Promise<void> {
  for (const email of adressesSuperAdmins()) {
    const compte = await prisma.user.findUnique({ where: { email }, select: { id: true, acces: true } });
    if (compte?.acces === "ADMIN") continue;
    if (compte) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: compte.id }, data: { acces: "ADMIN", statut: "ACTIF", decisionLe: new Date(), passwordHash: await motDePasseInconnu() } }),
        prisma.session.deleteMany({ where: { userId: compte.id } }),
      ]);
      console.info(`Super admin : le compte ${email} devient administrateur ; choisissez son mot de passe avec « Mot de passe oublié ».`);
    } else {
      await prisma.user.create({ data: { email, firstName: "Équipe", lastName: "CanCham", acces: "ADMIN", statut: "ACTIF", decisionLe: new Date(), passwordHash: await motDePasseInconnu() } });
      console.info(`Super admin : compte ${email} créé ; choisissez son mot de passe avec « Mot de passe oublié ».`);
    }
  }
}
