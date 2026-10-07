import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, InfoIcon, LockIcon, UsersIcon } from "@/components/app/icons";
import appStyles from "@/components/app/app.module.css";
import { ChallengeActions } from "@/components/challenges/ChallengeActions";
import { ChallengeCover } from "@/components/challenges/ChallengeCover";
import { RichText } from "@/components/challenges/RichText";
import { StatusChip } from "@/components/challenges/StatusChip";
import styles from "@/components/challenges/challenges.module.css";
import { challengeBySlug, challengeStatus, opensAtLabel } from "@/lib/mock/challenges";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/defis/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = challengeBySlug(slug);
  return { title: c ? `Défi ${c.number} · ${c.title}` : "Les défis" };
}

export default async function ChallengePage(props: PageProps<"/defis/[slug]">) {
  const { slug } = await props.params;
  const c = challengeBySlug(slug);
  if (!c) notFound();
  const status = challengeStatus(c);

  return (
    <div className={`${appStyles.stagger} mx-auto flex max-w-2xl flex-col gap-5`}>
      <Link href="/defis" style={{ "--i": 0 } as React.CSSProperties} className="inline-flex w-fit items-center gap-1.5 text-[13.5px] font-semibold text-palm-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline">
        <ArrowLeftIcon width={16} height={16} />
        Tous les défis
      </Link>

      <ChallengeCover challenge={c} className={styles.hero}>
        <div className="absolute right-4 top-4">
          <StatusChip status={status} />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/80">Défi {c.number} · {c.phase}</p>
          <h1 className="mt-1 font-display text-[2rem] leading-[1.05] lg:text-[2.5rem]">{c.title}</h1>
        </div>
      </ChallengeCover>

      <section style={{ "--i": 1 } as React.CSSProperties}>
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-[2.2rem] leading-none text-palm-ink">{c.prize}</span>
          <span className="text-[15px] text-graphite-muted">{c.prizeNote}</span>
        </p>
        {c.participants > 0 ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-graphite-faint">
            <UsersIcon width={15} height={15} />
            {c.participants} participations à ce jour
          </p>
        ) : null}
      </section>

      <ol style={{ "--i": 2 } as React.CSSProperties} className="flex flex-col gap-4">
        {c.steps.map((step, i) => (
          <li key={i} className={styles.step}>
            <span className={styles.stepNo}>{i + 1}</span>
            <p className="pt-1 text-[15px] leading-6 text-graphite-muted">
              <RichText text={step} />
            </p>
          </li>
        ))}
      </ol>

      <div style={{ "--i": 3 } as React.CSSProperties} className="flex flex-col gap-3">
        {c.notes.map((note, i) => (
          <p key={i} className="flex gap-2.5 rounded-2xl bg-paper px-4 py-3 text-[13.5px] leading-5 text-graphite-muted">
            <InfoIcon width={17} height={17} className="mt-0.5 shrink-0 text-graphite-faint" />
            <span>
              <RichText text={note} />
            </span>
          </p>
        ))}
        {c.requiresScan && status.key === "locked" ? (
          <p className="flex gap-2.5 rounded-2xl bg-paper px-4 py-3 text-[13.5px] leading-5 text-graphite">
            <LockIcon width={17} height={17} className="mt-0.5 shrink-0 text-graphite-muted" />
            <span className="font-semibold">S’ouvre après le scan de votre billet à l’entrée, le {opensAtLabel(c)}.</span>
          </p>
        ) : null}
      </div>

      {/* display: contents — le bouton collant doit avoir la colonne entière comme bloc conteneur */}
      <div style={{ display: "contents" }}>
        <ChallengeActions challenge={c} status={status} />
      </div>
    </div>
  );
}
