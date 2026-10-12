"use client";

import { useState, type FormEvent } from "react";
import { CameraIcon } from "@/components/app/icons";
import { DESTINATIONS, type Promo } from "@/lib/traversee/data";
import { lisImage, setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import { Btn, Card, Champ, FileBtn, Puce, Sur, ui } from "../ui";
import styles from "./accueil.module.css";

function PromoForm({ i, promo, onDone }: { i: number; promo: Promo; onDone: () => void }) {
  const [p, setP] = useState<Promo>(promo);

  function enregistrer(e: FormEvent) {
    e.preventDefault();
    setTraversee((s) => ({ promos: s.promos.map((x, k) => (k === i ? { ...p, ann: p.ann.trim(), titre: p.titre.trim(), texte: p.texte.trim() } : x)) }));
    onDone();
    toast(`Emplacement promotion ${i + 1} mis à jour.`);
  }

  return (
    <form onSubmit={enregistrer} className={`${ui.card} ${ui.pad} grid gap-3`} style={{ gridColumn: "1 / -1" }}>
      <Sur className="!mb-0">Emplacement {i + 1}</Sur>
      <Champ label="Annonceur" htmlFor={`pr-ann-${i}`}>
        <input id={`pr-ann-${i}`} className={ui.saisie} required value={p.ann} onChange={(e) => setP({ ...p, ann: e.target.value })} />
      </Champ>
      <Champ label="Titre" htmlFor={`pr-titre-${i}`}>
        <input id={`pr-titre-${i}`} className={ui.saisie} required maxLength={60} value={p.titre} onChange={(e) => setP({ ...p, titre: e.target.value })} />
      </Champ>
      <Champ label="Texte" htmlFor={`pr-texte-${i}`}>
        <input id={`pr-texte-${i}`} className={ui.saisie} maxLength={90} value={p.texte} onChange={(e) => setP({ ...p, texte: e.target.value })} />
      </Champ>
      <Champ label="Lien interne" htmlFor={`pr-lien-${i}`}>
        <select id={`pr-lien-${i}`} className={ui.saisie} value={p.lien} onChange={(e) => setP({ ...p, lien: e.target.value })}>
          {DESTINATIONS.map((d) => (
            <option key={d.href} value={d.href}>
              {d.nom}
            </option>
          ))}
        </select>
      </Champ>
      <FileBtn
        label={
          <>
            <CameraIcon width={16} height={16} />
            Changer la photo
          </>
        }
        accept="image/*"
        aria-label="Photo de la promotion"
        onChange={async (e) => {
          const u = await lisImage(e.target.files?.[0], 900);
          if (u) {
            setP((x) => ({ ...x, img: u }));
            toast("Photo choisie : enregistrez pour l’appliquer.");
          }
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Btn variant="primary" type="submit">
          Enregistrer
        </Btn>
        <Btn onClick={onDone}>Annuler</Btn>
      </div>
    </form>
  );
}

export function Promos({ admin = false }: { admin?: boolean }) {
  const { promos } = useTraversee();
  const [edit, setEdit] = useState<number | null>(null);

  return (
    <div className={styles.colPromo}>
      <Sur className={`${styles.titre} !mb-0`}>Emplacements promotion</Sur>
      {promos.map((p, i) =>
        admin && edit === i ? (
          <PromoForm key={i} i={i} promo={p} onDone={() => setEdit(null)} />
        ) : (
          <Card key={i} className={styles.promo}>
            <img src={p.img} alt="" loading="lazy" />
            <div className={styles.promoCorps}>
              <div className="flex flex-wrap gap-1.5">
                <Puce tone="grey" className="!text-[10.5px] !px-2 !py-[3px]">
                  {p.ann}
                </Puce>
              </div>
              <h3>{p.titre}</h3>
              <p>{p.texte}</p>
              {admin ? (
                <Btn small variant="primary" onClick={() => setEdit(i)} className="w-full">
                  Modifier
                </Btn>
              ) : (
                <Btn small href={p.lien} className="w-full">
                  En savoir plus
                </Btn>
              )}
            </div>
          </Card>
        ),
      )}
    </div>
  );
}
