"use client";

import { Fragment, useState, type FormEvent } from "react";
import { enregistrerRendezVous, supprimerRendezVous } from "@/app/(app)/admin/programme/actions";
import { CATS, IMAGES, IMG, LIEU, type ProgCat } from "@/lib/traversee/data";
import type { RendezVousAdmin } from "@/lib/traversee/programme";
import { toast } from "@/lib/traversee/store";
import { Btn, Card, Champ, PageHead, Puce, Sur, ui } from "../ui";

type Form = { titre: string; categorie: ProgCat; heure: string; lieu: string; places: number; resume: string; details: string; image: string };
const VIDE: Form = { titre: "", categorie: "Panels", heure: "", lieu: LIEU, places: 0, resume: "", details: "", image: IMAGES[0] };

export function AdminProgramme({ items }: { items: RendezVousAdmin[] }) {
  const [edit, setEdit] = useState<string | null>(null);
  const [f, setF] = useState<Form>(VIDE);
  const [enregistrement, setEnregistrement] = useState(false);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [suppression, setSuppression] = useState(false);
  const [ouvert, setOuvert] = useState<string | null>(null);

  function editer(r: RendezVousAdmin) {
    setEdit(r.id);
    setF({ titre: r.titre, categorie: r.categorie, heure: r.heure, lieu: r.lieu, places: r.places, resume: r.resume, details: r.details, image: r.image });
    window.setTimeout(() => document.getElementById("form-prog")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function annuler() {
    setEdit(null);
    setF(VIDE);
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (enregistrement) return;
    setEnregistrement(true);
    const { error } = await enregistrerRendezVous(edit, f);
    setEnregistrement(false);
    if (error) return toast(error);
    toast(edit ? "Rendez-vous mis à jour : les participants voient la nouvelle version." : "Rendez-vous ajouté au programme des participants.");
    annuler();
  }

  async function supprimer(r: RendezVousAdmin) {
    setSuppression(true);
    const { error } = await supprimerRendezVous(r.id);
    setSuppression(false);
    setASupprimer(null);
    if (error) return toast(error);
    if (edit === r.id) annuler();
    toast(r.inscrits ? `Rendez-vous supprimé, avec ses ${r.inscrits} inscription${r.inscrits > 1 ? "s" : ""}.` : "Rendez-vous supprimé du programme.");
  }

  return (
    <>
      <PageHead title="Programme et" accent="détails" text="Ajoutez un rendez-vous, modifiez ses détails et suivez les inscriptions. Les participants voient chaque changement." photo="ecran" />
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
              {items.map((r) => (
                <Fragment key={r.id}>
                  <tr>
                    <td className="whitespace-nowrap">{r.heure}</td>
                    <td>
                      <strong className="text-graphite">{r.titre}</strong>
                      <br />
                      <Puce tone="grey">{r.categorie}</Puce>
                    </td>
                    <td className="whitespace-nowrap">
                      {r.inscrits ? (
                        <button
                          type="button"
                          className="cursor-pointer font-semibold text-graphite underline decoration-dotted underline-offset-4"
                          onClick={() => setOuvert(ouvert === r.id ? null : r.id)}
                          aria-expanded={ouvert === r.id}
                        >
                          {r.places ? `${r.inscrits} / ${r.places}` : `${r.inscrits} · libre`}
                        </button>
                      ) : r.places ? (
                        `0 / ${r.places}`
                      ) : (
                        "Libre"
                      )}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {aSupprimer === r.id ? (
                          <>
                            <Btn small variant="primary" onClick={() => supprimer(r)} disabled={suppression}>
                              {suppression ? "Suppression…" : r.inscrits ? `Supprimer (${r.inscrits} inscrit${r.inscrits > 1 ? "s" : ""})` : "Confirmer"}
                            </Btn>
                            <Btn small onClick={() => setASupprimer(null)} disabled={suppression}>
                              Annuler
                            </Btn>
                          </>
                        ) : (
                          <>
                            <Btn small onClick={() => editer(r)}>
                              Modifier
                            </Btn>
                            <Btn small onClick={() => setASupprimer(r.id)}>
                              Supprimer
                            </Btn>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {ouvert === r.id ? (
                    <tr>
                      <td colSpan={4}>
                        <Sur className="!mb-2">Inscrits · {r.titre}</Sur>
                        <ul className="grid gap-1.5 text-[13.5px]">
                          {r.liste.map((u) => (
                            <li key={u.id}>
                              <strong className="text-graphite">{u.nom}</strong>
                              {u.entreprise ? <span className="text-graphite-muted"> · {u.entreprise}</span> : null}
                              {" · "}
                              <a className="text-graphite-muted underline" href={`mailto:${u.email}`}>
                                {u.email}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={4} className="text-center text-graphite-muted">
                    Aucun rendez-vous : ajoutez le premier avec le formulaire.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
        <form id="form-prog" onSubmit={enregistrer} className={`${ui.card} ${ui.pad} m-bleed grid gap-3.5 scroll-mt-20`}>
          <Sur className="!mb-0">{edit ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</Sur>
          <Champ label="Titre" htmlFor="pg-t">
            <input id="pg-t" className={ui.saisie} required maxLength={160} value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} />
          </Champ>
          <div className={ui.g2}>
            <Champ label="Catégorie" htmlFor="pg-cat">
              <select id="pg-cat" className={ui.saisie} value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value as ProgCat })}>
                {CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Champ>
            <Champ label="Heure" htmlFor="pg-h">
              <input id="pg-h" className={ui.saisie} required maxLength={60} placeholder="14 h 30" value={f.heure} onChange={(e) => setF({ ...f, heure: e.target.value })} />
            </Champ>
          </div>
          <div className={ui.g2}>
            <Champ label="Lieu" htmlFor="pg-lieu">
              <input id="pg-lieu" className={ui.saisie} maxLength={160} value={f.lieu} onChange={(e) => setF({ ...f, lieu: e.target.value })} />
            </Champ>
            <Champ label="Places (0 = accès libre)" htmlFor="pg-cap">
              <input id="pg-cap" className={ui.saisie} type="number" min={0} step={1} inputMode="numeric" value={f.places} onChange={(e) => setF({ ...f, places: Number(e.target.value) })} />
            </Champ>
          </div>
          <Champ label="Résumé (une ligne)" htmlFor="pg-d">
            <input id="pg-d" className={ui.saisie} required maxLength={300} value={f.resume} onChange={(e) => setF({ ...f, resume: e.target.value })} />
          </Champ>
          <Champ label="Détails affichés au participant" htmlFor="pg-det">
            <textarea id="pg-det" className={ui.saisie} maxLength={4000} value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} />
          </Champ>
          <Champ label="Photo" htmlFor="pg-img">
            <div className="flex items-center gap-3">
              <img src={IMG(f.image)} alt="" className="h-12 w-16 flex-none rounded-md object-cover" />
              <select id="pg-img" className={ui.saisie} value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })}>
                {IMAGES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </div>
          </Champ>
          <div className="flex flex-wrap gap-2.5">
            <Btn variant="primary" type="submit" disabled={enregistrement}>
              {enregistrement ? "Enregistrement…" : edit ? "Enregistrer" : "Ajouter au programme"}
            </Btn>
            {edit ? (
              <Btn onClick={annuler} disabled={enregistrement}>
                Annuler
              </Btn>
            ) : null}
          </div>
        </form>
      </div>
    </>
  );
}
