"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { changerStatut } from "@/app/(app)/admin/acces/actions";
import { CheckIcon } from "@/components/app/icons";
import type { StatutCompte } from "@/generated/prisma/enums";
import { toast } from "@/lib/traversee/store";
import { AvatarInitiales, Btn, Card, Onglets, PageHead, Puce, Recherche, Vide, ui } from "../ui";

export type CompteAcces = {
  id: number;
  nom: string;
  email: string;
  entreprise: string;
  role: string;
  telephone: string;
  statut: StatutCompte;
  inscritLe: string;
  decisionLe: string | null;
};

// Fuseau fixé : même rendu côté serveur et côté navigateur.
const DATE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Indian/Antananarivo" });

const VIDE: Record<StatutCompte, string> = {
  EN_ATTENTE: "Aucune inscription en attente.",
  ACTIF: "Aucun membre validé pour l’instant.",
  REFUSE: "Aucune demande refusée.",
};

export function AdminAcces({ comptes }: { comptes: CompteAcces[] }) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<StatutCompte>("EN_ATTENTE");
  const [q, setQ] = useState("");
  const [enCours, setEnCours] = useState<number | null>(null);
  const [aConfirmer, setAConfirmer] = useState<number | null>(null);

  const nombre = (s: StatutCompte) => comptes.filter((c) => c.statut === s).length;
  const recherche = q.trim().toLowerCase();
  const liste = comptes
    .filter((c) => c.statut === onglet)
    .filter((c) => !recherche || [c.nom, c.email, c.entreprise, c.role, c.telephone].join(" ").toLowerCase().includes(recherche));

  async function decider(c: CompteAcces, statut: StatutCompte, message: string) {
    setEnCours(c.id);
    const { error } = await changerStatut(c.id, statut);
    setEnCours(null);
    setAConfirmer(null);
    if (error) return toast(error);
    toast(message);
    router.refresh();
  }

  function actions(c: CompteAcces) {
    const occupe = enCours === c.id;
    const donner = (
      <Btn small variant="primary" onClick={() => decider(c, "ACTIF", `${c.nom} a maintenant accès à l’espace participant.`)} disabled={occupe}>
        <CheckIcon width={15} height={15} />
        {occupe ? "Validation…" : "Donner l’accès"}
      </Btn>
    );
    if (c.statut === "EN_ATTENTE") {
      return (
        <>
          {donner}
          <Btn small className="!text-[#b42318]" onClick={() => decider(c, "REFUSE", `La demande de ${c.nom} est refusée.`)} disabled={occupe}>
            Refuser
          </Btn>
        </>
      );
    }
    if (c.statut === "REFUSE") return donner;
    if (aConfirmer === c.id) {
      return (
        <>
          <Btn small variant="primary" onClick={() => decider(c, "EN_ATTENTE", `${c.nom} n’a plus accès à l’espace participant.`)} disabled={occupe}>
            {occupe ? "Retrait…" : "Confirmer"}
          </Btn>
          <Btn small onClick={() => setAConfirmer(null)} disabled={occupe}>
            Annuler
          </Btn>
        </>
      );
    }
    return (
      <Btn small className="!text-[#b42318]" onClick={() => setAConfirmer(c.id)}>
        Retirer l’accès
      </Btn>
    );
  }

  function decision(c: CompteAcces) {
    if (!c.decisionLe) return null;
    const quand = DATE.format(new Date(c.decisionLe));
    return c.statut === "ACTIF" ? `Accès donné le ${quand}` : c.statut === "REFUSE" ? `Refusé le ${quand}` : null;
  }

  return (
    <>
      <PageHead
        title="Demandes"
        accent="d’accès"
        text="Les nouveaux inscrits attendent votre validation pour entrer dans l’espace participant. Vérifiez leurs informations, puis donnez-leur l’accès. Plus tard, le paiement en ligne validera les comptes automatiquement."
        photo="accueil"
      >
        <Puce tone="white">{nombre("EN_ATTENTE")} en attente</Puce>
      </PageHead>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Onglets
          label="Statut des comptes"
          value={onglet}
          onChange={(v) => {
            setOnglet(v);
            setAConfirmer(null);
          }}
          items={[
            { v: "EN_ATTENTE", label: `En attente (${nombre("EN_ATTENTE")})` },
            { v: "ACTIF", label: `Validés (${nombre("ACTIF")})` },
            { v: "REFUSE", label: `Refusés (${nombre("REFUSE")})` },
          ]}
        />
        <Recherche value={q} onChange={setQ} placeholder="Nom, entreprise, e-mail, téléphone…" label="Rechercher un compte" className="w-full sm:w-80" />
      </div>

      {liste.length ? (
        <Card pad bleed className="mt-4">
          <ul className={ui.liste}>
            {liste.map((c) => (
              <li key={c.id} className="flex-wrap">
                <AvatarInitiales nom={c.nom} size={44} />
                <div className="min-w-0 flex-1">
                  <strong>{c.nom}</strong>
                  <small>{[c.role, c.entreprise].filter(Boolean).join(" · ") || "Rôle et entreprise non renseignés"}</small>
                  <small className="flex flex-wrap gap-x-3">
                    <a href={`mailto:${c.email}`} className="text-graphite underline-offset-2 hover:underline">
                      {c.email}
                    </a>
                    {c.telephone ? (
                      <a href={`tel:${c.telephone.replace(/[^\d+]/g, "")}`} className="text-graphite underline-offset-2 hover:underline">
                        {c.telephone}
                      </a>
                    ) : (
                      <span>Téléphone non renseigné</span>
                    )}
                  </small>
                  <small>
                    Inscrit le {DATE.format(new Date(c.inscritLe))}
                    {decision(c) ? ` · ${decision(c)}` : ""}
                  </small>
                </div>
                <div className="flex flex-wrap gap-2">{actions(c)}</div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Vide className="mt-4">{recherche ? `Aucun compte ne correspond à « ${q.trim()} ».` : VIDE[onglet]}</Vide>
      )}
    </>
  );
}
