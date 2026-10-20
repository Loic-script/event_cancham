"use client";

import { useState, type FormEvent } from "react";
import { BriefcaseIcon, CheckIcon, ExternalLinkIcon, LinkIcon, MailIcon, MaximizeIcon, PencilIcon, PhoneIcon, XIcon } from "@/components/app/icons";
import { QrCode } from "@/components/ticket/QrCode";
import { IMG, ROLES, SECTEURS } from "@/lib/traversee/data";
import type { FicheComplete } from "@/lib/traversee/participants";
import { setTraversee, toast, type Fiche } from "@/lib/traversee/store";
import { Modal } from "../Modal";
import { AvatarProfil, Btn, Champ, Puce, Sur, ui } from "../ui";
import styles from "./annuaire.module.css";

type Props = { fiche: FicheComplete; modifiee: boolean; onClose: () => void; onSave?: (fiche: Fiche) => Promise<string | null>; inscritLe?: string };

export function Ligne({ icon, label, children, href }: { icon: React.ReactNode; label: string; children: React.ReactNode; href?: string }) {
  const inner = (
    <>
      <span className={styles.pIco}>{icon}</span>
      <span className={styles.pLigneTexte}>
        <small>{label}</small>
        <span>{children}</span>
      </span>
      {href ? <ExternalLinkIcon width={15} height={15} className={styles.pLigneFleche} /> : null}
    </>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={styles.pLigne}>
      {inner}
    </a>
  ) : (
    <div className={`${styles.pLigne} ${styles.pLigneVide}`}>{inner}</div>
  );
}

export function ParticipantModal({ fiche, modifiee, onClose, onSave, inscritLe }: Props) {
  const [edition, setEdition] = useState(false);
  const [grand, setGrand] = useState(false);
  const [copie, setCopie] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [f, setF] = useState<Fiche>(fiche);
  const maj = (k: keyof Fiche) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    const nom = f.nom.trim();
    const ent = f.ent.trim();
    if (!nom || (!onSave && !ent)) return toast(onSave ? "Le nom est obligatoire." : "Le nom et l’entreprise sont obligatoires.");
    const email = f.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+$/.test(email)) return toast("Adresse e-mail invalide.");
    const phone = f.phone.trim();
    if (phone && !/^\+?[\d\s().-]{7,20}$/.test(phone)) return toast("Numéro de téléphone invalide.");
    let website = f.website.trim();
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    if (website && !/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(website)) return toast("Adresse de site web invalide.");
    const propre: Fiche = { ...f, nom, ent, role: f.role.trim(), act: f.act.trim(), email, phone, website };
    if (onSave) {
      setEnvoi(true);
      const erreur = await onSave(propre);
      setEnvoi(false);
      if (erreur) return toast(erreur);
    } else {
      setTraversee((s) => ({ fiches: { ...s.fiches, [fiche.id]: propre } }));
    }
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

  async function copier() {
    try {
      await navigator.clipboard.writeText(fiche.code);
      setCopie(true);
      toast("Identifiant du billet copié.");
      window.setTimeout(() => setCopie(false), 1800);
    } catch {
      toast("Copie impossible sur cet appareil.");
    }
  }

  const billet = f.billet === "paye";

  return (
    <Modal onClose={onClose} label={`Profil de ${f.nom}`} className={styles.pBoite}>
      <header className={styles.pBandeau} style={{ backgroundImage: `linear-gradient(160deg, rgba(10,22,38,.92) 0%, rgba(18,48,90,.72) 55%, rgba(242,107,29,.35) 100%), url(${IMG(fiche.img)})` }}>
        <button type="button" onClick={onClose} aria-label="Fermer" className={styles.pFermer}>
          <XIcon width={18} height={18} />
        </button>
        <Sur className="!mb-0 !text-white/70">{edition ? "Modifier le participant" : "Participant"}</Sur>
        <div className={styles.pTete}>
          <AvatarProfil size={60} className={styles.pLg} />
          <div className="min-w-0">
            <h3>{f.nom}</h3>
            <p>{[f.role, f.ent].filter(Boolean).join(" · ") || "Profil à compléter"}</p>
          </div>
        </div>
        <div className={styles.pPuces}>
          {f.sect ? <Puce tone="white">{f.sect}</Puce> : null}
          <Puce tone={billet ? "green" : "red"}>{billet ? "Billet payé" : "Paiement en attente"}</Puce>
          {inscritLe ? <Puce tone="grey">Inscrit le {new Date(inscritLe).toLocaleDateString("fr-FR")}</Puce> : null}
          {modifiee ? <Puce tone="grey">Modifié par CanCham</Puce> : null}
        </div>
      </header>

      {edition ? (
        <form id="p-form" onSubmit={enregistrer} className={`${styles.pCorps} ${ui.stagger}`}>
          <section className={styles.pBloc}>
            <Sur>Identité</Sur>
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
          </section>
          <section className={styles.pBloc}>
            <Sur>Entreprise</Sur>
            <div className={ui.g2}>
              <Champ label="Nom de l’entreprise" htmlFor="p-ent">
                <input id="p-ent" className={ui.saisie} required={!onSave} value={f.ent} onChange={maj("ent")} />
              </Champ>
              <Champ label="Secteur" htmlFor="p-sect">
                <select id="p-sect" className={ui.saisie} value={f.sect} onChange={maj("sect")}>
                  {[...new Set([...SECTEURS, f.sect])].map((x) => (
                    <option key={x} value={x}>
                      {x || "Non renseigné"}
                    </option>
                  ))}
                </select>
              </Champ>
            </div>
            <Champ label="Activité" htmlFor="p-act">
              <textarea id="p-act" className={`${ui.saisie} min-h-[72px] resize-y`} value={f.act} onChange={maj("act")} />
            </Champ>
          </section>
          <section className={styles.pBloc}>
            <Sur>Coordonnées</Sur>
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
          </section>
          <section className={styles.pBloc}>
            <Sur>Billet</Sur>
            <div className={styles.pChoix} role="radiogroup" aria-label="État du billet">
              {(
                [
                  ["paye", "Billet payé", "QR code actif à l’entrée"],
                  ["attente", "Paiement en attente", "QR code activé après règlement"],
                ] as const
              ).map(([v, titre, aide]) => (
                <button key={v} type="button" role="radio" aria-checked={f.billet === v} className={`${styles.pChoixItem} ${f.billet === v ? styles.pChoixOn : ""}`} onClick={() => setF({ ...f, billet: v })}>
                  <strong>{titre}</strong>
                  <small>{aide}</small>
                </button>
              ))}
            </div>
          </section>
        </form>
      ) : (
        <div className={`${styles.pCorps} ${ui.stagger}`}>
          <section className={styles.pBloc}>
            <Sur>Entreprise</Sur>
            <div className={styles.pEnt}>
              <span className={styles.pIco}>
                <BriefcaseIcon width={18} height={18} />
              </span>
              <div className="min-w-0">
                <strong>{f.ent || "Entreprise non renseignée"}</strong>
                <p>{f.act || "Activité non renseignée."}</p>
              </div>
            </div>
          </section>

          <div className={styles.pColonnes}>
            <section className={styles.pBloc}>
              <Sur>Coordonnées</Sur>
              <div className={styles.pCoord}>
                <Ligne icon={<MailIcon width={18} height={18} />} label="E-mail" href={f.email ? `mailto:${f.email}` : undefined}>
                  {f.email || "Non renseigné"}
                </Ligne>
                <Ligne icon={<PhoneIcon width={18} height={18} />} label="Téléphone" href={f.phone ? `tel:${f.phone.replace(/\s/g, "")}` : undefined}>
                  {f.phone || "Non renseigné"}
                </Ligne>
                <Ligne icon={<LinkIcon width={18} height={18} />} label="Site web" href={f.website || undefined}>
                  {f.website ? f.website.replace(/^https?:\/\//i, "") : "Non renseigné"}
                </Ligne>
              </div>
            </section>

            <section className={styles.pBloc}>
              <Sur>Billet d’entrée</Sur>
              <div className={`${styles.pTicket} ${billet ? "" : styles.pTicketAttente}`}>
                <button type="button" className={styles.pQr} onClick={() => setGrand(true)} aria-label="Agrandir le QR code">
                  <QrCode value={fiche.code} size={140} className="block h-auto w-full" />
                  <span className={styles.pQrLoupe}>
                    <MaximizeIcon width={14} height={14} />
                    Agrandir
                  </span>
                </button>
                <div className={styles.pSouche}>
                  <small>Identifiant</small>
                  <button type="button" className={styles.pCode} onClick={copier} aria-label="Copier l’identifiant du billet">
                    {fiche.code}
                    {copie ? <CheckIcon width={14} height={14} /> : null}
                  </button>
                  <small>Titulaire</small>
                  <strong>{f.nom}</strong>
                  <span className={styles.pEtat}>
                    <i />
                    {billet ? "Valide · entrée gala 18 déc." : "Activé après paiement"}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      <footer className={styles.pPied}>
        {edition ? (
          <>
            <Btn key="enregistrer" variant="primary" type="submit" form="p-form" disabled={envoi}>
              <CheckIcon width={16} height={16} />
              {envoi ? "Enregistrement…" : "Enregistrer"}
            </Btn>
            <Btn
              key="annuler"
              type="button"
              onClick={() => {
                setF(fiche);
                setEdition(false);
              }}
            >
              Annuler
            </Btn>
          </>
        ) : (
          <>
            <Btn key="modifier" variant="primary" type="button" onClick={() => setEdition(true)}>
              <PencilIcon width={16} height={16} />
              Modifier le profil
            </Btn>
            {modifiee ? (
              <Btn type="button" variant="ghost" onClick={retablir}>
                Rétablir
              </Btn>
            ) : null}
            <Btn key="fermer" type="button" onClick={onClose} className="sm:ml-auto">
              Fermer
            </Btn>
          </>
        )}
      </footer>

      {grand ? (
        <div className={styles.pGrand} role="dialog" aria-label={`QR code de ${f.nom}`} onClick={() => setGrand(false)}>
          <QrCode value={fiche.code} size={360} className="block h-auto w-full" />
          <p className={styles.pGrandCode}>{fiche.code}</p>
          <p>{f.nom}</p>
          <small>Toucher pour fermer</small>
        </div>
      ) : null}
    </Modal>
  );
}
