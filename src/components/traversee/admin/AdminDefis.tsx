"use client";

import type { DefiType } from "../defis/Tuiles";
import { AdminCandidatures } from "./AdminCandidatures";

export function AdminDefi({ type }: { type: DefiType }) {
  return <AdminCandidatures defi={type} />;
}
