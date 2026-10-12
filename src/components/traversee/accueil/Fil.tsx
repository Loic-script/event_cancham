"use client";

import { Avatar } from "@/components/app/Avatar";
import { CommentIcon, HeartIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { ACTUS, IMG, heureNow } from "@/lib/traversee/data";
import { setTraversee, toast, uid, useTraversee } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { AvatarSigle, Btn, Card, Puce, ui } from "../ui";
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
