import type { Person } from "@/lib/mock/data";

type AvatarProps = {
  person: Pick<Person, "firstName" | "lastName" | "hue" | "online"> & { photo?: string };
  size?: number;
  presence?: boolean;
  className?: string;
};

export function Avatar({ person, size = 40, presence = false, className = "" }: AvatarProps) {
  const dot = Math.max(9, Math.round(size * 0.28));

  return (
    <span className={`relative inline-block shrink-0 select-none rounded-full ${className}`} style={{ width: size, height: size }} aria-hidden>
      <span className="absolute inset-0 overflow-hidden rounded-full bg-[#c9ced4]">
        {person.photo ? (
          <img src={person.photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 64 64" width={size} height={size} className="block" aria-hidden>
            <circle cx="32" cy="24" r="11" fill="#f4f6f8" />
            <ellipse cx="32" cy="62" rx="24" ry="22" fill="#f4f6f8" />
          </svg>
        )}
      </span>
      {presence && person.online ? (
        <span
          className="absolute rounded-full bg-[#1a9e5a] shadow-[0_0_0_2.5px_var(--surface),0_1px_3px_rgba(15,29,44,0.35)]"
          style={{ width: dot, height: dot, right: 0, bottom: 0 }}
        />
      ) : null}
    </span>
  );
}
