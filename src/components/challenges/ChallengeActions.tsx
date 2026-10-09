"use client";

import { useState } from "react";
import { CheckIcon, ExternalLinkIcon, FilmIcon, LinkIcon, LockIcon, PencilIcon, TrashIcon } from "@/components/app/icons";
import appStyles from "@/components/app/app.module.css";
import { opensAtLabel, type Challenge, type ChallengeStatus } from "@/lib/mock/challenges";
import { ParticipationSheet } from "./ParticipationSheet";
import { removeParticipation, useParticipation } from "./useParticipation";
import styles from "./challenges.module.css";

type ChallengeActionsProps = {
  challenge: Challenge;
  status: ChallengeStatus;
};

const when = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export function ChallengeActions({ challenge, status }: ChallengeActionsProps) {
  const participation = useParticipation(challenge.slug);
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const isVideo = challenge.kind === "video";

  if (participation) {
    return (
      <>
        <section className={`${appStyles.card} ${styles.mine} p-4`} aria-label="Votre participation">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-graphite">Votre participation</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-palm-soft px-2.5 py-1 text-[12px] font-semibold text-palm-ink">
              <CheckIcon width={14} height={14} />
              Reçue · en vérification
            </span>
          </div>
          <div className="flex gap-3">
            <span className={`${styles.thumb} grid place-items-center text-graphite-muted`}>
              {isVideo ? <FilmIcon width={26} height={26} /> : <LinkIcon width={26} height={26} />}
            </span>
            <div className="min-w-0 flex-1 text-[13.5px] leading-5 text-graphite-muted">
              <p>Envoyée le {when.format(new Date(participation.submittedAt))}.</p>
              {participation.company ? <p className="truncate font-semibold text-graphite">{participation.company}</p> : null}
              {participation.pitch ? <p className="truncate">{participation.pitch}</p> : null}
              {participation.video ? <p>{participation.video.name} · {Math.floor(participation.video.seconds / 60)}:{(participation.video.seconds % 60).toString().padStart(2, "0")}</p> : null}
              {participation.link ? (
                <a href={participation.link} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-palm-ink underline-offset-4 hover:underline">
                  <ExternalLinkIcon width={14} height={14} />
                  <span className="truncate">{participation.link.replace(/^https?:\/\//, "")}</span>
                </a>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface text-[14px] font-semibold text-graphite hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm"
            >
              <PencilIcon width={16} height={16} />
              Modifier
            </button>
            {confirmRemove ? (
              <button
                type="button"
                onClick={() => {
                  removeParticipation(challenge.slug);
                  setConfirmRemove(false);
                }}
                className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-leaf text-[14px] font-semibold text-white hover:bg-[#8f0606] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
              >
                Confirmer le retrait
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-[14px] font-semibold text-leaf-ink hover:bg-leaf-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
              >
                <TrashIcon width={16} height={16} />
                Retirer
              </button>
            )}
          </div>
        </section>
        {open ? <ParticipationSheet challenge={challenge} existing={participation} onClose={() => setOpen(false)} /> : null}
      </>
    );
  }

  if (status.key === "locked") {
    return (
      <div className={`${appStyles.card} flex items-start gap-3 p-4`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-graphite-muted">
          <LockIcon width={20} height={20} />
        </span>
        <div className="text-[14px] leading-5">
          <p className="font-semibold text-graphite">S’ouvre après le scan de votre billet à l’entrée, le {opensAtLabel(challenge)}.</p>
          <p className="mt-1 text-graphite-muted">Revenez sur cette page pendant la soirée : le bouton « Participer » apparaîtra ici.</p>
        </div>
      </div>
    );
  }

  if (status.key === "closed") {
    return <p className={`${appStyles.card} p-4 text-center text-[14px] text-graphite-muted`}>Ce défi est terminé. Merci à toutes les personnes qui ont participé !</p>;
  }

  return (
    <>
      <div className={styles.stickyCta}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex h-13 w-full cursor-pointer items-center justify-center rounded-2xl text-[16px] font-semibold text-white shadow-[0_16px_34px_-16px_rgba(0,0,0,0.45)] transition-[transform,background-color] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isVideo ? "bg-leaf hover:bg-[#8f0606] focus-visible:ring-leaf" : "bg-palm hover:bg-palm-deep focus-visible:ring-palm"
          }`}
          style={{ height: 52 }}
        >
          {challenge.cta}
        </button>
      </div>
      {open ? <ParticipationSheet challenge={challenge} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
