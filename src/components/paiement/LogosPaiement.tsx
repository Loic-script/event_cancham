import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

/** Marques des moyens de paiement, dessinées simplement (pas les logos officiels). */
export function LogoCarte({ size = 40, ...props }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden {...props}>
      <rect x="4" y="9" width="32" height="22" rx="4" fill="#12305a" />
      <rect x="4" y="14" width="32" height="4" fill="#0b1a30" />
      <rect x="8" y="21" width="9" height="6" rx="1.5" fill="#f3d58a" />
      <rect x="21" y="24" width="11" height="2.5" rx="1" fill="#ffffff" opacity="0.8" />
    </svg>
  );
}

export function LogoMvola({ size = 40, ...props }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden {...props}>
      <rect x="3" y="3" width="34" height="34" rx="9" fill="#1b7a3a" />
      <path d="M10 27V13h4l6 8 6-8h4v14h-4v-8l-6 8-6-8v8z" fill="#f5c400" />
    </svg>
  );
}

export function LogoOrangeMoney({ size = 40, ...props }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden {...props}>
      <rect x="3" y="3" width="34" height="34" rx="6" fill="#ff7900" />
      <rect x="9" y="25" width="22" height="6" fill="#ffffff" />
      <rect x="9" y="19" width="22" height="2.5" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

export function LogoAirtelMoney({ size = 40, ...props }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden {...props}>
      <circle cx="20" cy="20" r="17" fill="#e4002b" />
      <path d="M12 26c4-10 8-12 11-11 3 1 1 6-3 9-3 2-6 2-8 2zm9-2c3 0 7-2 8-6" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
