import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Tunnel / accès non-localhost en dev (ex. webpack-hmr cross-origin)
  allowedDevOrigins: ["l.windeboile.win"],

  /** Racine du projet : évite lockfile parent. Pas `import.meta.url` ici — compile config casse (exports ESM). */
  turbopack: {
    root: path.resolve(process.cwd()),
  },

  /**
   * Moins de bruit en dev : pas de GET ligne par ligne pour la session,
   * pas de logs fetch HMR à chaque sauvegarde, seules les erreurs navigateur → terminal.
   */
  logging: {
    incomingRequests: {
      ignore: [/^\/api\/auth\/session$/],
    },
    fetches: {
      hmrRefreshes: false,
    },
    browserToTerminal: "error",
  },
};

export default nextConfig;
