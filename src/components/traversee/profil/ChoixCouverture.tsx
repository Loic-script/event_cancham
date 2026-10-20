"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageIcon, MoveVerticalIcon, TrashIcon } from "@/components/app/icons";
import { useSessionIdentity } from "@/components/profile/useProfile";
import { lisImage, toast } from "@/lib/traversee/store";
import { Btn, FileBtn } from "../ui";

/** Couverture réduite dans le navigateur (data URL) enregistrée sur le compte via /api/profil/couverture. */
export async function envoyerCouverture(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const reponse = await fetch("/api/profil/couverture", { method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob });
  const corps = (await reponse.json().catch(() => ({}))) as { message?: string };
  if (!reponse.ok) throw new Error(corps.message ?? "La couverture n’a pas pu être enregistrée.");
}

/**
 * Boutons « Ajouter / Changer la couverture » et « Retirer » : la bannière du profil et de la fiche annuaire.
 * `compact` (posé sur la bannière) : « Retirer » devient un bouton icône, pour tenir sur une ligne.
 */
export function ChoixCouverture({ small = false, retrait = true, compact = false, onRepositionner }: { small?: boolean; retrait?: boolean; compact?: boolean; onRepositionner?: () => void }) {
  const identite = useSessionIdentity();
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);
  const couverture = identite?.couverture ?? null;

  async function choisir(fichier: File | undefined) {
    if (!fichier) return;
    const dataUrl = await lisImage(fichier, 1600);
    if (!dataUrl) return toast("Cette image n’a pas pu être lue. Choisissez une photo JPEG, PNG ou WebP.");
    setEnvoi(true);
    try {
      await envoyerCouverture(dataUrl);
      router.refresh();
      toast("Photo de couverture mise à jour.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "La couverture n’a pas pu être enregistrée.");
    } finally {
      setEnvoi(false);
    }
  }

  async function retirer() {
    setEnvoi(true);
    const reponse = await fetch("/api/profil/couverture", { method: "DELETE" }).catch(() => null);
    setEnvoi(false);
    if (!reponse?.ok) return toast("La couverture n’a pas pu être retirée. Réessayez.");
    router.refresh();
    toast("Photo de couverture retirée.");
  }

  return (
    <div className={`flex justify-center gap-2 ${compact ? "flex-nowrap" : "flex-wrap"}`}>
      <FileBtn
        small={small}
        label={
          <>
            <ImageIcon width={16} height={16} />
            {envoi ? "Envoi…" : couverture ? "Changer la couverture" : "Ajouter une couverture"}
          </>
        }
        accept="image/jpeg,image/png,image/webp"
        aria-label="Choisir ma photo de couverture"
        disabled={envoi}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void choisir(f);
        }}
      />
      {onRepositionner && couverture ? (
        <Btn small={small} className={compact ? "!px-2.5" : ""} onClick={onRepositionner} disabled={envoi} aria-label="Repositionner la couverture" title={compact ? "Repositionner la couverture" : undefined}>
          <MoveVerticalIcon width={15} height={15} />
          {compact ? null : "Repositionner"}
        </Btn>
      ) : null}
      {retrait && couverture ? (
        <Btn small={small} className={`!text-[#b42318] ${compact ? "!px-2.5" : ""}`} onClick={retirer} disabled={envoi} aria-label="Retirer ma photo de couverture" title={compact ? "Retirer la couverture" : undefined}>
          <TrashIcon width={15} height={15} />
          {compact ? null : "Retirer"}
        </Btn>
      ) : null}
    </div>
  );
}
