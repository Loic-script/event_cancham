"use client";

import { useState, type FormEvent } from "react";
import { CATS, IMAGES, LIEU, type ProgCat, type ProgItem } from "@/lib/traversee/data";
import { setTraversee, toast, uid, useTraversee } from "@/lib/traversee/store";
import { inscrits } from "../programme/Programme";
import { Btn, Card, Champ, PageHead, Puce, Sur, ui } from "../ui";

type Form = { t: string; cat: ProgCat; h: string; lieu: string; cap: number; d: string; details: string; img: string };
const VIDE: Form = { t: "", cat: "Panels", h: "", lieu: LIEU, cap: 0, d: "", details: "", img: IMAGES[0] };

export function AdminProgramme() {
  const s = useTraversee();
  const [edit, setEdit] = useState<string | null>(null);
  const [f, setF] = useState<Form>(VIDE);

  function editer(p: ProgItem) {
    setEdit(p.id);
    setF({ t: p.t, cat: p.cat, h: p.h, lieu: p.lieu, cap: p.cap, d: p.d, details: p.details, img: p.img });
    window.setTimeout(() => document.getElementById("form-prog")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function enregistrer(e: FormEvent) {
    e.preventDefault();
    const d = { ...f, t: f.t.trim(), h: f.h.trim(), lieu: f.lieu.trim() || LIEU, cap: Math.max(0, f.cap || 0), d: f.d.trim(), details: f.details.trim() };
    setTraversee((st) => ({
      programme: edit ? st.programme.map((p) => (p.id === edit ? { ...p, ...d } : p)) : [...st.programme, { ...d, id: uid("n"), ins: 0, phare: d.cat === "Gala" }],
    }));
    toast(edit ? "Rendez-vous mis à jour." : "Rendez-vous ajouté au programme.");
    setEdit(null);
    setF(VIDE);
  }

  return (
    <>
      <PageHead title="Programme et" accent="détails" text="Ajoutez un rendez-vous, modifiez ses détails et suivez les inscriptions." photo="ecran" />
      <div className={ui.gLarge}>
        <Card bleed className={ui.defile}>
          <table className={ui.tab}>
            <thead>
              <tr>
                <th>Heure</th>
                <th>Rendez-vous</th>
                <th>Inscrits</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {s.programme.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap">{p.h}</td>
                  <td>
                    <strong className="text-graphite">{p.t}</strong>
                    <br />
                    <Puce tone="grey">{p.cat}</Puce>
                  </td>
                  <td className="whitespace-nowrap">{p.cap ? `${inscrits(p, s.prog)} / ${p.cap}` : "Libre"}</td>
                  <td className="whitespace-nowrap text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Btn small onClick={() => editer(p)}>
                        Modifier
                      </Btn>
                      <Btn
                        small
                        onClick={() => {
                          setTraversee((st) => ({ programme: st.programme.filter((x) => x.id !== p.id), prog: Object.fromEntries(Object.entries(st.prog).filter(([k]) => k !== p.id)) }));
                          toast("Rendez-vous supprimé du programme.");
                        }}
                      >
                        Supprimer
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <form id="form-prog" onSubmit={enregistrer} className={`${ui.card} ${ui.pad} m-bleed grid gap-3.5 scroll-mt-20`}>
          <Sur className="!mb-0">{edit ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</Sur>
          <Champ label="Titre" htmlFor="pg-t">
            <input id="pg-t" className={ui.saisie} required value={f.t} onChange={(e) => setF({ ...f, t: e.target.value })} />
          </Champ>
          <div className={ui.g2}>
            <Champ label="Catégorie" htmlFor="pg-cat">
              <select id="pg-cat" className={ui.saisie} value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value as ProgCat })}>
                {CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Champ>
            <Champ label="Heure" htmlFor="pg-h">
              <input id="pg-h" className={ui.saisie} required placeholder="14 h 30" value={f.h} onChange={(e) => setF({ ...f, h: e.target.value })} />
            </Champ>
          </div>
          <div className={ui.g2}>
            <Champ label="Lieu" htmlFor="pg-lieu">
              <input id="pg-lieu" className={ui.saisie} value={f.lieu} onChange={(e) => setF({ ...f, lieu: e.target.value })} />
            </Champ>
            <Champ label="Places (0 = accès libre)" htmlFor="pg-cap">
              <input id="pg-cap" className={ui.saisie} type="number" min={0} inputMode="numeric" value={f.cap} onChange={(e) => setF({ ...f, cap: Number(e.target.value) })} />
            </Champ>
          </div>
          <Champ label="Résumé (une ligne)" htmlFor="pg-d">
            <input id="pg-d" className={ui.saisie} required value={f.d} onChange={(e) => setF({ ...f, d: e.target.value })} />
          </Champ>
          <Champ label="Détails affichés au participant" htmlFor="pg-det">
            <textarea id="pg-det" className={ui.saisie} value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} />
          </Champ>
          <Champ label="Photo" htmlFor="pg-img">
            <select id="pg-img" className={ui.saisie} value={f.img} onChange={(e) => setF({ ...f, img: e.target.value })}>
              {IMAGES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </Champ>
          <div className="flex flex-wrap gap-2.5">
            <Btn variant="primary" type="submit">
              {edit ? "Enregistrer" : "Ajouter au programme"}
            </Btn>
            {edit ? (
              <Btn
                onClick={() => {
                  setEdit(null);
                  setF(VIDE);
                }}
              >
                Annuler
              </Btn>
            ) : null}
          </div>
        </form>
      </div>
    </>
  );
}
