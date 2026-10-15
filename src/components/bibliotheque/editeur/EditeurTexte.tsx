"use client";

import { useEffect, useRef, type ClipboardEvent } from "react";
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, ItalicIcon, LinkIcon, ListIcon, ListOrderedIcon, StrikeIcon, TypeIcon } from "@/components/app/icons";
import { COULEURS, lienSur, type Paragraphe } from "@/lib/ressources/blocs";
import { COULEUR_DEFAUT, htmlVersParagraphes, paragraphesVersHtml } from "./texteRiche";
import styles from "./editeur.module.css";

type Props = { valeur: Paragraphe[]; onChange: (p: Paragraphe[]) => void; label: string };

function commande(nom: string, valeur?: string) {
  document.execCommand("styleWithCSS", false, "false");
  document.execCommand(nom, false, valeur);
}

export function EditeurTexte({ valeur, onChange, label }: Props) {
  const zone = useRef<HTMLDivElement | null>(null);
  const initial = useRef(valeur);

  useEffect(() => {
    if (zone.current) zone.current.innerHTML = paragraphesVersHtml(initial.current);
  }, []);

  function publier() {
    if (zone.current) onChange(htmlVersParagraphes(zone.current));
  }

  function agir(nom: string, v?: string) {
    zone.current?.focus();
    commande(nom, v);
    publier();
  }

  function lien() {
    const saisi = window.prompt("Adresse du lien (https://… ou mailto:…)");
    if (saisi === null) return;
    if (!saisi.trim()) return agir("unlink");
    const sur = lienSur(saisi);
    if (!sur) return window.alert("Adresse non valide.");
    agir("createLink", sur);
  }

  function coller(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const texte = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, texte);
    publier();
  }

  const garder = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className={styles.texte}>
      <div className={styles.barreTexte} role="toolbar" aria-label="Mise en forme du texte" onMouseDown={garder}>
        <button type="button" title="Gras" aria-label="Gras" onClick={() => agir("bold")}>
          <BoldIcon width={16} height={16} />
        </button>
        <button type="button" title="Italique" aria-label="Italique" onClick={() => agir("italic")}>
          <ItalicIcon width={16} height={16} />
        </button>
        <button type="button" title="Barré" aria-label="Barré" onClick={() => agir("strikeThrough")}>
          <StrikeIcon width={16} height={16} />
        </button>
        <button type="button" title="Lien" aria-label="Lien" onClick={lien}>
          <LinkIcon width={16} height={16} />
        </button>
        <span className={styles.sep} />
        <select
          aria-label="Taille du texte"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (v) agir("fontSize", v);
            e.target.value = "";
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option value="" disabled>
            Taille
          </option>
          <option value="2">Petit</option>
          <option value="3">Normal</option>
          <option value="5">Grand</option>
          <option value="6">Très grand</option>
        </select>
        <span className={styles.couleurs} aria-label="Couleur du texte">
          <button type="button" title="Couleur par défaut" aria-label="Couleur par défaut" style={{ background: COULEUR_DEFAUT }} onClick={() => agir("foreColor", COULEUR_DEFAUT)} />
          {COULEURS.map((c) => (
            <button key={c.valeur} type="button" title={c.nom} aria-label={`Couleur ${c.nom}`} style={{ background: c.valeur }} onClick={() => agir("foreColor", c.valeur)} />
          ))}
        </span>
        <span className={styles.sep} />
        <button type="button" title="Paragraphe" aria-label="Paragraphe" onClick={() => agir("formatBlock", "p")}>
          <TypeIcon width={16} height={16} />
        </button>
        <button type="button" title="Liste à puces" aria-label="Liste à puces" onClick={() => agir("insertUnorderedList")}>
          <ListIcon width={16} height={16} />
        </button>
        <button type="button" title="Liste numérotée" aria-label="Liste numérotée" onClick={() => agir("insertOrderedList")}>
          <ListOrderedIcon width={16} height={16} />
        </button>
        <span className={styles.sep} />
        <button type="button" title="Aligner à gauche" aria-label="Aligner à gauche" onClick={() => agir("justifyLeft")}>
          <AlignLeftIcon width={16} height={16} />
        </button>
        <button type="button" title="Centrer" aria-label="Centrer" onClick={() => agir("justifyCenter")}>
          <AlignCenterIcon width={16} height={16} />
        </button>
        <button type="button" title="Aligner à droite" aria-label="Aligner à droite" onClick={() => agir("justifyRight")}>
          <AlignRightIcon width={16} height={16} />
        </button>
      </div>
      <div
        ref={zone}
        className={styles.zone}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        onInput={publier}
        onBlur={publier}
        onPaste={coller}
      />
    </div>
  );
}
