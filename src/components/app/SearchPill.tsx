"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SearchIcon } from "./icons";
import styles from "./app.module.css";

export function SearchPill({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/communaute?q=${encodeURIComponent(q)}` : "/communaute");
  }

  return (
    <form onSubmit={submit} role="search" className={`${styles.search} ${className}`}>
      <SearchIcon width={18} height={18} className="shrink-0" />
      <label className="sr-only" htmlFor="global-search">Rechercher un participant</label>
      <input id="global-search" ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Rechercher un participant, une entreprise…" autoComplete="off" />
      <span className={styles.kbd} aria-hidden>/</span>
    </form>
  );
}
