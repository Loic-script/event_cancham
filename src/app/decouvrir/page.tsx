import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, ChevronRightIcon, QrIcon, SparklesIcon, XIcon } from "@/components/app/icons";
import { ChallengePicker } from "@/components/discover/ChallengePicker";
import styles from "@/components/discover/discover.module.css";
import { daysUntil } from "@/lib/format";
import { challenges, challengeStatus } from "@/lib/mock/challenges";
import { event } from "@/lib/mock/data";

export const metadata: Metadata = {
  title: "Découvrir les défis",
  description: "Les trois défis de La Traversée, présentés dans un espace dédié.",
};

export const viewport: Viewport = {
  themeColor: "#0f1d2c",
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

const PRIZE_TOTAL = "10 000 000 Ar";

export default function DiscoverPage() {
  const days = daysUntil(event.date);
  const statuses = challenges.map((c) => challengeStatus(c));
  const featuredIndex = Math.max(0, statuses.findIndex((s) => s.key === "open"));

  return (
    <div className={styles.space}>
      <span className={styles.blob} style={{ width: 420, height: 420, left: -140, top: -120, background: "rgba(173, 7, 7, 0.55)" }} aria-hidden />
      <span className={styles.blob} style={{ width: 460, height: 460, right: -160, top: 220, background: "rgba(0, 113, 64, 0.5)", animationDelay: "-6s" }} aria-hidden />
      <span className={styles.blob} style={{ width: 360, height: 360, left: "30%", bottom: -200, background: "rgba(173, 7, 7, 0.35)", animationDelay: "-10s" }} aria-hidden />

      <header className={styles.topbar}>
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 lg:px-8" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <Link href="/" aria-label="Accueil de l’espace participant" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <Image src="/cancham-logo.png" alt="" width={62} height={38} priority className="h-9 w-auto" />
          </Link>
          <p className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
            {event.name} · Découvrir les défis
          </p>
          <Link href="/defis" aria-label="Quitter et revenir aux défis" className={styles.iconBtn}>
            <XIcon width={20} height={20} />
          </Link>
        </div>
      </header>

      <main className={`${styles.stagger} mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-36 pt-8 lg:px-8 lg:pt-12`}>
        <section className={`${styles.glass} m-bleed p-6 lg:p-10`} style={{ "--i": 0 } as React.CSSProperties} aria-labelledby="discover-title">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
            <SparklesIcon width={14} height={14} />
            {event.edition} · {event.dateLabel}
          </p>
          <h1 id="discover-title" className="mt-4 max-w-2xl font-display text-[2.4rem] leading-[1.02] lg:text-[3.6rem]">
            Trois défis.
            <br />
            Une soirée.
            <br />
            <span className="bg-[linear-gradient(90deg,#ff6b6b,#4fd08a)] bg-clip-text text-transparent">{PRIZE_TOTAL} à gagner.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-7 text-white/80">
            Avant, pendant et après le gala, chaque défi vous rapproche des 5 000 000 Ar ou d’une mission tout inclus au Canada. Choisissez par où commencer.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#choisir" className={styles.btnPrimary}>
              Choisir un défi
              <ChevronRightIcon width={18} height={18} />
            </a>
            <Link href="/billet" className={styles.btnGhost}>
              <QrIcon width={18} height={18} />
              Mon billet
            </Link>
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-[12px] text-white/65">
            <div>
              <dt className="sr-only">Nombre de défis</dt>
              <dd><span className="block font-display text-[1.5rem] text-white">{challenges.length}</span>défis</dd>
            </div>
            <div>
              <dt className="sr-only">Participations</dt>
              <dd><span className="block font-display text-[1.5rem] text-white">{challenges.reduce((s, c) => s + c.participants, 0)}</span>participations</dd>
            </div>
            <div>
              <dt className="sr-only">Jours restants</dt>
              <dd><span className="block font-display text-[1.5rem] text-white">J-{days}</span>avant le gala</dd>
            </div>
          </dl>
        </section>

        <section id="choisir" className="scroll-mt-24" style={{ "--i": 1 } as React.CSSProperties} aria-labelledby="pick-title">
          <h2 id="pick-title" className="font-display text-[1.9rem] leading-tight lg:text-[2.4rem]">
            Choisissez le défi
            <br />
            que vous voulez relever.
          </h2>
          <div className="mt-8">
            <ChallengePicker
              items={challenges.map((c, i) => ({
                slug: c.slug,
                number: c.number,
                phase: c.phase,
                title: c.title,
                hook: c.hook,
                prize: c.prize,
                kind: c.kind,
                status: statuses[i],
              }))}
            />
          </div>
        </section>

        <p style={{ "--i": 2 } as React.CSSProperties} className="text-center text-[13px] text-white/55">
          <Link href="/defis" className="inline-flex items-center gap-1 underline-offset-4 hover:text-white hover:underline">
            <ArrowLeftIcon width={15} height={15} />
            Revenir à l’espace participant
          </Link>
        </p>
      </main>

      <nav className={styles.dock} aria-label="Navigation de l’espace défis">
        {challenges.map((c, i) => (
          <Link key={c.slug} href={`/decouvrir/${c.slug}`} className={`${styles.dockItem} ${i === featuredIndex ? styles.dockAccent : ""}`} aria-label={`Défi ${c.number} : ${c.title}`}>
            <span className={styles.dockNum} aria-hidden>{c.number}</span>
            Défi {c.number}
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
