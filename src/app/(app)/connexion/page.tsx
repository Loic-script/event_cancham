import type { Metadata } from "next";
import { ShieldCheckIcon } from "@/components/app/icons";
import { Btn } from "@/components/traversee/ui";
import { nomComplet, sessionCourante } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { seDeconnecter } from "./actions";
import { FormulaireConnexion } from "./Formulaire";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function ConnexionPage(props: PageProps<"/connexion">) {
  const sp = await props.searchParams;
  const brut = typeof sp.suite === "string" ? sp.suite : "/ressources";
  const suite = brut.startsWith("/") && !brut.startsWith("//") ? brut : "/ressources";
  const session = await sessionCourante();
  const dev = process.env.NODE_ENV !== "production";
  const demos = dev
    ? (
        await prisma.utilisateur.findMany({
          orderBy: [{ role: "asc" }, { prenom: "asc" }],
          take: 8,
          select: { email: true, prenom: true, nom: true, role: true, membre: { select: { nom: true, cotisationJusquAu: true } } },
        })
      ).map((u) => ({
        email: u.email,
        libelle: `${u.prenom} ${u.nom}${u.membre ? ` · ${u.membre.nom}` : ""}`,
        detail: u.role === "equipe" ? "Équipe" : u.membre?.cotisationJusquAu && u.membre.cotisationJusquAu > new Date() ? "Membre à jour" : "Cotisation expirée",
      }))
    : [];

  return (
    <div className="mx-auto grid max-w-[480px] gap-5 py-6">
      <div className="grid gap-2 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold text-white">
          <ShieldCheckIcon width={26} height={26} />
        </span>
        <h1 className="font-display text-[26px] font-extrabold text-graphite">Espace membres</h1>
        <p className="text-[14.5px] text-graphite-muted">Connectez-vous pour accéder à la bibliothèque de ressources de la CanCham.</p>
      </div>
      <div className="m-bleed rounded-2xl border border-line bg-surface p-5 shadow-sm">
        {session ? (
          <div className="grid gap-4 text-center">
            <p className="text-[15px] text-graphite">
              Connecté en tant que <b>{nomComplet(session)}</b>
              {session.membre ? ` · ${session.membre.nom}` : session.role === "equipe" ? " · Équipe CanCham" : ""}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Btn variant="primary" href={session.role === "equipe" ? "/admin/ressources" : suite}>
                {session.role === "equipe" ? "Gérer la bibliothèque" : "Continuer"}
              </Btn>
              <form action={seDeconnecter}>
                <Btn type="submit">Se déconnecter</Btn>
              </form>
            </div>
          </div>
        ) : (
          <FormulaireConnexion suite={suite} demos={demos} motDePasseDemo={dev ? "traversee2026" : null} />
        )}
      </div>
    </div>
  );
}
