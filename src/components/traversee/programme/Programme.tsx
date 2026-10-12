"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon, CalendarCheckIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, UsersIcon } from "@/components/app/icons";
import { CATS, DATE_LABEL, IMG, type ProgCat, type ProgItem } from "@/lib/traversee/data";
import { setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import { Btn, Card, Onglets, PageHead, Puce, Sur, ui } from "../ui";
import styles from "./programme.module.css";

export function inscrits(p: ProgItem, prog: Record<string, boolean>) {
  return p.ins + (prog[p.id] ? 1 : 0);
}

export function places(p: ProgItem, prog: Record<string, boolean>) {
  return p.cap ? Math.max(0, p.cap - inscrits(p, prog)) : null;
}

function inscrire(p: ProgItem) {
  setTraversee((s) => {
    const on = !s.prog[p.id];
    toast(on ? `Inscription enregistrée : ${p.t}.` : "Inscription annulée.");
    return { prog: { ...s.prog, [p.id]: on } };
  });
}

type Filtre = "Tout" | ProgCat;

export function Programme() {
  const { programme, prog } = useTraversee();
  const router = useRouter();
  const [filtre, setFiltre] = useState<Filtre>("Tout");
  const n = programme.filter((p) => prog[p.id]).length;
  const liste = programme.filter((p) => filtre === "Tout" || p.cat === filtre);

  return (
    <>
      <PageHead title="Programme de" accent="la journée" text={`${DATE_LABEL}, ${programme[0]?.lieu ?? ""}. Inscrivez-vous aux rendez-vous qui vous intéressent.`} photo="ecran">
        <Puce tone="white">
          {n} inscription{n > 1 ? "s" : ""}
        </Puce>
      </PageHead>
      <div className={ui.outils}>
        <Onglets items={(["Tout", ...CATS] as Filtre[]).map((c) => ({ v: c, label: c }))} value={filtre} onChange={setFiltre} label="Catégorie" />
      </div>
      <div className={`${styles.frise} ${ui.stagger}`}>
        {liste.map((p, i) => {
          const on = prog[p.id];
          const rest = places(p, prog);
          return (
            <Card key={p.id} bleed className={`${styles.creneau} ${p.phare ? styles.phare : ""}`} style={{ "--i": i } as React.CSSProperties}>
              <img className={styles.th} src={IMG(p.img)} alt="" loading="lazy" onClick={() => router.push(`/programme/${p.id}`)} />
              <div className={styles.h}>{p.h}</div>
              <div className="min-w-0">
                <h3>
                  <Link href={`/programme/${p.id}`} className="hover:underline">
                    {p.t}
                  </Link>
                </h3>
                <p>{p.d}</p>
                <p className="mt-1 !text-[12.5px]">
                  {p.lieu}
                  {p.cap ? ` · ${rest} places restantes` : ""}
                </p>
              </div>
              <div className={styles.act}>
                <Btn variant={on ? "navy" : "primary"} onClick={() => inscrire(p)} disabled={rest === 0 && !on}>
                  {on ? "✓ Inscrit" : "S’inscrire"}
                </Btn>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export function ProgrammeDetail({ id }: { id: string }) {
  const { programme, prog } = useTraversee();
  const p = programme.find((x) => x.id === id);
  if (!p) {
    return (
      <Card pad bleed className="text-center text-graphite-muted">
        Ce rendez-vous n’existe plus.
        <div className="mt-4">
          <Btn href="/programme">← Tout le programme</Btn>
        </div>
      </Card>
    );
  }
  const on = prog[p.id];
  const rest = places(p, prog);
  const plein = rest === 0 && !on;
  return (
    <>
      <Btn href="/programme" className="mb-4">
        <ArrowLeftIcon width={16} height={16} />
        Tout le programme
      </Btn>
      <Card bleed className={styles.detail}>
        <img src={IMG(p.img)} alt="" />
        <div className={styles.dp}>
          <div>
            <Puce>{p.cat}</Puce>
          </div>
          <h1>{p.t}</h1>
          <ul className={styles.faits}>
            <li>
              <CalendarDaysIcon />
              {DATE_LABEL}
            </li>
            <li>
              <ClockIcon />
              {p.h}
            </li>
            <li>
              <MapPinIcon />
              {p.lieu}
            </li>
            <li>
              <UsersIcon />
              {p.cap ? `${inscrits(p, prog)} inscrits sur ${p.cap}` : "Accès libre toute la journée"}
            </li>
          </ul>
          <div className={styles.insc}>
            <div>
              <Sur className="!mb-1.5">Participation</Sur>
              <strong className="text-graphite">Incluse dans votre billet</strong>
              {p.cap ? <p className="text-graphite-muted">{rest} places restantes</p> : null}
            </div>
            <Btn variant={on ? "light" : "primary"} onClick={() => inscrire(p)} disabled={plein}>
              <CalendarCheckIcon width={16} height={16} />
              {on ? "✓ Inscrit · se désinscrire" : plein ? "Complet" : "S’inscrire"}
            </Btn>
          </div>
          <p className={styles.desc}>{p.details || p.d}</p>
          <div>
            <Sur className="!mb-1.5">Pour qui</Sur>
            <Puce tone="grey">Participants de la Traversée</Puce>
          </div>
        </div>
      </Card>
    </>
  );
}
