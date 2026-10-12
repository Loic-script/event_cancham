"use client";

import { useState, type FormEvent } from "react";
import { CameraIcon } from "@/components/app/icons";
import { heureNow } from "@/lib/traversee/data";
import { occupation } from "@/lib/traversee/sieges";
import { lisImage, setTraversee, toast, uid, useTraversee } from "@/lib/traversee/store";
import { Fil } from "../accueil/Fil";
import { Promos } from "../accueil/Promos";
import { Stories } from "../accueil/Stories";
import styles from "../accueil/accueil.module.css";
import { AvatarSigle, Btn, Card, FileBtn, Onglets, Stat, ui } from "../ui";

export function AdminAccueil() {
  const s = useTraversee();
  const [mode, setMode] = useState<"publication" | "story">("publication");
  const [texte, setTexte] = useState("");
  const [img, setImg] = useState<string | null>(null);
  let occ = 0;
  for (let i = 1; i <= 24; i++) occ += occupation(s, i);
  const story = mode === "story";

  function publier(e: FormEvent) {
    e.preventDefault();
    const tx = texte.trim();
    if (story) {
      if (!img) return toast("Choisissez la photo de la story.");
      setTraversee((st) => ({ stories: [{ id: uid("s"), img, texte: tx }, ...st.stories] }));
      toast("Story publiée : elle apparaît en haut de l’accueil des participants.");
    } else {
      if (!tx && !img) return toast("Écrivez un texte ou ajoutez une photo.");
      setTraversee((st) => ({ pubs: [{ id: uid("c"), texte: tx, img: img ?? undefined, date: `Publié aujourd’hui à ${heureNow().replace(":", " h ")}` }, ...st.pubs] }));
      toast("Publication en ligne sur l’accueil des participants.");
    }
    setTexte("");
    setImg(null);
  }

  return (
    <div className={styles.grille}>
      <div className={styles.colFil}>
        <Stories admin onCreer={() => setMode("story")} />
        <div className={ui.g4}>
          <Stat label="Places attribuées" value={`${occ} / 240`} text={`${240 - occ} places libres`} />
          <Stat label="Commandes" value={s.cmd.filter((c) => c.e !== "Servie").length} text={`à servir sur ${s.cmd.length}`} />
          <Stat label="Votes pitch" value={s.voix.reduce((a, b) => a + b, 0)} text="voix exprimées" />
          <Stat label="Annonces" value={s.annonces.length} text="envoyées aux participants" />
        </div>
        <Card pad bleed>
          <form onSubmit={publier} className="grid gap-3">
            <Onglets
              items={[
                { v: "publication", label: "Publication" },
                { v: "story", label: "Story" },
              ]}
              value={mode}
              onChange={(v) => {
                setMode(v);
                setTexte((t) => t.slice(0, v === "story" ? 120 : 1200));
              }}
              label="Type de contenu"
            />
            <div className="flex items-start gap-3">
              <AvatarSigle size={44} />
              <textarea
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                className={ui.saisie}
                style={{ minHeight: story ? 54 : 76 }}
                maxLength={story ? 120 : 1200}
                placeholder={story ? "Texte court affiché sur la story…" : "Publiez au nom de la CanCham sur l’accueil des participants…"}
                aria-label={story ? "Texte de la story" : "Texte de la publication"}
              />
            </div>
            {img ? <img className={styles.une} src={img} alt="Photo jointe" style={story ? { aspectRatio: "9 / 12", maxWidth: 220, justifySelf: "center" } : undefined} /> : null}
            <div className="flex flex-wrap justify-between gap-2.5">
              <FileBtn
                label={
                  <>
                    <CameraIcon width={16} height={16} />
                    {img ? "Changer la photo" : story ? "Choisir la photo de la story" : "Ajouter une photo"}
                  </>
                }
                accept="image/*"
                aria-label="Photo"
                onChange={async (e) => {
                  const u = await lisImage(e.target.files?.[0], 1080);
                  if (u) setImg(u);
                }}
              />
              <Btn variant="primary" type="submit">
                {story ? "Publier la story" : "Publier"}
              </Btn>
            </div>
            {story ? <p className="text-[13px] text-graphite-muted">Une story s’affiche en plein écran en haut de l’accueil des participants. Une photo est nécessaire.</p> : null}
          </form>
        </Card>
        <h2 className="mt-1 font-display text-[18px] text-graphite">Actualités</h2>
        <Fil admin />
      </div>
      <Promos admin />
    </div>
  );
}
