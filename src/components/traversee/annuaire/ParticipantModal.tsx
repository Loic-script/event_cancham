"use client";

import { useState, type FormEvent } from "react";
import { LinkIcon, MailIcon, PencilIcon, PhoneIcon, TicketIcon } from "@/components/app/icons";
import { QrCode } from "@/components/ticket/QrCode";
import { IMG, ROLES, SECTEURS, initiales } from "@/lib/traversee/data";
import { setTraversee, toast, type Fiche } from "@/lib/traversee/store";
import { Modal } from "../Modal";
import { Btn, Champ, Puce, Sur, ui } from "../ui";
import styles from "./annuaire.module.css";

export type FicheComplete = Fiche & { id: string; img: string; code: string };

type Props = { fiche: FicheComplete; modifiee: boolean; onClose: () => void };

export function ParticipantModal({ fiche, modifiee, onClose }: Props) {
  const [edition, setEdition] = useState(false);
  const [grand, setGrand] = useState(false);
  const [f, setF] = useState<Fiche>(fiche);
  const maj = (k: keyof Fiche) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  function enregistrer(e: FormEvent) {
    e.preventDefault();
    const nom = f.nom.trim();
    const ent = f.ent.trim();
    if (!nom || !ent) return toast("Le nom et l’entreprise sont obligatoires.");
    const email = f.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+$/.test(email)) return toast("Adresse e-mail invalide.");
    const phone = f.phone.trim();
    if (phone && !/^\+?[\d\s().-]{7,20}$/.test(phone)) return toast("Numéro de téléphone invalide.");
    let website = f.website.trim();
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    if (website && !/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(website)) return toast("Adresse de site web invalide.");
    const propre: Fiche = { ...f, nom, ent, role: f.role.trim(), act: f.act.trim(), email, phone, website };
    setTraversee((s) => ({ fiches: { ...s.fiches, [fiche.id]: propre } }));
    setF(propre);
    setEdition(false);
    toast("Profil du participant enregistré.");
  }

  function retablir() {
    setTraversee((s) => {
      const fiches = { ...s.fiches };
      delete fiches[fiche.id];
      return { fiches };
    });
    toast("Profil rétabli.");
    onClose();
  }

  const billet = f.billet === "paye";

  return (
    <Modal onClose={onClose} label={`Profil de ${f.nom}`} size="large" className="!p-0 !overflow-hidden">
      <div className={styles.pBandeau} style={{ backgroundImage: `linear-gradient(120deg, rgba(15,29,44,.82), rgba(22,50,84,.5)), url(${IMG(fiche.img)})` }}>
        <Sur className="!mb-0 !text-white/70">Participant</Sur>
        <div className={styles.pTete}>
          <span className={styles.pLg}>{initiales(f.nom)}</span>
          <div className="min-w-0">
            <h3>{f.nom}</h3>
            <p>
              {f.role} · {f.ent}
            </p>
          </div>
        </div>
      </div>

      {edition ? (
        <form onSubmit={enregistrer} className={styles.pCorps}>
          <div className={ui.g2}>
            <Champ label="Nom complet" htmlFor="p-nom">
              <input id="p-nom" className={ui.saisie} required value={f.nom} onChange={maj("nom")} />
            </Champ>
            <Champ label="Rôle" htmlFor="p-role">
              <input id="p-role" className={ui.saisie} list="p-roles" value={f.role} onChange={maj("role")} />
              <datalist id="p-roles">
                {ROLES.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </Champ>
          </div>
          <div className={ui.g2}>
            <Champ label="Entreprise" htmlFor="p-ent">
              <input id="p-ent" className={ui.saisie} required value={f.ent} onChange={maj("ent")} />
            </Champ>
            <Champ label="Secteur" htmlFor="p-sect">
              <select id="p-sect" className={ui.saisie} value={f.sect} onChange={maj("sect")}>
                {[...new Set([...SECTEURS, f.sect])].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Champ>
          </div>
          <Champ label="Activité de l’entreprise" htmlFor="p-act">
            <textarea id="p-act" className={`${ui.saisie} min-h-[72px] resize-y`} value={f.act} onChange={maj("act")} />
          </Champ>
          <Champ label="Adresse e-mail" htmlFor="p-email">
            <div className="relative">
              <MailIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
              <input id="p-email" type="email" className={`${ui.saisie} !pl-10`} value={f.email} onChange={maj("email")} />
            </div>
          </Champ>
          <div className={ui.g2}>
            <Champ label="Numéro de téléphone" htmlFor="p-phone">
              <div className="relative">
                <PhoneIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
                <input id="p-phone" type="tel" inputMode="tel" className={`${ui.saisie} !pl-10`} placeholder="+261 34 00 000 00" value={f.phone} onChange={maj("phone")} />
              </div>
            </Champ>
            <Champ label="Site web" htmlFor="p-web">
              <div className="relative">
                <LinkIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
                <input id="p-web" type="text" inputMode="url" className={`${ui.saisie} !pl-10`} placeholder="www.entreprise.mg" value={f.website} onChange={maj("website")} />
              </div>
            </Champ>
          </div>
          <Champ label="Billet" htmlFor="p-billet">
            <select id="p-billet" className={ui.saisie} value={f.billet} onChange={maj("billet")}>
              <option value="paye">Billet payé</option>
              <option value="attente">Paiement en attente</option>
            </select>
          </Champ>
          <div className={styles.pActions}>
            <Btn variant="primary" type="submit">
              Enregistrer
            </Btn>
            <Btn
              type="button"
              onClick={() => {
                setF(fiche);
                setEdition(false);
              }}
            >
              Annuler
            </Btn>
          </div>
        </form>
      ) : (
        <div className={styles.pCorps}>
          <div className="flex flex-wrap gap-2">
            <Puce>{f.sect}</Puce>
            <Puce tone={billet ? "green" : "red"}>{billet ? "Billet payé" : "Paiement en attente"}</Puce>
            {modifiee ? <Puce tone="grey">Modifié par CanCham</Puce> : null}
          </div>
          <p className={styles.pAct}>{f.act || "Activité non renseignée."}</p>
          <ul className={styles.pCoord}>
            <li>
              <MailIcon width={18} height={18} />
              {f.email ? <a href={`mailto:${f.email}`}>{f.email}</a> : <span>Adresse e-mail non renseignée</span>}
            </li>
            <li>
              <PhoneIcon width={18} height={18} />
              {f.phone ? <a href={`tel:${f.phone.replace(/\s/g, "")}`}>{f.phone}</a> : <span>Numéro non renseigné</span>}
            </li>
            <li>
              <LinkIcon width={18} height={18} />
              {f.website ? (
                <a href={f.website} target="_blank" rel="noreferrer">
                  {f.website.replace(/^https?:\/\//i, "")}
                </a>
              ) : (
                <span>Site web non renseigné</span>
              )}
            </li>
            <li>
              <TicketIcon width={18} height={18} />
              <span>{billet ? "Place confirmée pour le 18 décembre" : "Place réservée, paiement à confirmer"}</span>
            </li>
          </ul>
          <div className={styles.pBillet}>
            <button type="button" className={styles.pQr} onClick={() => setGrand(true)} aria-label="Agrandir le QR code">
              <QrCode value={fiche.code} size={128} className="block h-auto w-full" />
            </button>
            <div className={styles.pBilletInfos}>
              <Sur className="!mb-0">Billet d’entrée</Sur>
              <p className={styles.pCode}>{fiche.code}</p>
              <p>
                Titulaire : <strong>{f.nom}</strong>
              </p>
              <p className={billet ? styles.pValide : styles.pAttente}>{billet ? "QR code valide · entrée gala" : "QR code activé après paiement"}</p>
            </div>
          </div>
          <div className={styles.pActions}>
            <Btn variant="primary" type="button" onClick={() => setEdition(true)}>
              <PencilIcon width={16} height={16} />
              Modifier le profil
            </Btn>
            {modifiee ? (
              <Btn type="button" variant="ghost" onClick={retablir}>
                Rétablir
              </Btn>
            ) : null}
            <Btn type="button" onClick={onClose}>
              Fermer
            </Btn>
          </div>
        </div>
      )}
      {grand ? (
        <div className={styles.pGrand} role="dialog" aria-label={`QR code de ${f.nom}`} onClick={() => setGrand(false)}>
          <QrCode value={fiche.code} size={360} className="block h-auto w-full" />
          <p className={styles.pCode}>{fiche.code}</p>
          <p>{f.nom}</p>
          <small>Toucher pour fermer</small>
        </div>
      ) : null}
    </Modal>
  );
}
