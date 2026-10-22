import type { NextConfig } from "next";

/** En-têtes de sécurité : pas d'affichage dans une page tierce, pas de devinette de type, caméra et micro pour le site seul. */
const ENTETES_SECURITE = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [{ source: "/(.*)", headers: ENTETES_SECURITE }];
  },
};

export default nextConfig;
