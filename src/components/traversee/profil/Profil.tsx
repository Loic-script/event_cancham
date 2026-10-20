"use client";

import { useState, type FormEvent } from "react";
import { reprendreParcours } from "@/app/bienvenue/actions";
import { Avatar } from "@/components/app/Avatar";
import { ArrowRightIcon, DownloadIcon } from "@/components/app/icons";
import { updateProfile, useProfile } from "@/components/profile/useProfile";
import { SECTEURS } from "@/lib/traversee/data";
import { toast } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { BilletModal } from "../achats/BilletModal";
import { Presentation } from "../accueil/Presentation";
import { Coordonnees, MotDePasse } from "./Compte";
import { ChoixPhotoProfil } from "./ChoixPhotoProfil";
import { SupprimerCompte } from "./SupprimerCompte";
import { Btn, Card, Champ, Jauge, Sur, ui } from "../ui";
import styles from "./profil.module.css";

type Parcours = { termine: boolean; aCompleter: number; total: number };

export function Profil({ restant, parcours }: { restant: number; parcours: Parcours | null }) {
  const me = useProfile();
  const [f, setF] = useState({ firstName: me.firstName, lastName: me.lastName, company: me.company, sector: me.sector, role: me.role, bio: me.bio ?? "" });
  const [billet, setBillet] = useState(false);
  const champs = [f.firstName, f.lastName, f.company, f.role, f.sector, f.bio, me.photo].filter(Boolean).length;
  const pct = Math.round((champs / 7) * 100);

  function enregistrer(e: FormEvent) {
    e.preventDefault();
    updateProfile({ firstName: f.firstName.trim(), lastName: f.lastName.trim(), company: f.company.trim(), sector: f.sector, role: f.role.trim(), bio: f.bio.trim() });
    toast("Profil enregistré.");
  }

  const reprise = parcours && (!parcours.termine || parcours.aCompleter > 0);

  return (
    <>
      {reprise ? (
        <form action={reprendreParcours} className={styles.reprise}>
          <div className="min-w-0">
            <Sur className="!mb-1 !text-white/70">Parcours d’accueil</Sur>
            <strong>{parcours.aCompleter ? `${parcours.aCompleter} étape${parcours.aCompleter > 1 ? "s" : ""} sur ${parcours.total} à compléter` : "Parcours à terminer"}</strong>
            <p>Photo, entreprise, défis : reprenez là où vous vous étiez arrêté, chaque étape est enregistrée au fur et à mesure.</p>
          </div>
          <Btn variant="primary" type="submit">
            Reprendre
            <ArrowRightIcon width={16} height={16} />
          </Btn>
        </form>
      ) : null}
      <div className="mb-4">
        <Presentation initial={restant} />
      </div>
      <div className={styles.profil}>
        <Card bleed className={styles.id}>
          <Avatar person={me} size={112} className="ring-4 ring-surface shadow-[0_12px_28px_-18px_rgba(15,29,44,0.4)]" />
          <div>
            <h3 className="font-display text-[18px] text-graphite">{fullName(me)}</h3>
            <p className="text-graphite-muted">{me.company || "Entreprise à renseigner"}</p>
          </div>
          <ChoixPhotoProfil />
          <div className="w-full">
            <Jauge pct={pct} />
            <small className="text-graphite-muted">Profil complété à {pct} %</small>
          </div>
        </Card>
        <form onSubmit={enregistrer} className={`${ui.card} ${ui.pad} m-bleed grid gap-4`}>
          <div className={ui.g2}>
            <Champ label="Prénom" htmlFor="p-prenom">
              <input id="p-prenom" className={ui.saisie} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} autoComplete="given-name" />
            </Champ>
            <Champ label="Nom" htmlFor="p-nom">
              <input id="p-nom" className={ui.saisie} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} autoComplete="family-name" />
            </Champ>
          </div>
          <div className={ui.g2}>
            <Champ label="Entreprise" htmlFor="p-entreprise">
              <input id="p-entreprise" className={ui.saisie} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} autoComplete="organization" />
            </Champ>
            <Champ label="Secteur" htmlFor="p-secteur">
              <select id="p-secteur" className={ui.saisie} value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })}>
                <option value="">Choisir…</option>
                {[...new Set([...SECTEURS, f.sector].filter(Boolean))].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Champ>
          </div>
          <Champ label="Fonction dans l’entreprise" htmlFor="p-fonction">
            <input id="p-fonction" className={ui.saisie} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} autoComplete="organization-title" placeholder="Par exemple : directrice générale" />
          </Champ>
          <Champ label="Ce que vous venez chercher à la Traversée" htmlFor="p-bio">
            <textarea id="p-bio" className={ui.saisie} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
          </Champ>
          <div>
            <Btn variant="primary" type="submit">
              Enregistrer
            </Btn>
          </div>
        </form>
      </div>
      <Coordonnees />
      <MotDePasse />
      <Card pad bleed className="mt-4 flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <Sur className="!mb-1.5">Mon billet</Sur>
          <strong className="text-graphite">Billet nominatif · La Traversée</strong>
          <p className="text-graphite-muted">{[fullName(me), me.company, me.role].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Btn variant="primary" onClick={() => setBillet(true)}>
            Afficher mon billet
          </Btn>
          <Btn href="/billet">
            <DownloadIcon width={16} height={16} />
            Télécharger
          </Btn>
        </div>
      </Card>
      <SupprimerCompte />
      {billet ? <BilletModal onClose={() => setBillet(false)} /> : null}
    </>
  );
}
