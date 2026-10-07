import type { SVGProps } from "react";

type LogoProps = SVGProps<SVGSVGElement> & { size?: number };

// Logos des réseaux sociaux redessinés en SVG : pastille aux couleurs de la
// marque, glyphe blanc, aucun fond.

export function FacebookLogo({ size = 40, ...props }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...props}>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        d="M13.4 21v-7.1h2.4l.36-2.8H13.4V9.3c0-.8.23-1.36 1.38-1.36h1.47V5.44c-.26-.03-1.13-.11-2.14-.11-2.12 0-3.57 1.29-3.57 3.67v2.1H8.1v2.8h2.44V21z"
        fill="#fff"
      />
    </svg>
  );
}

export function InstagramLogo({ size = 40, ...props }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden {...props}>
      <defs>
        <radialGradient id="ig-grad" cx="0.3" cy="1.07" r="1.5">
          <stop offset="0" stopColor="#fdf497" />
          <stop offset="0.05" stopColor="#fdf497" />
          <stop offset="0.45" stopColor="#fd5949" />
          <stop offset="0.6" stopColor="#d6249f" />
          <stop offset="0.9" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#ig-grad)" />
      <rect x="13" y="13" width="22" height="22" rx="6.5" fill="none" stroke="#fff" strokeWidth="2.6" />
      <circle cx="24" cy="24" r="5.2" fill="none" stroke="#fff" strokeWidth="2.6" />
      <circle cx="30.3" cy="17.7" r="1.6" fill="#fff" />
    </svg>
  );
}

export function LinkedinLogo({ size = 40, ...props }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...props}>
      <circle cx="12" cy="12" r="12" fill="#0A66C2" />
      <path
        d="M7.1 9.6h2.3V17H7.1zM8.25 6a1.33 1.33 0 1 1 0 2.66 1.33 1.33 0 0 1 0-2.66zM10.8 9.6H13v1.01h.03c.31-.58 1.06-1.19 2.18-1.19 2.33 0 2.76 1.53 2.76 3.53V17h-2.3v-3.6c0-.86-.02-1.96-1.2-1.96-1.2 0-1.38.93-1.38 1.9V17h-2.3z"
        fill="#fff"
      />
    </svg>
  );
}
