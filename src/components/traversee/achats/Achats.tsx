"use client";

import { useRef, useState, type FormEvent } from "react";
import { useProfile } from "@/components/profile/useProfile";
import { CARTE, IMG, MOYENS, PRODUITS, ar } from "@/lib/traversee/data";
import { setTraversee, toast, uid, useTraversee } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { Modal } from "../Modal";
import { Btn, Card, Champ, Note, PageHead, Puce, Sur, ui } from "../ui";
import { BilletModal } from "./BilletModal";
import styles from "./achats.module.css";

function AmiModal({ onClose }: { onClose: () => void }) {
  const me = useProfile();
  const [ent, setEnt] = useState(me.company);
  const [obj, setObj] = useState("");
  function envoyer(e: FormEvent) {
    e.preventDefault();
    setTraversee({ ami: true });
    toast("Manifestation d’intérêt envoyée (simulation).");
    onClose();
  }
  return (
    <Modal onClose={onClose} label="S’inscrire à la MECC 2027" size="large">
      <form onSubmit={envoyer} className="grid gap-3.5">
        <div>
          <Sur>Appel à manifestation d’intérêt</Sur>
          <h3 className="font-display text-[20px] text-graphite">S’inscrire à la MECC 2027</h3>
          <p className="text-graphite-muted">Sans engagement. L’équipe CanCham vous recontacte avec le programme et les conditions.</p>
        </div>
        <Champ label="Entreprise" htmlFor="i-ent">
          <input id="i-ent" className={ui.saisie} required value={ent} onChange={(e) => setEnt(e.target.value)} />
        </Champ>
        <Champ label="Ce que vous irez chercher au Canada" htmlFor="i-obj">
          <textarea id="i-obj" className={ui.saisie} required value={obj} onChange={(e) => setObj(e.target.value)} />
        </Champ>
        <div className="flex flex-wrap gap-2.5">
          <Btn variant="primary" type="submit">
            Envoyer ma manifestation d’intérêt
          </Btn>
          <Btn onClick={onClose}>Annuler</Btn>
        </div>
      </form>
    </Modal>
  );
}

export function BandeauAmi({ onOuvrir }: { onOuvrir: () => void }) {
  const { ami } = useTraversee();
  return (
    <Card bleed className={styles.ami} style={{ "--ph": `url(${IMG("groupe")})` } as React.CSSProperties}>
      <div>
        <Sur className="!text-white/70">Appel à manifestation d’intérêt</Sur>
        <h2>Mission économique MECC 2027</h2>
        <p>Signalez dès maintenant votre intérêt pour la prochaine mission au Canada.</p>
      </div>
      <Btn variant="primary" onClick={ami ? () => toast("Votre intérêt pour la MECC 2027 est déjà enregistré.") : onOuvrir}>
        {ami ? "✓ Intérêt enregistré" : "S’inscrire à la MECC 2027 (AMI)"}
      </Btn>
    </Card>
  );
}

export function Achats() {
  const s = useTraversee();
  const me = useProfile();
  const [panier, setPanier] = useState<Record<string, number>>({});
  const [tableCmd, setTableCmd] = useState<number>(s.table ?? 1);
  const [regl, setRegl] = useState<"table" | "plateforme">("table");
  const [moyen, setMoyen] = useState(MOYENS[0]);
  const [ami, setAmi] = useState(false);
  const [billet, setBillet] = useState(false);
  const mesAchats = useRef<HTMLHeadingElement | null>(null);

  const lignes = Object.keys(panier).filter((k) => panier[k] > 0);
  const total = lignes.reduce((a, k) => a + panier[k] * PRODUITS[k].prix, 0);
  const totalAchats = s.achats.reduce((a, x) => a + x.montant, 0);

  function qte(id: string, d: number) {
    setPanier((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) + d) }));
  }

  function commander(e: FormEvent) {
    e.preventDefault();
    if (!lignes.length) return toast("Votre commande est vide.");
    const quoi = lignes.map((k) => `${panier[k]} × ${PRODUITS[k].nom}`).join(", ");
    const pl = regl === "plateforme";
    setTraversee((st) => ({
      achats: [...st.achats, { quoi, ou: `Table ${tableCmd}${pl ? ` · ${moyen}` : ""}`, montant: total, etat: pl ? "Payé" : "À régler à table", date: "Pendant l’événement" }],
      cmd: [{ id: uid("c"), nom: fullName(me), t: tableCmd, q: quoi, m: total, moyen: pl ? moyen : "À table", p: pl ? "Payé" : "À régler", e: "À servir" }, ...st.cmd],
    }));
    setPanier({});
    toast(pl ? `Commande payée (simulation). Elle arrive à la table ${tableCmd}.` : `Commande envoyée. Vous réglez à la table ${tableCmd}.`);
    window.setTimeout(() => mesAchats.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  return (
    <>
      <PageHead title="Mes" accent="achats" text="Commandez depuis votre place et réglez à table ou directement sur la plateforme. Vos achats s’affichent juste en dessous." photo="diner" />
      <BandeauAmi onOuvrir={() => setAmi(true)} />

      <h2 className="mb-3 font-display text-[20px] text-graphite">Commander</h2>
      <Note className="mb-4">Carte et prix d’exemple, à remplacer par la vraie carte de l’événement.</Note>
      <div className={ui.gLarge}>
        <div className="grid gap-4">
          {CARTE.map((c) => (
            <div key={c.cat}>
              <h3 className="mb-2.5 font-display text-[16px] text-graphite">{c.cat}</h3>
              <div className={styles.produits}>
                {c.items.map((p) => {
                  const q = panier[p.id] ?? 0;
                  return (
                    <Card key={p.id} className={styles.produit}>
                      <img src={IMG("diner")} alt="" style={{ objectPosition: `${(p.prix % 7) * 15}% ${(p.prix % 5) * 22}%` }} />
                      <div>
                        <strong>{p.nom}</strong>
                        <small>{ar(p.prix)}</small>
                      </div>
                      <div className={styles.qte}>
                        <button type="button" onClick={() => qte(p.id, -1)} disabled={!q} aria-label={`Retirer un ${p.nom}`}>
                          −
                        </button>
                        <b>{q}</b>
                        <button type="button" className={styles.plus} onClick={() => qte(p.id, 1)} aria-label={`Ajouter un ${p.nom}`}>
                          +
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={commander} className={`${ui.card} ${ui.pad} m-bleed grid gap-3.5`}>
          <Sur className="!mb-0">Ma commande</Sur>
          {lignes.length ? (
            <>
              <ul className={ui.liste}>
                {lignes.map((k) => (
                  <li key={k}>
                    <div className="min-w-0 flex-1">
                      <strong>
                        {panier[k]} × {PRODUITS[k].nom}
                      </strong>
                    </div>
                    <span className="tabular-nums text-graphite">{ar(panier[k] * PRODUITS[k].prix)}</span>
                  </li>
                ))}
              </ul>
              <p className="flex justify-between border-t border-line pt-3 font-bold text-graphite">
                <span>Total</span>
                <span>{ar(total)}</span>
              </p>
            </>
          ) : (
            <p className={`${ui.vide} !p-3.5`}>Ajoutez des articles depuis la carte.</p>
          )}
          <Champ label="Servir à la table" htmlFor="c-table">
            <select id="c-table" className={ui.saisie} value={tableCmd} onChange={(e) => setTableCmd(Number(e.target.value))}>
              {Array.from({ length: 24 }, (_, k) => (
                <option key={k} value={k + 1}>
                  Table {k + 1}
                  {s.table === k + 1 ? " (ma table)" : ""}
                </option>
              ))}
            </select>
          </Champ>
          <div className={styles.choix}>
            <label className={regl === "table" ? styles.choixOn : ""}>
              <input type="radio" name="regl" value="table" checked={regl === "table"} onChange={() => setRegl("table")} />
              <span>
                <strong>Payer à ma place</strong>
                <small>Vous réglez au serveur quand il apporte la commande à votre table.</small>
              </span>
            </label>
            <label className={regl === "plateforme" ? styles.choixOn : ""}>
              <input type="radio" name="regl" value="plateforme" checked={regl === "plateforme"} onChange={() => setRegl("plateforme")} />
              <span>
                <strong>Payer maintenant sur la plateforme</strong>
                <small>Carte bancaire ou mobile money.</small>
              </span>
            </label>
          </div>
          {regl === "plateforme" ? (
            <Champ label="Moyen de paiement" htmlFor="c-moyen">
              <select id="c-moyen" className={ui.saisie} value={moyen} onChange={(e) => setMoyen(e.target.value)}>
                {MOYENS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Champ>
          ) : null}
          <Btn variant="primary" type="submit" disabled={!lignes.length}>
            {regl === "table" ? "Commander" : "Commander et payer"}
          </Btn>
        </form>
      </div>

      <h2 ref={mesAchats} className="mb-3 mt-7 scroll-mt-20 font-display text-[20px] text-graphite">
        Mes achats <Puce tone="grey">{s.achats.length}</Puce>
      </h2>
      <Card bleed className={ui.defile}>
        <table className={ui.tab}>
          <thead>
            <tr>
              <th>Achat</th>
              <th>Lieu</th>
              <th>Moment</th>
              <th>État</th>
              <th className={ui.n}>Montant</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {s.achats.map((a, i) => (
              <tr key={i}>
                <td>
                  <strong className="text-graphite">{a.quoi}</strong>
                </td>
                <td>{a.ou}</td>
                <td>{a.date}</td>
                <td>
                  <Puce tone={a.etat === "Payé" ? "green" : "red"}>{a.etat}</Puce>
                </td>
                <td className={ui.n}>{ar(a.montant)}</td>
                <td>
                  {i === 0 ? (
                    <Btn small onClick={() => setBillet(true)}>
                      Mon billet QR
                    </Btn>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3.5 text-graphite-muted">
        Total : <strong className="text-graphite">{ar(totalAchats)}</strong>
      </p>

      {ami ? <AmiModal onClose={() => setAmi(false)} /> : null}
      {billet ? <BilletModal onClose={() => setBillet(false)} /> : null}
    </>
  );
}
