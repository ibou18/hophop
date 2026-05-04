"use client";

import { useRef, useState } from "react";
import {
  FORWARDER_LOGO_MAX_BYTES,
  normalizeImageContentType,
  PARCEL_IMAGE_MAX_BYTES,
} from "@/lib/image-file-types";
import { cn } from "@/lib/utils";

/**
 * Logo transitaire : envoi multipart vers l’API (`POST /api/uploads/forwarder-logo`), upload S3 côté serveur (pas de CORS).
 */
export function S3ImageUploadButton({
  label,
  disabled,
  className,
  maxNewFiles,
  maxBytes,
  onUploaded,
  onError,
}: {
  label: string;
  disabled?: boolean;
  className?: string;
  /** Nombre max de fichiers acceptés sur ce clic (ex. places restantes). */
  maxNewFiles: number;
  maxBytes: number;
  onUploaded: (urls: string[]) => void;
  onError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(list: FileList | null) {
    if (!list?.length || disabled || uploading || maxNewFiles <= 0) return;

    const files = Array.from(list).slice(0, maxNewFiles);
    setUploading(true);
    const urls: string[] = [];

    try {
      for (const file of files) {
        if (file.size > maxBytes) {
          onError?.(
            `Fichier trop volumineux (max ${Math.round(maxBytes / 1024 / 1024)} Mo).`,
          );
          continue;
        }
        const contentType = normalizeImageContentType(file);
        if (!contentType) {
          onError?.("Format d’image non pris en charge (JPEG, PNG, WebP, GIF).");
          continue;
        }

        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/uploads/forwarder-logo", {
          method: "POST",
          body: fd,
          credentials: "same-origin",
        });

        const raw = (await res.json().catch(() => null)) as
          | { url?: string; error?: string }
          | null;

        if (!res.ok || !raw?.url) {
          const msg =
            typeof raw?.error === "string"
              ? raw.error
              : `Échec de l’upload (${res.status}).`;
          onError?.(msg);
          continue;
        }

        urls.push(raw.url);
      }

      if (urls.length > 0) onUploaded(urls);
    } catch {
      onError?.("Erreur réseau pendant l’upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={maxNewFiles > 1}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || uploading || maxNewFiles <= 0}
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={disabled || uploading || maxNewFiles <= 0}
        onClick={() => inputRef.current?.click()}
        className={cn(
          uploading && "cursor-wait opacity-70",
          className,
        )}
      >
        {uploading ? "Envoi…" : label}
      </button>
    </>
  );
}

export const parcelImageMaxBytes = PARCEL_IMAGE_MAX_BYTES;
export const forwarderLogoMaxBytes = FORWARDER_LOGO_MAX_BYTES;
