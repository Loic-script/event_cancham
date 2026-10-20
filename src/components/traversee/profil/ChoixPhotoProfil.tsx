"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CameraIcon, TrashIcon } from "@/components/app/icons";
import { oublierChampsLocaux, useProfileOverrides, useSessionIdentity } from "@/components/profile/useProfile";
import { lisImage, toast } from "@/lib/traversee/store";
import { Btn, FileBtn } from "../ui";

/** Photo réduite dans le navigateur (data URL) enregistrée sur le compte via /api/profil/photo. */
export async function envoyerPhoto(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const reponse = await fetch("/api/profil/photo", { method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob });
  const corps = (await reponse.json().catch(() => ({}))) as { message?: string };
  if (!reponse.ok) throw new Error(corps.message ?? "La photo n’a pas pu être enregistrée.");
}

// Une seule reprise à la fois, même si le composant est monté deux fois.
let repriseEnCours = false;

/**
 * Boutons « Ajouter / Changer la photo » et « Retirer » : la photo est enregistrée sur le compte, visible partout
 * (annuaire, back-office, autres appareils). Une ancienne photo gardée seulement dans ce navigateur est reprise une fois.
 */
export function ChoixPhotoProfil({ small = false, retrait = true }: { small?: boolean; retrait?: boolean }) {
  const identite = useSessionIdentity();
  const { photo: photoLocale } = useProfileOverrides();
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);
  const photo = identite?.photo ?? null;

  useEffect(() => {
    if (!identite || !photoLocale) return;
    if (photo || !photoLocale.startsWith("data:image/")) {
      oublierChampsLocaux(["photo"]);
      return;
    }
    if (repriseEnCours) return;
    repriseEnCours = true;
    envoyerPhoto(photoLocale)
      .then(() => {
        oublierChampsLocaux(["photo"]);
        router.refresh();
      })
      .catch(() => undefined)
      .finally(() => {
        repriseEnCours = false;
      });
  }, [identite, photo, photoLocale, router]);

  async function choisir(fichier: File | undefined) {
    if (!fichier) return;
    const dataUrl = await lisImage(fichier, 640);
    if (!dataUrl) return toast("Cette image n’a pas pu être lue. Choisissez une photo JPEG, PNG ou WebP.");
    setEnvoi(true);
    try {
      await envoyerPhoto(dataUrl);
      router.refresh();
      toast("Photo de profil mise à jour.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "La photo n’a pas pu être enregistrée.");
    } finally {
      setEnvoi(false);
    }
  }

  async function retirer() {
    setEnvoi(true);
    const reponse = await fetch("/api/profil/photo", { method: "DELETE" }).catch(() => null);
    setEnvoi(false);
    if (!reponse?.ok) return toast("La photo n’a pas pu être retirée. Réessayez.");
    router.refresh();
    toast("Photo de profil retirée.");
  }

  const choix = (
    <FileBtn
      small={small}
      label={
        <>
          <CameraIcon width={16} height={16} />
          {envoi ? "Envoi…" : photo ? "Changer la photo" : "Ajouter une photo"}
        </>
      }
      accept="image/jpeg,image/png,image/webp"
      aria-label="Choisir ma photo de profil"
      disabled={envoi}
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        void choisir(f);
      }}
    />
  );
  if (!retrait) return choix;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {choix}
      {photo ? (
        <Btn small={small} className="!text-[#b42318]" onClick={retirer} disabled={envoi} aria-label="Retirer ma photo de profil">
          <TrashIcon width={15} height={15} />
          Retirer
        </Btn>
      ) : null}
    </div>
  );
}
