import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/app/Avatar";
import { ArrowRightIcon, GlobeIcon, HeartIcon, SparklesIcon } from "@/components/app/icons";
import { StatusChip } from "@/components/challenges/StatusChip";
import coverStyles from "@/components/challenges/challenges.module.css";
import styles from "@/components/challenges/landing.module.css";
import { challenges, challengeStatus } from "@/lib/mock/challenges";
import { participants } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Les défis" };

export const dynamic = "force-dynamic";

const SHOTS = [
  { src: "/stories/story-1.jpg", cls: "shotA" },
  { src: "/stories/story-6.jpg", cls: "shotB" },
  { src: "/stories/story-4.jpg", cls: "shotC" },
] as const;

const RIBBON = ["Défi 1 · J'y serai", "5 000 000 Ar", "Défi 2 · Pitch MECC", "Mission au Canada", "Défi 3 · J'y étais", "5 000 000 Ar"];

export default function ChallengesPage() {
  const total = challenges.reduce((n, c) => n + c.participants, 0);
  const faces = participants.slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl">
      <section className={`${styles.hero} m-bleed`} aria-labelledby="defis-title">
        <span className={`${styles.blob} ${styles.blobRed}`} aria-hidden />
        <span className={`${styles.blob} ${styles.blobGreen}`} aria-hidden />
        <span className={`${styles.blob} ${styles.blobBlue}`} aria-hidden />
        <span className={styles.grid} aria-hidden />

        <div className="relative">
          <span className={styles.eyebrow}>
            <i aria-hidden />
            Gala des 10 ans · 18 décembre
          </span>
          <h1 id="defis-title" className={styles.title}>
            Trois défis.
            <br />
            <span className={styles.gradientText}>Des prix à la hauteur.</span>
          </h1>
          <p className={styles.lead}>Deux fois 5 000 000 Ar et une mission au Canada tout inclus. À vous de jouer.</p>
          <div className={styles.ctas}>
            <Link href="/decouvrir" className={styles.primary}>
              <SparklesIcon width={18} height={18} />
              Découvrir les défis
            </Link>
            <Link href="/reseaux" className={styles.ghost}>
              <GlobeIcon width={18} height={18} />
              Voir les publications
            </Link>
          </div>
        </div>

        <div className={styles.collage} aria-hidden>
          {SHOTS.map((s) => (
            <div key={s.src} className={`${styles.shot} ${styles[s.cls]}`}>
              <img src={s.src} alt="" loading="lazy" />
            </div>
          ))}
          <span className={`${styles.float} ${styles.floatA}`}>
            <span className={styles.avatars}>
              {faces.map((p) => (
                <Avatar key={p.id} person={p} size={22} />
              ))}
            </span>
            +{total} participations
          </span>
          <span className={`${styles.float} ${styles.floatB}`}>
            <span className={styles.heart}>
              <HeartIcon width={11} height={11} fill="currentColor" strokeWidth={0} />
            </span>
            312 réactions
          </span>
        </div>
      </section>

      <div className={styles.marquee} aria-hidden>
        <div className={styles.track}>
          {[0, 1].map((k) => (
            <span key={k}>
              {RIBBON.map((r, i) => (
                <span key={i}>
                  {r}
                  <i />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.posters}>
        {challenges.map((c) => (
          <Link key={c.slug} href={`/decouvrir/${c.slug}`} className={`${styles.poster} ${coverStyles[c.theme]} m-bleed`} aria-label={`Défi ${c.number} : ${c.title}`}>
            <span className={styles.posterNo} aria-hidden>0{c.number}</span>
            <span className={styles.posterChip}>
              <StatusChip status={challengeStatus(c)} />
            </span>
            <p className={styles.posterPhase}>{c.phase}</p>
            <h2 className={styles.posterTitle}>{c.title}</h2>
            <span className={styles.posterPrize}>{c.kind === "video" ? "Mission au Canada" : c.prize}</span>
            <p className={styles.posterHook}>{c.hook}</p>
            <span className={styles.posterGo}>
              Voir le défi
              <ArrowRightIcon width={16} height={16} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
