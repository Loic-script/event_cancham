"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { CheckIcon, ExternalLinkIcon, PlayIcon, TrashIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { fullName } from "@/lib/mock/data";
import { NOTE_MAX, candidaturesPitch, type Candidature } from "@/lib/traversee/pitchs";
import { setTraversee, toast, useTraversee, type NotePitch } from "@/lib/traversee/store";
import { lienVideo } from "../defis/DefiPitch";
import { AvatarInitiales, Btn, Onglets, Recherche, ui } from "../ui";
import styles from "./candidatures.module.css";

type Filtre = "toutes" | "anoter" | "notees";
type Tri = "note" | "recentes" | "nom";

function formatNote(n: number): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

function niveau(n: number): string {
  if (n >= 16) return styles.excellent;
  if (n >= 13) return styles.bon;
  if (n >= 10) return styles.moyen;
  return styles.faible;
}

function dateEnvoi(t: number): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(t)).replace(":", " h ");
}

function Jauge({ note }: { note: number | null }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const part = note === null ? 0 : note / NOTE_MAX;
  return (
    <div className={`${styles.jauge} ${note === null ? styles.vide : niveau(note)}`}>
      <svg viewBox="0 0 72 72" aria-hidden>
        <circle cx="36" cy="36" r={r} className={styles.fond} />
        <circle cx="36" cy="36" r={r} className={styles.arc} strokeDasharray={c} strokeDashoffset={c * (1 - part)} />
      </svg>
      <span key={note ?? "x"}>
        {note === null ? "—" : formatNote(note)}
        <small>/{NOTE_MAX}</small>
      </span>
    </div>
  );
}

function CarteCandidature({ c, note, rang, i }: { c: Candidature; note: NotePitch | undefined; rang: number | null; i: number }) {
  const [brouillon, setBrouillon] = useState<number>(note?.note ?? 10);
  const [avis, setAvis] = useState(note?.avis ?? "");
  const [touche, setTouche] = useState(false);
  const v = lienVideo(c.lien);
  const info = { service: v?.service ?? "Vidéo", url: v?.url ?? c.lien };
  const affichee = touche ? brouillon : (note?.note ?? null);
  const modifie = touche && (brouillon !== note?.note || avis.trim() !== (note?.avis ?? ""));

  function enregistrer() {
    setTraversee((s) => ({ notesPitch: { ...s.notesPitch, [c.id]: { note: brouillon, avis: avis.trim(), t: Date.now() } } }));
    setTouche(false);
    toast(`Note enregistrée : ${formatNote(brouillon)}/${NOTE_MAX} pour ${c.porteur}.`);
  }

  function effacer() {
    setTraversee((s) => {
      const notes = { ...s.notesPitch };
      delete notes[c.id];
      return { notesPitch: notes };
    });
    setBrouillon(10);
    setAvis("");
    setTouche(false);
    toast("Note effacée.");
  }

  return (
    <article className={`${styles.carte} ${c.moi ? styles.moi : ""}`} style={{ "--i": Math.min(i, 10) } as CSSProperties}>
      <div className={styles.identite}>
        {rang ? <span className={styles.rang}>{rang}</span> : null}
        <AvatarInitiales nom={c.porteur} size={48} />
        <div className="min-w-0">
          <strong>
            {c.porteur}
            {c.moi ? <span className={styles.vous}>Vous</span> : null}
          </strong>
          <p>
            {c.role} · {c.ent}
          </p>
          <div className={styles.meta}>
            <span className={styles.secteur}>{c.sect}</span>
            <span>Envoyé le {dateEnvoi(c.envoi)}</span>
          </div>
        </div>
      </div>

      <a className={styles.lien} href={info.url} target="_blank" rel="noopener noreferrer">
        <span className={styles.lecture}>
          <PlayIcon width={16} height={16} />
        </span>
        <span className="min-w-0 flex-1">
          <strong>{info.service}</strong>
          <small>{info.url.replace(/^https?:\/\//i, "")}</small>
        </span>
        <span className={styles.ouvrir}>
          Voir la vidéo
          <ExternalLinkIcon width={14} height={14} />
        </span>
      </a>

      <div className={styles.notation}>
        <Jauge note={affichee} />
        <div className={styles.reglage}>
          <label htmlFor={`note-${c.id}`} className={styles.etiquette}>
            {note && !touche ? `Noté le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(note.t))}` : touche ? "Note du jury" : "À noter"}
          </label>
          <input
            id={`note-${c.id}`}
            type="range"
            min={0}
            max={NOTE_MAX}
            step={0.5}
            value={brouillon}
            className={`${styles.curseur} ${!note && !touche ? styles.curseurVide : ""}`}
            style={{ "--p": `${(brouillon / NOTE_MAX) * 100}%` } as CSSProperties}
            onChange={(e) => {
              setBrouillon(Number(e.target.value));
              setTouche(true);
            }}
            aria-valuetext={`${formatNote(brouillon)} sur ${NOTE_MAX}`}
          />
          <div className={styles.graduations} aria-hidden>
            <span>0</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
          </div>
          <textarea
            className={`${ui.saisie} ${styles.avis}`}
            placeholder="Appréciation du jury (facultatif)"
            maxLength={400}
            value={avis}
            onChange={(e) => {
              setAvis(e.target.value);
              setTouche(true);
            }}
            aria-label={`Appréciation pour ${c.porteur}`}
          />
          <div className={styles.actions}>
            <Btn small variant="primary" onClick={enregistrer} disabled={!modifie && Boolean(note)}>
              <CheckIcon width={15} height={15} />
              {note ? "Mettre à jour" : "Enregistrer la note"}
            </Btn>
            {note ? (
              <button type="button" className={styles.effacer} onClick={effacer} aria-label={`Effacer la note de ${c.porteur}`}>
                <TrashIcon width={15} height={15} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function AdminCandidatures() {
  const s = useTraversee();
  const me = useProfile();
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [tri, setTri] = useState<Tri>("note");

  const notes = s.notesPitch;
  const toutes = useMemo(() => candidaturesPitch(s, { nom: fullName(me), ent: me.company, role: me.role, sect: me.sector }), [s, me]);
  const notees = toutes.filter((c) => notes[c.id]);
  const moyenne = notees.length ? notees.reduce((a, c) => a + notes[c.id].note, 0) / notees.length : null;
  const classement = [...notees].sort((a, b) => notes[b.id].note - notes[a.id].note).map((c) => c.id);

  const ql = q.trim().toLowerCase();
  const liste = toutes
    .filter((c) => !ql || `${c.porteur} ${c.ent} ${c.sect} ${c.role}`.toLowerCase().includes(ql))
    .filter((c) => filtre === "toutes" || (filtre === "notees" ? notes[c.id] : !notes[c.id]))
    .sort((a, b) => {
      if (tri === "nom") return a.porteur.localeCompare(b.porteur, "fr");
      if (tri === "recentes") return b.envoi - a.envoi;
      const na = notes[a.id]?.note ?? -1;
      const nb = notes[b.id]?.note ?? -1;
      return nb - na || b.envoi - a.envoi;
    });

  return (
    <>
      <div className={styles.tete}>
        <div>
          <p className={styles.surtitre}>Défi 1 · Gagnez un voyage au Canada</p>
          <h1>Candidatures</h1>
          <p className={styles.chapo}>Les vidéos pitch envoyées par les participants. Ouvrez chaque lien et donnez une note sur {NOTE_MAX}.</p>
        </div>
        <div className={styles.chiffres}>
          <div>
            <b>{toutes.length}</b>
            <small>candidatures</small>
          </div>
          <div>
            <b>
              {notees.length}
              <em>/{toutes.length}</em>
            </b>
            <small>notées</small>
          </div>
          <div>
            <b>{moyenne === null ? "—" : formatNote(Math.round(moyenne * 10) / 10)}</b>
            <small>moyenne /{NOTE_MAX}</small>
          </div>
        </div>
      </div>
      <div className={styles.progression} aria-hidden>
        <i style={{ width: `${toutes.length ? (notees.length / toutes.length) * 100 : 0}%` }} />
      </div>

      <div className={styles.outils}>
        <Recherche value={q} onChange={setQ} placeholder="Rechercher un participant, une entreprise…" label="Rechercher une candidature" className={styles.recherche} />
        <Onglets
          items={[
            { v: "toutes", label: `Toutes (${toutes.length})` },
            { v: "anoter", label: `À noter (${toutes.length - notees.length})` },
            { v: "notees", label: `Notées (${notees.length})` },
          ]}
          value={filtre}
          onChange={setFiltre}
          label="Filtrer les candidatures"
        />
        <select className={`${ui.saisie} ${styles.tri}`} value={tri} onChange={(e) => setTri(e.target.value as Tri)} aria-label="Trier les candidatures">
          <option value="note">Meilleure note</option>
          <option value="recentes">Plus récentes</option>
          <option value="nom">Nom (A → Z)</option>
        </select>
      </div>

      {liste.length ? (
        <div className={styles.liste}>
          {liste.map((c, i) => {
            const r = classement.indexOf(c.id);
            return <CarteCandidature key={c.id} c={c} note={notes[c.id]} rang={tri === "note" && r >= 0 ? r + 1 : null} i={i} />;
          })}
        </div>
      ) : (
        <p className={styles.aucune}>{filtre === "anoter" && !ql ? "Toutes les candidatures sont notées." : "Aucune candidature ne correspond."}</p>
      )}
    </>
  );
}
