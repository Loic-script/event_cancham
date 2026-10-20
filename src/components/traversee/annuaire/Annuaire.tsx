"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { modifierParticipant, supprimerParticipant } from "@/app/(app)/admin/participants/actions";
import { TrashIcon } from "@/components/app/icons";
import type { FicheInscrit } from "@/lib/annuaire";
import { CRENEAUX, LIEUX } from "@/lib/traversee/data";
import type { Fiche } from "@/lib/traversee/store";
import type { RdvVue } from "@/lib/rendezvous";
import { toast } from "@/lib/traversee/store";
import { Confirmer } from "../Confirmer";
import { AvatarProfil, Btn, Card, PageHead, Puce, Recherche, Sur, ui } from "../ui";
import { ParticipantModal } from "./ParticipantModal";
import { RdvModal } from "./RdvModal";
import styles from "./annuaire.module.css";

type Props = { participants: FicheInscrit[]; admin?: boolean; mesRdv?: RdvVue[] };

function Liste({ participants, admin = false, mesRdv = [] }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [secteur, setSecteur] = useState("");
  const [rdv, setRdv] = useState<{ id: number; nom: string; ent: string } | null>(null);
  const [profil, setProfil] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<FicheInscrit | null>(null);
  const [suppression, setSuppression] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const secteurs = [...new Set(participants.map((p) => p.sect).filter(Boolean))].sort();
  const ouvert = profil ? participants.find((p) => p.id === profil) : undefined;
  const ql = q.toLowerCase().trim();
  const liste = participants.filter((p) => (!ql || `${p.nom} ${p.ent} ${p.role} ${p.sect}`.toLowerCase().includes(ql)) && (!secteur || p.sect === secteur));

  async function enregistrer(userId: number, fiche: Fiche) {
    const { error } = await modifierParticipant(userId, fiche);
    if (!error) router.refresh();
    return error;
  }

  function demanderSuppression(p: FicheInscrit) {
    setSuppression({ enCours: false, erreur: null });
    setASupprimer(p);
  }

  async function supprimer(p: FicheInscrit) {
    setSuppression({ enCours: true, erreur: null });
    const { error } = await supprimerParticipant(p.userId);
    if (error) {
      setSuppression({ enCours: false, erreur: error });
      return;
    }
    setSuppression({ enCours: false, erreur: null });
    setASupprimer(null);
    if (profil === p.id) setProfil(null);
    toast(`${p.nom} a été supprimé de la plateforme.`);
    router.refresh();
  }

  return (
    <>
      {!admin && mesRdv.length ? (
        <Card pad bleed className="mb-4">
          <Sur>Mes rendez-vous du 18 décembre</Sur>
          <ul className={ui.liste}>
            {mesRdv.map((r) => (
              <li key={r.id}>
                <Puce>{CRENEAUX[r.ci]}</Puce>
                <div className="min-w-0 flex-1">
                  <strong>{r.avec.nom}</strong>
                  <small>{LIEUX[r.li].nom}</small>
                </div>
                <Puce tone={r.etat === "attente" ? "red" : "green"}>{r.etat === "attente" ? "En attente" : "Confirmé"}</Puce>
              </li>
            ))}
          </ul>
          <Btn href="/rdv" className="mt-3">
            Gérer mes rendez-vous
          </Btn>
        </Card>
      ) : null}
      <div className={ui.outils}>
        <Recherche value={q} onChange={setQ} placeholder="Rechercher par nom, entreprise, rôle ou secteur…" label="Rechercher dans l’annuaire" className={ui.recherche} />
        {secteurs.length ? (
          <select className={ui.saisie} style={{ width: "auto" }} value={secteur} onChange={(e) => setSecteur(e.target.value)} aria-label="Secteur">
            <option value="">Tous les secteurs</option>
            {secteurs.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        ) : null}
      </div>
      {liste.length ? (
        <div className={`${styles.fiches} ${ui.stagger}`}>
          {liste.map((p, i) => (
            <Card key={p.id} className={styles.fiche} style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
              <div className={styles.bandeau} style={{ backgroundImage: `linear-gradient(120deg, rgba(15,29,44,.78), rgba(22,50,84,.45)), url(${p.img})`, backgroundPosition: `center ${p.imgPosition}%` }} />
              <div className={styles.corps}>
                <AvatarProfil photo={p.photo} size={64} className={styles.lg} />
                <h3>{p.nom}</h3>
                <p className={styles.ent}>{p.ent || "Entreprise non renseignée"}</p>
                {p.role ? <p className={styles.role}>{p.role}</p> : null}
                {p.sect ? (
                  <div>
                    <Puce>{p.sect}</Puce>
                  </div>
                ) : null}
                {p.act ? <p>{p.act}</p> : null}
                <div className={styles.actions}>
                  {admin ? (
                    <>
                      <Btn small variant="primary" onClick={() => setProfil(p.id)}>
                        Voir le profil
                      </Btn>
                      <Puce tone={p.billet === "paye" ? "green" : "red"}>{p.billet === "paye" ? "Billet payé" : "En attente"}</Puce>
                      <button type="button" className={styles.supprimer} onClick={() => demanderSuppression(p)} aria-label={`Supprimer ${p.nom}`} title="Supprimer le membre">
                        <TrashIcon width={16} height={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Btn small variant="primary" href={`/messages/avec/${p.userId}`}>
                        Écrire
                      </Btn>
                      <Btn small onClick={() => setRdv({ id: p.userId, nom: p.nom, ent: p.ent })}>
                        Rendez-vous
                      </Btn>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className={ui.vide}>{participants.length ? "Aucun participant ne correspond." : admin ? "Aucun participant inscrit pour le moment." : "Aucun autre participant inscrit pour le moment."}</p>
      )}
      {rdv ? <RdvModal avec={rdv} onClose={() => setRdv(null)} /> : null}
      {ouvert ? (
        <ParticipantModal
          key={`${ouvert.id}-${ouvert.nom}-${ouvert.email}`}
          fiche={ouvert}
          inscritLe={ouvert.inscritLe}
          onSave={(fiche) => enregistrer(ouvert.userId, fiche)}
          onClose={() => setProfil(null)}
        />
      ) : null}
      {aSupprimer ? (
        <Confirmer
          titre={`Supprimer ${aSupprimer.nom} ?`}
          action="Supprimer le membre"
          enCours={suppression.enCours}
          erreur={suppression.erreur}
          onConfirmer={() => void supprimer(aSupprimer)}
          onClose={() => setASupprimer(null)}
        >
          <p>
            Le compte <strong>{aSupprimer.email}</strong> sera supprimé définitivement : le membre ne pourra plus se connecter et disparaîtra de l’annuaire.
          </p>
          <p>Cette action est irréversible.</p>
        </Confirmer>
      ) : null}
    </>
  );
}

export function Annuaire({ participants, admin = false, mesRdv = [] }: Props) {
  return (
    <>
      {admin ? (
        <PageHead title="Participants" accent="inscrits" text="Les membres inscrits sur la plateforme. Ouvrez une fiche pour voir et modifier un profil ou l’état du billet, ou supprimez un membre." photo="reseau">
          <Puce tone="white">
            {participants.length} inscrit{participants.length > 1 ? "s" : ""}
          </Puce>
        </PageHead>
      ) : (
        <PageHead title="Annuaire des" accent="participants" text="Chaque participant avec son entreprise, son rôle et ce qu’il vient chercher à la Traversée." photo="reseau" />
      )}
      <Suspense fallback={null}>
        <Liste participants={participants} admin={admin} mesRdv={mesRdv} />
      </Suspense>
    </>
  );
}
