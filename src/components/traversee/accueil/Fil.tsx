"use client";

import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/app/Avatar";
import { CameraIcon, CommentIcon, HeartIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { ACTUS, IMG, heureNow } from "@/lib/traversee/data";
import { lisImage, setTraversee, toast, uid, useTraversee } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { AvatarSigle, Btn, Card, FileBtn, Puce, ui } from "../ui";
import styles from "./accueil.module.css";

function Reactions({ id, n, c }: { id: string; n: number; c: number }) {
  const { aime } = useTraversee();
  const on = Boolean(aime[id]);
  return (
    <>
      <button type="button" onClick={() => setTraversee((s) => ({ aime: { ...s.aime, [id]: !s.aime[id] } }))} className={`${ui.react} ${on ? ui.reactOn : ""}`} aria-pressed={on}>
        <HeartIcon width={15} height={15} fill={on ? "currentColor" : "none"} />
        {n + (on ? 1 : 0)}
      </button>
      <span className={ui.react} aria-label={`${c} commentaires`}>
        <CommentIcon width={15} height={15} />
        {c}
      </span>
    </>
  );
}

export function Composer() {
  const me = useProfile();
  const [texte, setTexte] = useState("");
  const [img, setImg] = useState<string | null>(null);

  function publier(e: FormEvent) {
    e.preventDefault();
    const tx = texte.trim();
    if (!tx && !img) return toast("Écrivez un texte ou ajoutez une photo.");
    setTraversee((s) => ({ posts: [{ id: uid("p"), texte: tx, img: img ?? undefined, t: Date.now() }, ...s.posts] }));
    setTexte("");
    setImg(null);
    toast("Publication partagée avec les participants.");
  }

  return (
    <Card pad bleed>
      <form onSubmit={publier} className={`grid gap-3 ${styles.composer}`}>
        <div className="flex items-start gap-3">
          <Avatar person={me} size={44} />
          <textarea value={texte} onChange={(e) => setTexte(e.target.value)} className={ui.saisie} placeholder="Partagez une actualité avec les participants…" aria-label="Votre publication" maxLength={1200} />
        </div>
        {img ? <img className={styles.une} src={img} alt="Photo jointe" /> : null}
        <div className="flex flex-wrap justify-between gap-2.5">
          <FileBtn
            label={
              <>
                <CameraIcon width={16} height={16} />
                {img ? "Changer la photo" : "Ajouter une photo"}
              </>
            }
            accept="image/*"
            aria-label="Joindre une photo à la publication"
            onChange={async (e) => {
              const u = await lisImage(e.target.files?.[0], 1080);
              if (u) setImg(u);
            }}
          />
          <Btn variant="primary" type="submit">
            Publier
          </Btn>
        </div>
      </form>
    </Card>
  );
}

export function Fil({ admin = false }: { admin?: boolean }) {
  const me = useProfile();
  const { posts, pubs } = useTraversee();

  const miens = posts.map((p) => (
    <Card key={p.id} bleed className={styles.article}>
      <header>
        <Avatar person={me} size={44} />
        <div className="min-w-0">
          <strong className="text-graphite">{fullName(me)}</strong> <Puce>Participant</Puce>
          <br />
          <small className="text-graphite-muted">{[me.role, me.company].filter(Boolean).join(" · ") || "Publié à l’instant"}</small>
        </div>
      </header>
      {p.img ? <img className={styles.une} src={p.img} alt="" /> : null}
      {p.texte ? <p className={styles.texte}>{p.texte}</p> : null}
      <footer>
        <Reactions id={p.id} n={0} c={0} />
        <Btn
          small
          className="ml-auto"
          onClick={() => {
            setTraversee((s) => ({ posts: s.posts.filter((x) => x.id !== p.id) }));
            toast("Publication supprimée.");
          }}
        >
          Supprimer
        </Btn>
      </footer>
    </Card>
  ));

  const equipe = pubs.map((p) => (
    <Card key={p.id} bleed className={styles.article}>
      <header>
        <AvatarSigle size={44} />
        <div className="min-w-0">
          <strong className="text-graphite">CanCham Madagascar</strong> <Puce tone="red">Équipe CanCham</Puce>
          <br />
          <small className="text-graphite-muted">{p.date}</small>
        </div>
      </header>
      {p.img ? <img className={styles.une} src={p.img} alt="" /> : null}
      {p.texte ? <p className={styles.texte}>{p.texte}</p> : null}
      <footer>
        <Reactions id={p.id} n={0} c={0} />
        {admin ? (
          <Btn
            small
            className="ml-auto"
            onClick={() => {
              setTraversee((s) => ({ pubs: s.pubs.filter((x) => x.id !== p.id) }));
              toast("Publication supprimée.");
            }}
          >
            Supprimer
          </Btn>
        ) : null}
      </footer>
    </Card>
  ));

  const officiels = ACTUS.map((a) => (
    <Card key={a.id} bleed className={styles.article}>
      <header>
        <AvatarSigle size={44} />
        <div className="min-w-0">
          <strong className="text-graphite">CanCham Madagascar</strong> <Puce tone="grey">{a.tag}</Puce>
          <br />
          <small className="text-graphite-muted">{a.date}</small>
        </div>
      </header>
      <img className={styles.une} src={IMG(a.img)} alt="" loading="lazy" />
      <h3>{a.t}</h3>
      <p>{a.x}</p>
      <footer>
        <Reactions id={a.id} n={a.n} c={a.c} />
        <Btn small className="ml-auto" href={`https://cancham.mg/actualites/${a.id}`} external>
          Lire l’article complet
        </Btn>
      </footer>
    </Card>
  ));

  return <>{admin ? [...equipe, ...miens, ...officiels] : [...miens, ...equipe, ...officiels]}</>;
}

export function publierPub(texte: string, img: string | null) {
  setTraversee((s) => ({ pubs: [{ id: uid("c"), texte, img: img ?? undefined, date: `Publié aujourd’hui à ${heureNow().replace(":", " h ")}` }, ...s.pubs] }));
}
