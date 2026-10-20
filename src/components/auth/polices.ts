import { IBM_Plex_Sans } from "next/font/google";

/** Police des pages hors coquille (connexion, inscription, parcours d'accueil). */
export const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
