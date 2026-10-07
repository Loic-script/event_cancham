import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le badge des outils de développement (bas gauche) recouvre les boutons
  // de la barre de saisie sur mobile ; les erreurs restent affichées.
  devIndicators: false,
};

export default nextConfig;
