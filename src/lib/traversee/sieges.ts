"use client";

import { siegesInitiaux, type Sieges } from "./data";
import { setTraversee, type TraverseeState } from "./store";

let initiaux: Sieges | null = null;

export function siegesDe(s: TraverseeState): Sieges {
  if (s.sieges) return s.sieges;
  if (!initiaux) initiaux = siegesInitiaux();
  return initiaux;
}

export function occupation(s: TraverseeState, n: number) {
  return siegesDe(s)[n].filter(Boolean).length + (s.table === n && !siegesDe(s)[n][s.siege ?? -1] ? 1 : 0);
}

export function libresTotal(s: TraverseeState) {
  let l = 0;
  for (let i = 1; i <= 24; i++) l += 10 - occupation(s, i);
  return l;
}

export function aLaTable(s: TraverseeState, n: number, ent: string) {
  return siegesDe(s)[n].some((c) => c && c.ent === ent);
}

export function modifieSieges(fn: (sieges: Sieges) => void) {
  setTraversee((s) => {
    const copie: Sieges = {};
    const src = siegesDe(s);
    for (const k of Object.keys(src)) copie[Number(k)] = [...src[Number(k)]];
    fn(copie);
    return { sieges: copie };
  });
}
