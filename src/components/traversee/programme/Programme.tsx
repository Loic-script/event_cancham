"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { basculerInscription } from "@/app/(app)/programme/actions";
import { ArrowLeftIcon, CalendarCheckIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, UsersIcon } from "@/components/app/icons";
import { CATS, DATE_LABEL, IMG, LIEU, type ProgCat } from "@/lib/traversee/data";
import { estPhare, restantes, type RendezVous } from "@/lib/traversee/programme";
import { toast } from "@/lib/traversee/store";
import { Btn, Card, Onglets, PageHead, Puce, Sur, ui } from "../ui";
import styles from "./programme.module.css";

type Etat = Record<string, { inscrit: boolean; inscrits: number }>;

const etatDe = (items: RendezVous[]): Etat => Object.fromEntries(items.map((r) => [r.id, { inscrit: r.inscrit, inscrits: r.inscrits }]));

export const libellePlaces = (n: number) => (n === 0 ? "Complet" : n === 1 ? "1 place restante" : `${n} places restantes`);

/** Inscriptions du participant, mises à jour par la réponse du serveur, puis par les données rechargées. */
function useInscriptions(items: RendezVous[]) {
  const [source, setSource] = useState(items);
  const [etat, setEtat] = useState(() => etatDe(items));
  const [occupe, setOccupe] = useState<string | null>(null);

  if (source !== items) {
    setSource(items);
    setEtat(etatDe(items));
  }

  async function basculer(r: RendezVous) {
    if (occupe) return;
    setOccupe(r.id);
    const res = await basculerInscription(r.id);
    setOccupe(null);
    if (res.error) return toast(res.error);
    setEtat((e) => ({ ...e, [r.id]: { inscrit: Boolean(res.inscrit), inscrits: res.inscrits ?? 0 } }));
    toast(res.inscrit ? `Inscription enregistrée : ${r.titre}.` : "Inscription annulée.");
  }

  const vue = (r: RendezVous): RendezVous => ({ ...r, ...etat[r.id] });
  return { vue, occupe, basculer };
}

type Filtre = "Tout" | ProgCat;

export function Programme({ items }: { items: RendezVous[] }) {
  const router = useRouter();
  const [filtre, setFiltre] = useState<Filtre>("Tout");
  const { vue, occupe, basculer } = useInscriptions(items);
  const n = items.filter((r) => vue(r).inscrit).length;
  const liste = items.map(vue).filter((r) => filtre === "Tout" || r.categorie === filtre);

  return (
    <>
      <PageHead title="Programme de" accent="la journée" text={`${DATE_LABEL}, ${LIEU}. Inscrivez-vous aux rendez-vous qui vous intéressent.`} photo="ecran">
        <Puce tone="white">
          {n} inscription{n > 1 ? "s" : ""}
        </Puce>
      </PageHead>
      {items.length ? (
        <div className={ui.outils}>
          <Onglets items={(["Tout", ...CATS] as Filtre[]).map((c) => ({ v: c, label: c }))} value={filtre} onChange={setFiltre} label="Catégorie" />
        </div>
      ) : null}
      <div className={`${styles.frise} ${ui.stagger}`}>
        {liste.map((r, i) => {
          const rest = restantes(r);
          return (
            <Card key={r.id} bleed className={`${styles.creneau} ${estPhare(r) ? styles.phare : ""}`} style={{ "--i": i } as React.CSSProperties}>
              <img className={styles.th} src={IMG(r.image)} alt="" loading="lazy" onClick={() => router.push(`/programme/${r.id}`)} />
              <div className={styles.h}>{r.heure}</div>
              <div className="min-w-0">
                <h3>
                  <Link href={`/programme/${r.id}`} className="hover:underline">
                    {r.titre}
                  </Link>
                </h3>
                <p>{r.resume}</p>
                <p className="mt-1 !text-[12.5px]">
                  {r.lieu}
                  {rest !== null ? ` · ${libellePlaces(rest)}` : ""}
                </p>
              </div>
              <div className={styles.act}>
                <Btn variant={r.inscrit ? "navy" : "primary"} onClick={() => basculer(r)} disabled={(rest === 0 && !r.inscrit) || occupe === r.id}>
                  {r.inscrit ? "✓ Inscrit" : rest === 0 ? "Complet" : "S’inscrire"}
                </Btn>
              </div>
            </Card>
          );
        })}
        {!liste.length ? (
          <Card pad bleed className="text-center text-graphite-muted">
            {items.length ? "Aucun rendez-vous dans cette catégorie pour l’instant." : "Le programme de la journée sera publié ici prochainement."}
          </Card>
        ) : null}
      </div>
    </>
  );
}

export function ProgrammeDetail({ item }: { item: RendezVous }) {
  const items = useMemo(() => [item], [item]);
  const { vue, occupe, basculer } = useInscriptions(items);
  const r = vue(item);
  const rest = restantes(r);
  const plein = rest === 0 && !r.inscrit;
  return (
    <>
      <Btn href="/programme" className="mb-4">
        <ArrowLeftIcon width={16} height={16} />
        Tout le programme
      </Btn>
      <Card bleed className={styles.detail}>
        <img src={IMG(r.image)} alt="" />
        <div className={styles.dp}>
          <div>
            <Puce>{r.categorie}</Puce>
          </div>
          <h1>{r.titre}</h1>
          <ul className={styles.faits}>
            <li>
              <CalendarDaysIcon />
              {DATE_LABEL}
            </li>
            <li>
              <ClockIcon />
              {r.heure}
            </li>
            <li>
              <MapPinIcon />
              {r.lieu}
            </li>
            <li>
              <UsersIcon />
              {r.places ? `${r.inscrits} inscrit${r.inscrits > 1 ? "s" : ""} sur ${r.places}` : "Accès libre, sans limite de places"}
            </li>
          </ul>
          <div className={styles.insc}>
            <div>
              <Sur className="!mb-1.5">Participation</Sur>
              <strong className="text-graphite">Incluse dans votre billet</strong>
              {rest !== null ? <p className="text-graphite-muted">{libellePlaces(rest)}</p> : null}
            </div>
            <Btn variant={r.inscrit ? "light" : "primary"} onClick={() => basculer(r)} disabled={plein || occupe === r.id}>
              <CalendarCheckIcon width={16} height={16} />
              {r.inscrit ? "✓ Inscrit · se désinscrire" : plein ? "Complet" : "S’inscrire"}
            </Btn>
          </div>
          <p className={styles.desc}>{r.details || r.resume}</p>
          <div>
            <Sur className="!mb-1.5">Pour qui</Sur>
            <Puce tone="grey">Participants de la Traversée</Puce>
          </div>
        </div>
      </Card>
    </>
  );
}
