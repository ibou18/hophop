"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2 } from "lucide-react";

interface Props {
  onDetected: (code: string) => void;
  active: boolean;
}

/**
 * Composant caméra QR utilisant @zxing/browser.
 * Chargé dynamiquement côté client pour éviter les erreurs SSR.
 */
export function QrCameraScanner({ onDetected, active }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  /** Retour de `decodeFromConstraints` — expose `stop()`, pas `reset()`. */
  const readerRef = useRef<{ stop: () => void | Promise<void> } | null>(null);

  function disposeScanner(): void {
    const c = readerRef.current;
    readerRef.current = null;
    if (!c?.stop) return;
    try {
      void Promise.resolve(c.stop());
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!active) {
      disposeScanner();
      setState("idle");
      return;
    }

    let cancelled = false;
    setState("loading");

    async function startScan() {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");

        if (cancelled) return;

        const reader = new BrowserQRCodeReader();

        if (!videoRef.current) return;
        setState("ready");

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              const text = result.getText();
              // Accepte les codes HOP-XXXXX ou texte brut
              const clean = text.trim().toUpperCase();
              onDetected(clean);
            }
            // Ignore errors (no QR in frame)
            void err;
          },
        );

        readerRef.current = controls;
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Caméra inaccessible";
        if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")) {
          setErrorMsg("Permission caméra refusée. Active-la dans les paramètres du navigateur.");
        } else {
          setErrorMsg("Impossible d'accéder à la caméra.");
        }
        setState("error");
      }
    }

    void startScan();

    return () => {
      cancelled = true;
      disposeScanner();
    };
  }, [active, onDetected]);

  return (
    <div className="relative overflow-hidden rounded-[var(--hh-radius-lg)] bg-black">
      <video
        ref={videoRef}
        className={`w-full object-cover transition-opacity duration-300 ${
          state === "ready" ? "opacity-100" : "opacity-0"
        }`}
        style={{ height: 260 }}
        playsInline
        muted
      />

      {/* Overlay states */}
      {state === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
          <CameraOff size={32} />
          <p className="text-[13px]">Caméra désactivée</p>
        </div>
      )}
      {state === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-[13px]">Démarrage de la caméra…</p>
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white/70">
          <Camera size={28} className="text-red-400" />
          <p className="text-[13px] text-red-300">{errorMsg}</p>
        </div>
      )}

      {/* Viseur QR quand ready */}
      {state === "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-44 w-44">
            {/* Coins du viseur */}
            <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-[6px] border-l-2 border-t-2 border-hh-saffron" />
            <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-[6px] border-r-2 border-t-2 border-hh-saffron" />
            <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-[6px] border-b-2 border-l-2 border-hh-saffron" />
            <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-[6px] border-b-2 border-r-2 border-hh-saffron" />
            {/* Ligne de scan animée */}
            <div
              className="absolute left-2 right-2 h-px bg-hh-saffron/70 animate-scan-line"
              style={{ top: "50%", boxShadow: "0 0 6px rgba(232,130,12,0.8)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
