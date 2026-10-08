import type { Person } from "@/lib/mock/data";

type AvatarProps = {
  person: Pick<Person, "firstName" | "lastName" | "hue" | "online"> & { photo?: string };
  size?: number;
  /** Affiche la pastille « en ligne » si la personne l'est. */
  presence?: boolean;
  className?: string;
};

// Avatar : la photo si la personne en a une, sinon une silhouette neutre
// (tête et épaules claires sur un disque gris), identique pour tout le monde.
export function Avatar({ person, size = 40, presence = false, className = "" }: AvatarProps) {
  const dot = Math.max(8, Math.round(size * 0.26));

  return (
    <span
      className={`relative inline-grid shrink-0 select-none place-items-center overflow-hidden rounded-full bg-[#c9ced4] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {person.photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- photo locale en data URL
        <img src={person.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block" aria-hidden>
          <circle cx="32" cy="24" r="11" fill="#f4f6f8" />
          <ellipse cx="32" cy="62" rx="24" ry="22" fill="#f4f6f8" />
        </svg>
      )}
      {presence && person.online ? (
        <span
          className="absolute rounded-full bg-palm-ink ring-2 ring-page-bg"
          style={{ width: dot, height: dot, right: -1, bottom: -1 }}
        />
      ) : null}
    </span>
  );
}
