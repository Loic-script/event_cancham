import { initials, type Person } from "@/lib/mock/data";

type AvatarProps = {
  person: Pick<Person, "firstName" | "lastName" | "hue" | "online"> & { photo?: string };
  size?: number;
  /** Affiche la pastille « en ligne » si la personne l'est. */
  presence?: boolean;
  className?: string;
};

// Avatar : la photo si la personne en a une, sinon ses initiales sur un
// dégradé dérivé de sa teinte.
export function Avatar({ person, size = 40, presence = false, className = "" }: AvatarProps) {
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.38),
    background: `linear-gradient(135deg, hsl(${person.hue} 52% 48%), hsl(${person.hue + 28} 55% 32%))`,
  };
  const dot = Math.max(8, Math.round(size * 0.26));

  return (
    <span className={`relative inline-grid shrink-0 select-none place-items-center overflow-hidden rounded-full font-semibold text-white ${className}`} style={style} aria-hidden>
      {person.photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- photo locale en data URL
        <img src={person.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        initials(person)
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
