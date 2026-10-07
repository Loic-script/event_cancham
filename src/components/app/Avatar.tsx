import { initials, type Person } from "@/lib/mock/data";

type AvatarProps = {
  person: Pick<Person, "firstName" | "lastName" | "hue" | "online">;
  size?: number;
  /** Affiche la pastille « en ligne » si la personne l'est. */
  presence?: boolean;
  className?: string;
};

// Avatar à initiales : dégradé dérivé de la teinte de la personne, en
// attendant les vraies photos de profil.
export function Avatar({ person, size = 40, presence = false, className = "" }: AvatarProps) {
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.38),
    background: `linear-gradient(135deg, hsl(${person.hue} 52% 48%), hsl(${person.hue + 28} 55% 32%))`,
  };
  const dot = Math.max(8, Math.round(size * 0.26));

  return (
    <span className={`relative inline-grid shrink-0 select-none place-items-center rounded-full font-semibold text-white ${className}`} style={style} aria-hidden>
      {initials(person)}
      {presence && person.online ? (
        <span
          className="absolute rounded-full bg-palm-ink ring-2 ring-page-bg"
          style={{ width: dot, height: dot, right: -1, bottom: -1 }}
        />
      ) : null}
    </span>
  );
}
