"use client";

import type { DefiType } from "../defis/Tuiles";
import { AdminCandidatures } from "./AdminCandidatures";
import { AdminClassement } from "./AdminClassement";

export function AdminDefi({ type }: { type: DefiType }) {
  return type === "pitch" ? <AdminCandidatures /> : <AdminClassement />;
}
