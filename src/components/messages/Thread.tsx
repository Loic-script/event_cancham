"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { actualiserConversation, envoyerMessage } from "@/app/(app)/messages/actions";
import { Avatar } from "@/components/app/Avatar";
import { ArrowLeftIcon, CheckIcon, InfoIcon, MicIcon, SendIcon, SmileIcon, TrashIcon, XIcon } from "@/components/app/icons";
import type { Cote, Interlocuteur, MessageVue } from "@/lib/messagerie";
import { EmojiPicker } from "./EmojiPicker";
import { useVoiceRecorder, type VoiceNote } from "./useVoiceRecorder";
import { VoiceBubble } from "./VoiceBubble";
import styles from "./messages.module.css";

export type ThreadMessage = MessageVue & { envoi?: boolean };

type ThreadProps = {
  conversationId: string;
  cote: Cote;
  peer: Interlocuteur;
  initial: MessageVue[];
  vuJusqua: string | null;
  backHref?: string;
};

/** Nouveaux messages vérifiés toutes les 4 secondes tant que la conversation est affichée. */
const INTERVALLE = 4000;

const iconBtn =
  "grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-gold transition-colors hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" });

function now() {
  return HEURE.format(new Date()).replace(":", " h ");
}

function formatSeconds(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/** Ajoute les messages reçus qui ne sont pas déjà affichés, dans l'ordre chronologique. */
function fusionner(liste: ThreadMessage[], nouveaux: MessageVue[]): ThreadMessage[] {
  const connus = new Set(liste.map((m) => m.id));
  const ajout = nouveaux.filter((m) => !connus.has(m.id));
  return ajout.length ? [...liste, ...ajout] : liste;
}

export function Thread({ conversationId, cote, peer, initial, vuJusqua, backHref = "/messages" }: ThreadProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initial);
  const [vu, setVu] = useState(vuJusqua);
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const infoBtnRef = useRef<HTMLButtonElement | null>(null);
  const infoCloseRef = useRef<HTMLButtonElement | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const compteur = useRef(0);
  const dernierRecu = useRef<string | null>(initial.at(-1)?.iso ?? null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!infoOpen) return;
    const bouton = infoBtnRef.current;
    infoCloseRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setInfoOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      bouton?.focus();
    };
  }, [infoOpen]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const recevoir = useCallback((nouveaux: MessageVue[]) => {
    if (!nouveaux.length) return;
    dernierRecu.current = nouveaux.reduce((max, m) => (m.iso > max ? m.iso : max), dernierRecu.current ?? "");
    setMessages((liste) => fusionner(liste, nouveaux));
  }, []);

  // Conversation ouverte : nouveaux messages, lecture marquée, « Vu » de l'autre côté.
  useEffect(() => {
    let actif = true;
    async function actualiser() {
      if (document.hidden) return;
      const r = await actualiserConversation(conversationId, cote, dernierRecu.current).catch(() => null);
      if (!actif || !r || r.error) return;
      recevoir(r.messages ?? []);
      setVu(r.vuJusqua ?? null);
    }
    void actualiser();
    const id = window.setInterval(() => void actualiser(), INTERVALLE);
    const auRetour = () => {
      if (!document.hidden) void actualiser();
    };
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      actif = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [conversationId, cote, recevoir]);

  /** Message affiché tout de suite, remplacé par celui du serveur (ou retiré en cas d'erreur). */
  function provisoire(texte: string, audio?: { src: string; seconds: number }): string {
    compteur.current += 1;
    const id = `local-${compteur.current}`;
    setMessages((liste) => [...liste, { id, fromMe: true, text: texte, time: now(), jour: "Aujourd’hui", iso: new Date().toISOString(), envoi: true, ...(audio ? { audio } : {}) }]);
    return id;
  }

  function confirmer(idLocal: string, message: MessageVue | undefined) {
    setMessages((liste) => {
      const sans = liste.filter((m) => m.id !== idLocal);
      return message && !sans.some((m) => m.id === message.id) ? [...sans, message] : sans;
    });
    if (message) dernierRecu.current = message.iso > (dernierRecu.current ?? "") ? message.iso : dernierRecu.current;
  }

  const onVoiceComplete = useCallback(
    async (note: VoiceNote) => {
      const idLocal = provisoire("Message vocal", { src: note.url, seconds: note.seconds });
      const reponse = await fetch(`/api/messages/${conversationId}/audio?cote=${cote}&secondes=${note.seconds}`, {
        method: "POST",
        headers: { "Content-Type": note.blob.type || "audio/webm" },
        body: note.blob,
      }).catch(() => null);
      const corps = reponse ? ((await reponse.json().catch(() => ({}))) as { message?: MessageVue; message_?: string }) : {};
      if (!reponse?.ok || !corps.message) {
        confirmer(idLocal, undefined);
        setToast("Le message vocal n’a pas pu être envoyé. Réessayez.");
        return;
      }
      confirmer(idLocal, corps.message);
    },
    [conversationId, cote],
  );

  const onVoiceError = useCallback((message: string) => setToast(message), []);
  const voice = useVoiceRecorder({ onComplete: (note) => void onVoiceComplete(note), onError: onVoiceError });

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const idLocal = provisoire(text);
    setDraft("");
    setEmojiOpen(false);
    const r = await envoyerMessage(conversationId, cote, text).catch(() => null);
    if (!r || r.error || !r.message) {
      confirmer(idLocal, undefined);
      setDraft(text);
      setToast(r?.error ?? "Le message n’a pas pu être envoyé. Vérifiez votre connexion.");
      return;
    }
    confirmer(idLocal, r.message);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function insertEmoji(emoji: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + emoji + draft.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  const groups: ThreadMessage[][] = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    if (last && last[0].fromMe === m.fromMe && last[0].jour === m.jour) last.push(m);
    else groups.push([m]);
  }
  const lastMine = [...messages].reverse().find((m) => m.fromMe);
  const lastMineVu = Boolean(lastMine && !lastMine.envoi && vu && vu >= lastMine.iso);

  return (
    <section className={styles.thread} aria-label={`Conversation avec ${peer.name}`}>
      <header className={styles.threadHeader}>
        <Link href={backHref} aria-label="Retour aux messages" className="grid h-10 w-10 place-items-center rounded-full text-gold hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden">
          <ArrowLeftIcon width={22} height={22} />
        </Link>
        <Avatar person={peer} size={38} className="lg:ml-2" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-graphite">{peer.name}</p>
          <p className="truncate text-[12px] text-graphite-muted">{[peer.role, peer.company].filter(Boolean).join(" · ")}</p>
        </div>
        <button
          ref={infoBtnRef}
          type="button"
          aria-label={`Informations sur ${peer.name}`}
          aria-expanded={infoOpen}
          aria-controls="thread-info"
          onClick={() => setInfoOpen((v) => !v)}
          className={`grid h-10 w-10 cursor-pointer place-items-center rounded-full text-gold hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${infoOpen ? "bg-gold-soft" : ""}`}
        >
          <InfoIcon width={20} height={20} />
        </button>
      </header>

      <div className={styles.scroll}>
        <div className="mx-auto mb-4 flex max-w-2xl flex-col items-center gap-2 py-4 text-center">
          <Avatar person={peer} size={72} />
          <p className="font-display text-[1.3rem] text-graphite">{peer.name}</p>
          <p className="text-[13px] text-graphite-muted">{[peer.role, peer.company].filter(Boolean).join(" · ")}</p>
        </div>
        {messages.length === 0 ? <p className="mb-3 text-center text-[14px] text-graphite-muted">{peer.userId === null ? "Posez votre question : l’équipe CanCham vous répond ici." : `Écrivez le premier message à ${peer.firstName}.`}</p> : null}

        <div className="mx-auto max-w-2xl">
          {groups.map((group, gi) => (
            <div key={group[0].id} className={styles.group}>
              {gi === 0 || groups[gi - 1][0].jour !== group[0].jour ? (
                <p className="mb-3 mt-1 text-center font-mono text-[10.5px] uppercase tracking-[0.16em] text-graphite-faint">{group[0].jour}</p>
              ) : null}
              {group.map((m, i) => {
                const lastInGroup = i === group.length - 1;
                const isNew = m.id.startsWith("local-");
                return (
                  <div key={m.id} className={`${styles.row} ${m.fromMe ? styles.rowMine : ""}`}>
                    {!m.fromMe ? (
                      <span className="w-7 shrink-0">{lastInGroup ? <Avatar person={peer} size={28} /> : null}</span>
                    ) : null}
                    <div className={`${styles.bubble} ${m.fromMe ? styles.mine : styles.theirs} ${isNew ? styles.in : ""}`} title={m.time}>
                      {m.audio ? <VoiceBubble id={m.id} src={m.audio.src} seconds={m.audio.seconds} mine={m.fromMe} /> : m.text}
                    </div>
                  </div>
                );
              })}
              {group[0].fromMe && lastMine && group.includes(lastMine) ? (
                <p className="mt-0.5 pr-1 text-right text-[11px] text-graphite-faint">{lastMine.envoi ? "Envoi…" : lastMineVu ? "Vu" : "Envoyé"} · {lastMine.time}</p>
              ) : null}
            </div>
          ))}

          <div ref={endRef} />
        </div>
      </div>

      {voice.recording ? (
        <div className={styles.recording} role="status" aria-live="polite" aria-label="Enregistrement en cours">
          <button type="button" onClick={() => voice.stop(true)} aria-label="Annuler l’enregistrement" className={`${iconBtn} text-leaf-ink hover:bg-leaf-soft`}>
            <TrashIcon width={20} height={20} />
          </button>
          <span className={styles.recDot} aria-hidden />
          <span className="w-11 shrink-0 font-mono text-[14px] tabular-nums text-graphite">{formatSeconds(voice.elapsed)}</span>
          <span className={styles.eq} aria-hidden>
            {Array.from({ length: 24 }, (_, i) => <span key={i} />)}
          </span>
          <button
            type="button"
            onClick={() => voice.stop(false)}
            aria-label="Envoyer le message vocal"
            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-leaf text-white hover:bg-leaf-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <CheckIcon width={22} height={22} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void send(e)} className={`${styles.composer} relative`}>
          {emojiOpen ? (
            <EmojiPicker
              onPick={insertEmoji}
              onClose={() => setEmojiOpen(false)}
            />
          ) : null}
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label="Émojis"
            aria-expanded={emojiOpen}
            className={`${iconBtn} ${emojiOpen ? "bg-gold-soft" : ""}`}
          >
            <SmileIcon width={22} height={22} />
          </button>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Votre message</span>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Écrivez un message…"
              enterKeyHint="send"
              className="max-h-32 w-full resize-none rounded-[22px] bg-paper px-4 py-2.5 text-[15px] leading-6 text-graphite placeholder:text-graphite-faint focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </label>
          {draft.trim() ? (
            <button
              type="submit"
              aria-label="Envoyer"
              className={`${styles.sendBtn} grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-leaf text-white hover:bg-leaf-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2`}
            >
              <SendIcon width={19} height={19} />
            </button>
          ) : (
            <button type="button" onClick={() => void voice.start()} aria-label="Enregistrer un message vocal" className={iconBtn}>
              <MicIcon width={22} height={22} />
            </button>
          )}
        </form>
      )}

      {toast ? (
        <p role="status" className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-line bg-elevated px-4 py-2.5 text-[13px] font-semibold text-graphite shadow-lg">
          {toast}
        </p>
      ) : null}

      {infoOpen ? (
        <>
          <div className={styles.infoScrim} onClick={() => setInfoOpen(false)} aria-hidden />
          <aside id="thread-info" className={styles.infoPanel} role="dialog" aria-modal="true" aria-label={`Informations sur ${peer.name}`}>
            <div className={styles.infoHead}>
              <p className="font-display text-[15px] text-graphite">Informations</p>
              <button ref={infoCloseRef} type="button" onClick={() => setInfoOpen(false)} aria-label="Fermer les informations" className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-graphite-muted hover:bg-gold-soft hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <XIcon width={20} height={20} />
              </button>
            </div>
            <div className={styles.infoIdentite}>
              <Avatar person={peer} size={88} />
              <p className="font-display text-[1.2rem] leading-tight text-graphite">{peer.name}</p>
              <p className="text-[13px] text-graphite-muted">{[peer.role, peer.company].filter(Boolean).join(" · ")}</p>
            </div>
            <dl className={styles.infoListe}>
              {[
                ["Entreprise", peer.company],
                ["Fonction", peer.role],
                ["Secteur", peer.sector],
                ["Ville", [peer.city, peer.country].filter(Boolean).join(", ")],
              ]
                .filter(([, v]) => v)
                .map(([label, valeur]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{valeur}</dd>
                  </div>
                ))}
            </dl>
            {peer.bio ? (
              <div className={styles.infoBio}>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-graphite-faint">À propos</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-graphite">{peer.bio}</p>
              </div>
            ) : null}
          </aside>
        </>
      ) : null}
    </section>
  );
}
