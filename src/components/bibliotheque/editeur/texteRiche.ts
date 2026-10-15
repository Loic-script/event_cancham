import type { Align, Paragraphe, Run, Taille } from "@/lib/ressources/blocs";

const TAILLES_PX: Record<Taille, string> = { petit: "13.5px", grand: "19px", "tres-grand": "24px" };
export const COULEUR_DEFAUT = "#1b2430";

function echapper(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function runVersHtml(r: Run): string {
  let h = echapper(r.t);
  if (r.s) h = `<s>${h}</s>`;
  if (r.i) h = `<em>${h}</em>`;
  if (r.b) h = `<strong>${h}</strong>`;
  if (r.couleur || r.taille) {
    const style = [r.couleur ? `color:${r.couleur}` : "", r.taille ? `font-size:${TAILLES_PX[r.taille]}` : ""].filter(Boolean).join(";");
    h = `<span data-taille="${r.taille ?? ""}" style="${style}">${h}</span>`;
  }
  if (r.lien) h = `<a href="${echapper(r.lien)}">${h}</a>`;
  return h;
}

function runsVersHtml(runs: Run[]): string {
  return runs.length ? runs.map(runVersHtml).join("") : "<br>";
}

export function paragraphesVersHtml(paragraphes: Paragraphe[]): string {
  if (!paragraphes.length) return "<p><br></p>";
  return paragraphes
    .map((p) => {
      const style = p.align && p.align !== "left" ? ` style="text-align:${p.align}"` : "";
      if (p.type === "p") return `<p${style}>${runsVersHtml(p.items[0] ?? [])}</p>`;
      const tag = p.type;
      return `<${tag}${style}>${p.items.map((it) => `<li>${runsVersHtml(it)}</li>`).join("")}</${tag}>`;
    })
    .join("");
}

type Style = Omit<Run, "t">;

function versHex(c: string): string | undefined {
  const t = c.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(t)) return t;
  if (/^#[0-9a-f]{3}$/.test(t)) return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`;
  const m = t.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return `#${[m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, "0")).join("")}`;
  return undefined;
}

function tailleDepuis(el: HTMLElement): Taille | undefined {
  const d = el.getAttribute("data-taille");
  if (d === "petit" || d === "grand" || d === "tres-grand") return d;
  if (el.tagName === "FONT") {
    const s = Number(el.getAttribute("size"));
    if (s && s <= 2) return "petit";
    if (s === 5) return "grand";
    if (s >= 6) return "tres-grand";
  }
  const fs = parseFloat(el.style.fontSize);
  if (fs) {
    if (fs < 15) return "petit";
    if (fs >= 22) return "tres-grand";
    if (fs >= 17.5) return "grand";
  }
  return undefined;
}

function styleDe(el: HTMLElement, parent: Style): Style {
  const s: Style = { ...parent };
  const tag = el.tagName;
  if (tag === "B" || tag === "STRONG" || Number(el.style.fontWeight) >= 600 || el.style.fontWeight === "bold") s.b = true;
  if (tag === "I" || tag === "EM" || el.style.fontStyle === "italic") s.i = true;
  if (tag === "S" || tag === "STRIKE" || tag === "DEL" || el.style.textDecoration.includes("line-through")) s.s = true;
  if (tag === "A") {
    const href = el.getAttribute("href");
    if (href) s.lien = href;
  }
  const couleur = versHex(el.getAttribute("color") ?? el.style.color ?? "");
  if (couleur) s.couleur = couleur === COULEUR_DEFAUT ? undefined : couleur;
  const taille = tailleDepuis(el);
  if (taille) s.taille = taille;
  return s;
}

function collecter(noeud: Node, style: Style, sortie: Run[]) {
  if (noeud.nodeType === Node.TEXT_NODE) {
    const t = (noeud.textContent ?? "").replace(/ /g, " ").replace(/[\r\n]+/g, " ");
    if (t) sortie.push({ t, ...Object.fromEntries(Object.entries(style).filter(([, v]) => v !== undefined && v !== false)) });
    return;
  }
  if (noeud.nodeType !== Node.ELEMENT_NODE) return;
  const el = noeud as HTMLElement;
  if (el.tagName === "BR") return;
  const s = styleDe(el, style);
  el.childNodes.forEach((n) => collecter(n, s, sortie));
}

function fusionner(runs: Run[]): Run[] {
  const sortie: Run[] = [];
  for (const r of runs) {
    const prec = sortie[sortie.length - 1];
    if (prec && prec.b === r.b && prec.i === r.i && prec.s === r.s && prec.lien === r.lien && prec.couleur === r.couleur && prec.taille === r.taille) prec.t += r.t;
    else sortie.push({ ...r });
  }
  return sortie;
}

function runsDe(el: Node): Run[] {
  const r: Run[] = [];
  el.childNodes.forEach((n) => collecter(n, {}, r));
  return fusionner(r);
}

function alignDe(el: HTMLElement): Align {
  const a = el.style.textAlign || el.getAttribute("align") || "";
  return a === "center" || a === "right" ? a : "left";
}

const BLOCS = new Set(["P", "DIV", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "SECTION", "PRE"]);
const EN_LIGNE = new Set(["SPAN", "B", "STRONG", "I", "EM", "S", "STRIKE", "DEL", "A", "FONT", "U", "SUB", "SUP", "CODE"]);

export function htmlVersParagraphes(racine: HTMLElement): Paragraphe[] {
  const sortie: Paragraphe[] = [];
  let enLigne: Run[] = [];
  let alignEnLigne: Align = "left";
  const viderEnLigne = () => {
    if (enLigne.length) sortie.push({ type: "p", align: alignEnLigne, items: [fusionner(enLigne)] });
    enLigne = [];
  };
  const parcourir = (conteneur: Node, alignParent: Align) => {
    conteneur.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && EN_LIGNE.has((n as HTMLElement).tagName))) {
        if (!enLigne.length) alignEnLigne = alignParent;
        collecter(n, {}, enLigne);
        return;
      }
      if (n.nodeType !== Node.ELEMENT_NODE) return;
      const el = n as HTMLElement;
      if (el.tagName === "BR") {
        viderEnLigne();
        return;
      }
      viderEnLigne();
      const align = el.style.textAlign || el.getAttribute("align") ? alignDe(el) : alignParent;
      if (el.tagName === "UL" || el.tagName === "OL") {
        const items = Array.from(el.children)
          .filter((c) => c.tagName === "LI")
          .map((li) => runsDe(li));
        if (items.length) sortie.push({ type: el.tagName === "OL" ? "ol" : "ul", align, items });
        return;
      }
      if (Array.from(el.children).some((c) => BLOCS.has(c.tagName))) {
        parcourir(el, align);
        viderEnLigne();
        return;
      }
      sortie.push({ type: "p", align, items: [runsDe(el)] });
    });
  };
  parcourir(racine, "left");
  viderEnLigne();
  while (sortie.length > 1 && sortie[sortie.length - 1].type === "p" && !sortie[sortie.length - 1].items[0]?.length) sortie.pop();
  return sortie;
}
