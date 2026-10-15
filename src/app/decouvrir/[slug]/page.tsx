import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CameraIcon, CalendarIcon, FilmIcon, InfoIcon, LockIcon, TrophyIcon, UsersIcon, XIcon } from "@/components/app/icons";
import { ChallengeActions } from "@/components/challenges/ChallengeActions";
import { ChallengeCover } from "@/components/challenges/ChallengeCover";
import { RichText } from "@/components/challenges/RichText";
import { StatusChip } from "@/components/challenges/StatusChip";
import styles from "@/components/discover/discover.module.css";
import { challengeBySlug, challenges, challengeStatus, closesAtLabel, opensAtLabel } from "@/lib/mock/challenges";
import { event } from "@/lib/mock/data";

export const viewport: Viewport = {
  themeColor: "#0f1d2c",
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/decouvrir/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = challengeBySlug(slug);
  return { title: c ? `Défi ${c.number} · ${c.title}` : "Découvrir les défis" };
}

export default async function DiscoverChallengePage(props: PageProps<"/decouvrir/[slug]">) {
  const { slug } = await props.params;
  const c = challengeBySlug(slug);
  if (!c) notFound();
  const status = challengeStatus(c);
  const KindIcon = c.kind === "video" ? FilmIcon : CameraIcon;
  const kindLabel = c.kind === "video" ? "Vidéo de pitch · 2 min max" : "Photo + lien de publication";

  return (
    <div className={`${styles.space} ${styles.detail} theme-dark`}>
      <span className={styles.blob} style={{ width: 420, height: 420, left: -140, top: -120, background: "rgba(173, 7, 7, 0.5)" }} aria-hidden />
      <span className={styles.blob} style={{ width: 460, height: 460, right: -160, top: 260, background: "rgba(0, 113, 64, 0.45)", animationDelay: "-6s" }} aria-hidden />

      <header className={styles.topbar}>
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 lg:px-8" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <Link href="/decouvrir" aria-label="Découvrir les défis" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <Image src="/cancham-logo.png" alt="" width={62} height={38} priority className="h-9 w-auto" />
          </Link>
          <p className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
            Découvrir les défis · Défi {c.number}
          </p>
          <Link href="/defis" aria-label="Quitter et revenir aux défis" className={styles.iconBtn}>
            <XIcon width={20} height={20} />
          </Link>
        </div>
      </header>

      <main className={`${styles.stagger} mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-36 pt-6 lg:px-8 lg:pt-8`}>
        <Link href="/decouvrir" className={styles.back} style={{ "--i": 0 } as React.CSSProperties}>
          <ArrowLeftIcon width={16} height={16} />
          Tous les défis
        </Link>

        <section className={`${styles.glass} m-bleed overflow-hidden`} style={{ "--i": 1 } as React.CSSProperties} aria-labelledby="challenge-title">
          <ChallengeCover challenge={c} className={styles.detailCover}>
            <div className="absolute right-4 top-4">
              <StatusChip status={status} />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 lg:p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/80">Défi {c.number} · {c.phase}</p>
              <h1 id="challenge-title" className="mt-1 font-display text-[2rem] leading-[1.05] lg:text-[2.8rem]">{c.title}</h1>
            </div>
          </ChallengeCover>

          <div className="relative p-5 lg:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
                  <TrophyIcon width={13} height={13} className="mr-1 inline-block" />
                  À gagner
                </p>
                <p className={`${styles.prize} mt-1`}>{c.prize}</p>
                <p className="mt-1 max-w-md text-[14px] leading-6 text-white/75">{c.prizeNote}</p>
              </div>
              <div className="flex flex-col items-start gap-4 lg:items-end">
                <div className={styles.meta}>
                  <span className={styles.chip}><KindIcon width={14} height={14} />{kindLabel}</span>
                  {c.participants > 0 ? <span className={styles.chip}><UsersIcon width={14} height={14} />{c.participants} participations</span> : null}
                  {c.closesAt ? <span className={styles.chip}><CalendarIcon width={14} height={14} />Jusqu’au {closesAtLabel(c)}</span> : null}
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-[15.5px] leading-7 text-white/85">{c.summary}</p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="flex flex-col gap-6" style={{ "--i": 2 } as React.CSSProperties}>
            <section className={`${styles.glass} m-bleed p-5 lg:p-7`} aria-labelledby="steps-title">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">Comment participer</p>
              <h2 id="steps-title" className="mt-1 font-display text-[1.5rem] leading-tight lg:text-[1.8rem]">
                {c.steps.length} étapes, {c.kind === "video" ? "une vidéo" : "une photo"}.
              </h2>
              <ol className={`${styles.timeline} mt-6`}>
                {c.steps.map((step, i) => (
                  <li key={i} className={styles.tStep}>
                    <span className={styles.tNum} aria-hidden>{i + 1}</span>
                    <p className={styles.tBody}>
                      <span className="sr-only">Étape {i + 1} : </span>
                      <RichText text={step} />
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            {c.notes.length || (c.requiresScan && status.key === "locked") ? (
              <section className="flex flex-col gap-3" aria-label="Bon à savoir">
                {c.requiresScan && status.key === "locked" ? (
                  <p className={`${styles.note} ${styles.noteLock}`}>
                    <LockIcon width={17} height={17} className="mt-0.5 shrink-0" />
                    <span className="font-semibold">S’ouvre après le scan de votre billet à l’entrée, le {opensAtLabel(c)}.</span>
                  </p>
                ) : null}
                {c.notes.map((note, i) => (
                  <p key={i} className={styles.note}>
                    <InfoIcon width={17} height={17} className="mt-0.5 shrink-0 text-white/60" />
                    <span>
                      <RichText text={note} />
                    </span>
                  </p>
                ))}
              </section>
            ) : null}
          </div>

          <aside className={styles.aside} style={{ "--i": 3 } as React.CSSProperties} aria-label="Résumé et participation">
            <div className={`${styles.glass} hidden p-5 lg:block`}>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">En bref</p>
              <div className={styles.summaryRow}><span className={styles.summaryKey}>Gain</span><span className={styles.summaryVal}>{c.prize}</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryKey}>Format</span><span className={styles.summaryVal}>{c.kind === "video" ? "Vidéo" : "Photo"}</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryKey}>État</span><span className={styles.summaryVal}>{status.label}</span></div>
              {c.opensAt ? <div className={styles.summaryRow}><span className={styles.summaryKey}>Ouverture</span><span className={styles.summaryVal}>{opensAtLabel(c)}</span></div> : null}
              {c.closesAt ? <div className={styles.summaryRow}><span className={styles.summaryKey}>Clôture</span><span className={styles.summaryVal}>{closesAtLabel(c)}</span></div> : null}
              <div className={styles.summaryRow}><span className={styles.summaryKey}>Gala</span><span className={styles.summaryVal}>{event.dateLabel}</span></div>
            </div>
            <span id="participer" className="block h-0 scroll-mt-28" aria-hidden />
            <div style={{ display: "contents" }}>
              <ChallengeActions challenge={c} status={status} />
            </div>
          </aside>
        </div>
      </main>

      <nav className={styles.dock} aria-label="Navigation de l’espace défis">
        {challenges.map((d) => (
          <Link
            key={d.slug}
            href={`/decouvrir/${d.slug}`}
            aria-current={d.slug === c.slug ? "page" : undefined}
            aria-label={`Défi ${d.number} : ${d.title}`}
            className={`${styles.dockItem} ${d.slug === c.slug ? styles.dockAccent : ""}`}
          >
            <span className={styles.dockNum} aria-hidden>{d.number}</span>
            Défi {d.number}
          </Link>
        ))}
        <Link href="/defis" className={styles.dockItem}>
          <XIcon width={20} height={20} />
          Quitter
        </Link>
      </nav>
    </div>
  );
}
