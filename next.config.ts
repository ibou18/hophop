import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Tunnel / accès non-localhost en dev (ex. webpack-hmr cross-origin)
  allowedDevOrigins: ["l.windeboile.win"],

  /** Racine du projet : évite que Turbopack prenne un lockfile parent (perf / logs parasites). */
  turbopack: {
    root: path.resolve(__dirname),
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
