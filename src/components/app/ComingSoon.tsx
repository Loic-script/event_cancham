import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "./icons";
import styles from "./app.module.css";

type ComingSoonProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function ComingSoon({ icon, title, description }: ComingSoonProps) {
  return (
    <section className={`${styles.card} mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-12 text-center`}>
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-palm-soft text-palm-ink">{icon}</span>
      <h2 className="font-display text-[1.6rem] leading-tight text-graphite">{title}</h2>
      <p className="text-[15px] leading-6 text-graphite-muted">{description}</p>
      <Link
        href="/communaute"
        className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-palm-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
      >
        En attendant, voir le fil de communauté
        <ChevronRightIcon width={18} height={18} />
      </Link>
    </section>
  );
}
