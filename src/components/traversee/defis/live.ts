"use client";

import { useEffect, useState } from "react";

export function useLive(count: number, max: number, every = 2500) {
  const [inc, setInc] = useState<number[]>(() => Array.from({ length: count }, () => 0));
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setInc((prev) => {
        const next = prev.length === count ? [...prev] : Array.from({ length: count }, (_, i) => prev[i] ?? 0);
        for (let i = 0; i < next.length; i++) next[i] += Math.floor(Math.random() * max);
        return next;
      });
    }, every);
    return () => window.clearInterval(id);
  }, [count, max, every]);
  return inc.length === count ? inc : Array.from({ length: count }, (_, i) => inc[i] ?? 0);
}
