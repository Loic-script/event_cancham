"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { SendIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { heureNow } from "@/lib/traversee/data";
import { setTraversee, useTraversee, type AConv } from "@/lib/traversee/store";
import { conversations, fullName } from "@/lib/mock/data";
import { AvatarInitiales, Btn, Card, PageHead, ui } from "../ui";
import styles from "./admin.module.css";

export function AdminMessagerie() {
  const s = useTraversee();
  const me = useProfile();
  const [i, setI] = useState(0);
  const [texte, setTexte] = useState("");
  const [reponses, setReponses] = useState<{ texte: string; h: string }[]>([]);
  const bulles = useRef<HTMLDivElement | null>(null);

  const liee: AConv = {
    id: "lie",
    nom: fullName(me),
    ent: me.company || "Participant",
    m: [...(conversations.find((c) => c.id === "c1")?.messages ?? []).map((m) => ({ de: m.fromMe ? ("eux" as const) : ("moi" as const), texte: m.text, h: "" })), ...reponses.map((r) => ({ de: "moi" as const, texte: r.texte, h: r.h }))],
  };
  const convs = [liee, ...s.aconv];
  const c = convs[Math.min(i, convs.length - 1)];

  useEffect(() => {
    bulles.current?.scrollTo({ top: bulles.current.scrollHeight });
  }, [c.m.length, i]);

  function envoyer(e: FormEvent) {
    e.preventDefault();
    const v = texte.trim();
    if (!v) return;
    if (c.id === "lie") setReponses((r) => [...r, { texte: v, h: heureNow() }]);
    else setTraversee((st) => ({ aconv: st.aconv.map((x) => (x.id === c.id ? { ...x, m: [...x.m, { de: "moi", texte: v, h: heureNow() }] } : x)) }));
    setTexte("");
  }

  return (
    <>
      <PageHead title="Messagerie" accent="des participants" text="Répondez aux questions envoyées à l’équipe CanCham depuis l’appli." photo="assistance" />
      <Card bleed className={styles.messagerie}>
        <div className={styles.convs}>
          {convs.map((x, k) => {
            const d = x.m[x.m.length - 1];
            return (
              <button key={x.id} type="button" className={`${styles.conv} ${k === i ? styles.convOn : ""}`} onClick={() => setI(k)}>
                <AvatarInitiales nom={x.nom} />
                <span className="min-w-0">
                  <strong>{x.nom}</strong>
                  <small>{d ? d.texte : "Aucun message"}</small>
                </span>
                <time>{d?.h ?? ""}</time>
              </button>
            );
          })}
        </div>
        <div className={styles.fil}>
          <header>
            <AvatarInitiales nom={c.nom} />
            <div className="min-w-0">
              <strong className="text-graphite">{c.nom}</strong>
              <br />
              <small className="text-graphite-muted">{c.ent}</small>
            </div>
          </header>
          <div ref={bulles} className={styles.bulles}>
            {c.m.length ? (
              c.m.map((m, k) => (
                <div key={k} className={`${styles.bulle} ${m.de === "moi" ? styles.bulleMoi : ""}`}>
                  {m.texte}
                  {m.h ? <time>{m.h}</time> : null}
                </div>
              ))
            ) : (
              <p className={ui.vide}>Aucun message.</p>
            )}
          </div>
          <form onSubmit={envoyer}>
            <input value={texte} onChange={(e) => setTexte(e.target.value)} className={ui.saisie} placeholder="Répondre au participant…" aria-label="Répondre au participant" autoComplete="off" />
            <Btn variant="primary" type="submit" aria-label="Envoyer">
              <SendIcon width={18} height={18} />
            </Btn>
          </form>
        </div>
      </Card>
    </>
  );
}
