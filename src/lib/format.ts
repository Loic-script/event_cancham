// Mise en forme des dates et durées, en français.

/** « à l'instant », « il y a 12 min », « il y a 3 h », « hier », « il y a 4 j ». */
export function relativeFromMinutes(minutesAgo: number): string {
  if (minutesAgo < 1) return "à l'instant";
  if (minutesAgo < 60) return `il y a ${minutesAgo} min`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  return `il y a ${days} j`;
}

/** Version courte pour les listes serrées : « 12 min », « 3 h », « hier », « 4 j ». */
export function shortFromMinutes(minutesAgo: number): string {
  if (minutesAgo < 1) return "maintenant";
  if (minutesAgo < 60) return `${minutesAgo} min`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  return `${days} j`;
}

/** Heure « 18:42 » à partir d'un décalage en minutes avant maintenant. */
export function clockFromMinutes(minutesAgo: number, now = new Date()): string {
  const d = new Date(now.getTime() - minutesAgo * 60_000);
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
}

/** Nombre de jours entiers avant une date ISO (0 si passée). */
export function daysUntil(iso: string, now = new Date()): number {
  const target = new Date(iso).getTime();
  return Math.max(0, Math.ceil((target - now.getTime()) / 86_400_000));
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Indian/Antananarivo" }).format(new Date(iso));
}
