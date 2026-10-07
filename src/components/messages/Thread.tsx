"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Avatar } from "@/components/app/Avatar";
import { ArrowLeftIcon, CheckIcon, InfoIcon, MicIcon, PhoneIcon, SendIcon, SmileIcon, TrashIcon, VideoIcon } from "@/components/app/icons";
import { EmojiPicker } from "./EmojiPicker";
import { useVoiceRecorder, type VoiceNote } from "./useVoiceRecorder";
import { VoiceBubble } from "./VoiceBubble";
import styles from "./messages.module.css";

export type ThreadMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  seen?: boolean;
  /** Message vocal : adresse du fichier audio et durée en secondes. */
  audio?: { src: string; seconds: number };
};

type ThreadProps = {
  peer: { firstName: string; lastName: string; name: string; hue: number; online?: boolean; role: string; company: string };
  initial: ThreadMessage[];
};

// Réponses simulées tant que la messagerie n'est pas branchée sur le serveur.
const REPLIES = [
  "Bien reçu, on en reparle au cocktail !",
  "Parfait, merci Faneva.",
  "Super, je vous retrouve près de la scène dans dix minutes.",
  "Ça marche, à tout de suite.",
];

const iconBtn =
  "grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-palm-ink transition-colors hover:bg-palm-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm";

function now() {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function formatSeconds(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function Thread({ peer, initial }: ThreadProps) {
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const timers = useRef<number[]>([]);
  const replyIndex = useRef(0);

  // Toujours montrer le dernier message.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, typing]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  // L'interlocuteur « répond » après un court délai.
  const queueReply = useCallback(() => {
    timers.current.push(window.setTimeout(() => setTyping(true), 900));
    timers.current.push(
      window.setTimeout(() => {
        setTyping(false);
        const reply = REPLIES[replyIndex.current % REPLIES.length];
        replyIndex.current += 1;
        setMessages((list) => [...list, { id: `reply-${Date.now()}`, fromMe: false, text: reply, time: now() }]);
      }, 2600),
    );
  }, []);

  const onVoiceComplete = useCallback(
    (note: VoiceNote) => {
      setMessages((list) => [...list, { id: `local-${Date.now()}`, fromMe: true, text: "Message vocal", time: now(), audio: { src: note.url, seconds: note.seconds } }]);
      queueReply();
    },
    [queueReply],
  );

  const onVoiceError = useCallback((message: string) => setToast(message), []);
  const voice = useVoiceRecorder({ onComplete: onVoiceComplete, onError: onVoiceError });

  function send(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((list) => [...list, { id: `local-${Date.now()}`, fromMe: true, text, time: now() }]);
    setDraft("");
    setEmojiOpen(false);
    queueReply();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Insère l'émoji à la position du curseur et y laisse le curseur.
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

  // Regroupe les bulles consécutives du même expéditeur.
  const groups: ThreadMessage[][] = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    if (last && last[0].fromMe === m.fromMe) last.push(m);
    else groups.push([m]);
  }
  const lastMine = [...messages].reverse().find((m) => m.fromMe);

  return (
    <section className={styles.thread} aria-label={`Conversation avec ${peer.name}`}>
      <header className={styles.threadHeader}>
        <Link href="/messages" aria-label="Retour aux messages" className="grid h-10 w-10 place-items-center rounded-full text-palm-ink hover:bg-palm-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm lg:hidden">
          <ArrowLeftIcon width={22} height={22} />
        </Link>
        <Avatar person={peer} size={38} presence className="lg:ml-2" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-graphite">{peer.name}</p>
          <p className="truncate text-[12px] text-graphite-muted">{peer.online ? "En ligne" : `${peer.role} · ${peer.company}`}</p>
        </div>
        {[
          { icon: PhoneIcon, label: "Appeler" },
          { icon: VideoIcon, label: "Appel vidéo" },
          { icon: InfoIcon, label: "Informations" },
        ].map((a) => (
          <button key={a.label} type="button" aria-label={a.label} className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-palm-ink hover:bg-palm-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm">
            <a.icon width={20} height={20} />
          </button>
        ))}
      </header>

      <div className={styles.scroll}>
        <div className="mx-auto mb-4 flex max-w-2xl flex-col items-center gap-2 py-4 text-center">
          <Avatar person={peer} size={72} />
          <p className="font-display text-[1.3rem] text-graphite">{peer.name}</p>
          <p className="text-[13px] text-graphite-muted">{peer.role} · {peer.company}</p>
        </div>
        <p className="mb-3 text-center font-mono text-[10.5px] uppercase tracking-[0.16em] text-graphite-faint">Aujourd’hui</p>

        <div className="mx-auto max-w-2xl">
          {groups.map((group) => (
            <div key={group[0].id} className={styles.group}>
              {group.map((m, i) => {
                const lastInGroup = i === group.length - 1;
                const isNew = m.id.startsWith("local-") || m.id.startsWith("reply-");
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
                <p className="mt-0.5 pr-1 text-right text-[11px] text-graphite-faint">{lastMine.seen ? "Vu" : "Envoyé"} · {lastMine.time}</p>
              ) : null}
            </div>
          ))}

          {typing ? (
            <div className={`${styles.row} ${styles.group}`}>
              <span className="w-7 shrink-0"><Avatar person={peer} size={28} /></span>
              <div className={`${styles.bubble} ${styles.theirs} ${styles.typing} ${styles.in}`} aria-label={`${peer.firstName} écrit`}>
                <span /><span /><span />
              </div>
            </div>
          ) : null}
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
            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-palm text-white hover:bg-palm-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm focus-visible:ring-offset-2"
          >
            <CheckIcon width={22} height={22} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <form onSubmit={send} className={`${styles.composer} relative`}>
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
            className={`${iconBtn} ${emojiOpen ? "bg-palm-soft" : ""}`}
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
              className="max-h-32 w-full resize-none rounded-[22px] bg-paper px-4 py-2.5 text-[15px] leading-6 text-graphite placeholder:text-graphite-faint focus:outline-none focus:ring-2 focus:ring-palm/40"
            />
          </label>
          {draft.trim() ? (
            <button
              type="submit"
              aria-label="Envoyer"
              className={`${styles.sendBtn} grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-palm text-white hover:bg-palm-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm focus-visible:ring-offset-2`}
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
    </section>
  );
}
