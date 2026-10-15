export type Align = "left" | "center" | "right";
export type Taille = "petit" | "grand" | "tres-grand";
export type Run = { t: string; b?: boolean; i?: boolean; s?: boolean; lien?: string; couleur?: string; taille?: Taille };
export type Paragraphe = { type: "p" | "ul" | "ol"; align?: Align; items: Run[][] };

export type BlocTitre = { id: string; type: "titre"; niveau: 2 | 3; texte: string; align: Align; couleur?: string };
export type BlocTexte = { id: string; type: "texte"; paragraphes: Paragraphe[] };
export type BlocPhoto = { id: string; type: "photo"; fichier: string | null; legende: string };
export type BlocVideo = { id: string; type: "video"; fichier: string | null; url: string | null };
export type Bloc = BlocTitre | BlocTexte | BlocPhoto | BlocVideo;

export const COULEURS: { nom: string; valeur: string }[] = [
  { nom: "Bleu nuit", valeur: "#12305a" },
  { nom: "Orange", valeur: "#d9560c" },
  { nom: "Vert", valeur: "#007140" },
  { nom: "Rouge", valeur: "#ad0707" },
  { nom: "Gris", valeur: "#4f6072" },
];

const COULEUR = /^#[0-9a-f]{6}$/i;
const NOM_FICHIER_BLOC = /^[a-z0-9-]{8,64}\.(webp|mp4)$/;
const ID_BLOC = /^[a-z0-9-]{4,64}$/i;

function texte(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\u0000/g, "").slice(0, max) : "";
}

function align(v: unknown): Align {
  return v === "center" || v === "right" ? v : "left";
}

function couleur(v: unknown): string | undefined {
  return typeof v === "string" && COULEUR.test(v) ? v.toLowerCase() : undefined;
}

export function lienSur(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const brut = v.trim();
  if (!brut) return undefined;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(brut)) return brut;
  const avecSchema = /^https?:\/\//i.test(brut) ? brut : `https://${brut}`;
  try {
    const u = new URL(avecSchema);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function run(v: unknown): Run | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const t = texte(o.t, 5000);
  if (!t) return null;
  const r: Run = { t };
  if (o.b === true) r.b = true;
  if (o.i === true) r.i = true;
  if (o.s === true) r.s = true;
  const l = lienSur(o.lien);
  if (l) r.lien = l;
  const c = couleur(o.couleur);
  if (c) r.couleur = c;
  if (o.taille === "petit" || o.taille === "grand" || o.taille === "tres-grand") r.taille = o.taille;
  return r;
}

function paragraphe(v: unknown): Paragraphe | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const type = o.type === "ul" || o.type === "ol" ? o.type : "p";
  const items = (Array.isArray(o.items) ? o.items : [])
    .slice(0, 200)
    .map((item) => (Array.isArray(item) ? item.slice(0, 400).map(run).filter((x): x is Run => x !== null) : []))
    .filter((item, i, tous) => item.length > 0 || (type === "p" && tous.length === 1));
  if (!items.length) return null;
  return { type, align: align(o.align), items: type === "p" ? [items.flat()] : items };
}

export function nomFichierBlocValide(nom: unknown): nom is string {
  return typeof nom === "string" && NOM_FICHIER_BLOC.test(nom);
}

export function nettoyerBlocs(entree: unknown): Bloc[] {
  if (!Array.isArray(entree)) return [];
  const vus = new Set<string>();
  const sortie: Bloc[] = [];
  for (const brut of entree.slice(0, 300)) {
    if (!brut || typeof brut !== "object") continue;
    const o = brut as Record<string, unknown>;
    let id = typeof o.id === "string" && ID_BLOC.test(o.id) ? o.id : "";
    if (!id || vus.has(id)) id = `b-${sortie.length}-${Math.random().toString(36).slice(2, 10)}`;
    vus.add(id);
    if (o.type === "titre") {
      const t = texte(o.texte, 300).trim();
      if (!t) continue;
      sortie.push({ id, type: "titre", niveau: o.niveau === 3 ? 3 : 2, texte: t, align: align(o.align), ...(couleur(o.couleur) ? { couleur: couleur(o.couleur) } : {}) });
    } else if (o.type === "texte") {
      const paragraphes = (Array.isArray(o.paragraphes) ? o.paragraphes : []).slice(0, 300).map(paragraphe).filter((p): p is Paragraphe => p !== null);
      if (paragraphes.length) sortie.push({ id, type: "texte", paragraphes });
    } else if (o.type === "photo") {
      sortie.push({ id, type: "photo", fichier: nomFichierBlocValide(o.fichier) && o.fichier.endsWith(".webp") ? o.fichier : null, legende: texte(o.legende, 300).trim() });
    } else if (o.type === "video") {
      const fichier = nomFichierBlocValide(o.fichier) && o.fichier.endsWith(".mp4") ? o.fichier : null;
      const url = !fichier && typeof o.url === "string" && integration(o.url) ? o.url.trim() : null;
      sortie.push({ id, type: "video", fichier, url });
    }
  }
  return sortie;
}

export function fichiersUtilises(blocs: readonly Bloc[]): Set<string> {
  const s = new Set<string>();
  for (const b of blocs) {
    if ((b.type === "photo" || b.type === "video") && b.fichier) s.add(b.fichier);
  }
  return s;
}

export function premierePhoto(blocs: readonly Bloc[]): string | null {
  for (const b of blocs) if (b.type === "photo" && b.fichier) return b.fichier;
  return null;
}

export function texteBrut(blocs: readonly Bloc[]): string {
  return blocs
    .map((b) => {
      if (b.type === "titre") return b.texte;
      if (b.type === "texte") return b.paragraphes.map((p) => p.items.map((it) => it.map((r) => r.t).join("")).join(" ")).join(" ");
      if (b.type === "photo") return b.legende;
      return "";
    })
    .join(" ");
}

export function dureeLecture(blocs: readonly Bloc[]): string {
  const mots = texteBrut(blocs).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(mots / 200))} min de lecture`;
}

export type Integration = { fournisseur: "YouTube" | "Vimeo" | "Google Drive"; src: string };

export function integration(brut: string): Integration | null {
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(brut.trim()) ? brut.trim() : `https://${brut.trim()}`);
  } catch {
    return null;
  }
  const hote = u.hostname.replace(/^www\.|^m\./, "").toLowerCase();
  let id: string | null = null;
  if (hote === "youtu.be") id = u.pathname.slice(1).split("/")[0] || null;
  else if (hote === "youtube.com" || hote === "youtube-nocookie.com") {
    id = u.searchParams.get("v") ?? (u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] ?? null);
  }
  if (id && /^[\w-]{6,20}$/.test(id)) return { fournisseur: "YouTube", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` };
  if (hote === "vimeo.com" || hote === "player.vimeo.com") {
    const v = u.pathname.match(/(\d{6,12})/)?.[1];
    if (v) return { fournisseur: "Vimeo", src: `https://player.vimeo.com/video/${v}?dnt=1` };
  }
  if (hote === "drive.google.com") {
    const d = u.pathname.match(/\/file\/d\/([\w-]{10,})/)?.[1] ?? u.searchParams.get("id");
    if (d && /^[\w-]{10,}$/.test(d)) return { fournisseur: "Google Drive", src: `https://drive.google.com/file/d/${d}/preview` };
  }
  return null;
}
