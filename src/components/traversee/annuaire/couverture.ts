import type { CSSProperties } from "react";
import type { FicheComplete } from "@/lib/traversee/participants";

/**
 * Fond de la bannière d'une fiche : la photo de couverture du participant sous un voile bleu nuit, ou, sans couverture,
 * le logo IMPACT 261 centré sur un dégradé bleu nuit (`img` vaut alors le logo).
 */
export function styleCouverture(fiche: Pick<FicheComplete, "img" | "imgPosition" | "couvertureDefaut">, variante: "carte" | "fiche" = "carte"): CSSProperties {
  if (fiche.couvertureDefaut) {
    const fond = variante === "carte" ? "linear-gradient(120deg, #0b1a30 0%, #12305a 60%, #1f4f86 100%)" : "linear-gradient(160deg, #0a1626 0%, #12305a 55%, #2a4a7a 100%)";
    // Le premier fond est dessiné au-dessus : le logo, puis le dégradé opaque dessous.
    return {
      backgroundImage: `url(${fiche.img}), ${fond}`,
      backgroundSize: variante === "carte" ? "auto 46%, cover" : "auto 38%, cover",
      backgroundPosition: variante === "carte" ? "center, center" : "right 28px center, center",
      backgroundRepeat: "no-repeat",
    };
  }
  const voile = variante === "carte" ? "linear-gradient(120deg, rgba(15,29,44,.78), rgba(22,50,84,.45))" : "linear-gradient(160deg, rgba(10,22,38,.92) 0%, rgba(18,48,90,.72) 55%, rgba(242,107,29,.35) 100%)";
  return { backgroundImage: `${voile}, url(${fiche.img})`, backgroundPosition: `center ${fiche.imgPosition}%` };
}
