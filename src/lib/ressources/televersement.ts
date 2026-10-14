export function lireEnteteJson(valeur: string | null): unknown {
  if (!valeur) return null;
  try {
    return JSON.parse(decodeURIComponent(valeur));
  } catch {
    return null;
  }
}

export function nomFichierEntete(valeur: string | null): string {
  if (!valeur) return "fichier";
  try {
    return decodeURIComponent(valeur).replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0, 180) || "fichier";
  } catch {
    return "fichier";
  }
}
