"use client";

import { useRef, useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Cylinder, Loader2, Plus, X, ImagePlus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Recipient } from "@/app/generated/prisma/client";
import type { CartonSize, DrumSize } from "@/app/generated/prisma/enums";
import type { ClientForwarderRow } from "@/lib/client-data";
import { cn } from "@/lib/utils";
import { PARCEL_IMAGE_MAX_BYTES, normalizeImageContentType } from "@/lib/image-file-types";
import { uploadParcelImagesViaApi } from "@/lib/client/parcel-image-upload";
import { analyzeParcelPhotoWithAi } from "@/lib/client/parcel-photo-ai";
import {
  CURRENCY_SYMBOL,
  PRICING_TYPE_LABEL,
  sizedCartonTariffFromShipment,
  drumTariffFromShipment,
  CARTON_SIZE_LABEL_FR,
  DRUM_SIZE_LABEL_FR,
} from "@/lib/pricing";
import { countryLabelFr } from "@/lib/country-label-fr";
import type { TargetShipmentSummary } from "@/components/client/declare-target-shipment";
import { AddRecipientModal } from "@/components/client/add-recipient-modal";

const MAX_PHOTOS = 10;

function formatDateInfo(iso: string | null): string {
  if (!iso) return "date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

const inputCls =
  "h-10 w-full rounded-xl border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none placeholder:text-hh-muted/60 focus-visible:ring-2 focus-visible:ring-hh-saffron/40";

type PhotoEntry = { file: File; previewUrl: string };

const SIZES: DrumSize[] = ["SMALL", "MEDIUM", "LARGE"];

export type TieredParcelKind = "carton" | "drum";

type Props = {
  forwarders: ClientForwarderRow[];
  recipients: Recipient[];
  initialForwarderId?: string;
  targetShipmentId?: string;
  targetShipmentSummary?: TargetShipmentSummary;
  /** Si les deux types sont acceptés : ouvre sur carton ou fût */
  initialKind?: TieredParcelKind;
};

export function DeclareTieredParcelForm({
  forwarders,
  recipients,
  initialForwarderId,
  targetShipmentId,
  targetShipmentSummary,
  initialKind = "carton",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAlert, setAiAlert] = useState<string | null>(null);
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);

  const canCarton = !!targetShipmentSummary?.acceptsSizedCartons;
  const canDrum =
    !!targetShipmentSummary?.acceptsDrums &&
    targetShipmentSummary.transportMode === "SEA";

  const defaultKind: TieredParcelKind =
    initialKind === "drum" && canDrum
      ? "drum"
      : canCarton
        ? "carton"
        : "drum";

  const [kind, setKind] = useState<TieredParcelKind>(defaultKind);

  useEffect(() => {
    if (kind === "carton" && !canCarton && canDrum) setKind("drum");
    if (kind === "drum" && !canDrum && canCarton) setKind("carton");
  }, [kind, canCarton, canDrum]);

  const [forwarderId, setForwarderId] = useState(
    initialForwarderId ?? forwarders[0]?.id ?? "",
  );
  const [localRecipients, setLocalRecipients] = useState<Recipient[]>(recipients);
  const [recipientId, setRecipientId] = useState(recipients[0]?.id ?? "");
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [tierSize, setTierSize] = useState<DrumSize>("MEDIUM");
  const [contentHint, setContentHint] = useState("");
  const [notes, setNotes] = useState("");

  const tariffEstimate = useMemo(() => {
    const s = targetShipmentSummary;
    if (!s?.transportMode || !s.currency) return null;
    if (kind === "carton" && canCarton) {
      return sizedCartonTariffFromShipment(
        {
          acceptsSizedCartons: true,
          rateCartonSmall: s.rateCartonSmall ?? null,
          rateCartonMedium: s.rateCartonMedium ?? null,
          rateCartonLarge: s.rateCartonLarge ?? null,
          minimumCharge: s.minimumCharge ?? 0,
          currency: s.currency,
          destinationCountry: s.destinationCountry,
          transportMode: s.transportMode,
        },
        tierSize as CartonSize,
      );
    }
    if (kind === "drum" && canDrum) {
      return drumTariffFromShipment(
        {
          acceptsDrums: true,
          rateDrumSmall: s.rateDrumSmall ?? null,
          rateDrumMedium: s.rateDrumMedium ?? null,
          rateDrumLarge: s.rateDrumLarge ?? null,
          minimumCharge: s.minimumCharge ?? 0,
          currency: s.currency,
          destinationCountry: s.destinationCountry,
          transportMode: s.transportMode,
        },
        tierSize,
      );
    }
    return null;
  }, [targetShipmentSummary, kind, canCarton, canDrum, tierSize]);

  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyzePhotoWithAi(file: File) {
    setAiLoading(true);
    setAiAlert(null);
    try {
      const data = await analyzeParcelPhotoWithAi(file);
      if (!data) return;

      if (data.description?.trim()) {
        const d = data.description.trim().slice(0, 200);
        setContentHint((prev) => (prev.trim() ? prev : d));
      }
      if (data.customsAlert) {
        setAiAlert(data.customsAlert);
        setNotes((prev) => {
          if (prev.trim()) return prev;
          const line = `Note IA douanes : ${data.customsAlert}`;
          return line.slice(0, 500);
        });
      }
    } catch {
      // silencieux
    } finally {
      setAiLoading(false);
    }
  }

  function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    setPhotoErr(null);
    const prevLen = photos.length;
    const next = [...photos];
    let firstAdded: File | null = null;
    for (const file of Array.from(list)) {
      if (next.length >= MAX_PHOTOS) break;
      if (file.size > PARCEL_IMAGE_MAX_BYTES) {
        setPhotoErr(
          `Photo trop volumineuse (max ${Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo).`,
        );
        continue;
      }
      if (!normalizeImageContentType(file)) {
        setPhotoErr("Format non pris en charge (JPEG, PNG, WebP).");
        continue;
      }
      if (firstAdded === null) firstAdded = file;
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setPhotos(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (prevLen === 0 && next.length > 0 && firstAdded) {
      void analyzePhotoWithAi(firstAdded);
    }
  }

  function removePhoto(idx: number) {
    const entry = photos[idx];
    if (entry) URL.revokeObjectURL(entry.previewUrl);
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitLabel(null);

    if (!forwarderId) {
      setError("Sélectionne un transitaire.");
      return;
    }
    if (!recipientId) {
      setError("Sélectionne un destinataire.");
      return;
    }
    if (!targetShipmentId) {
      setError(
        "Choisis d’abord un envoi qui accepte ce type de colis (étape précédente).",
      );
      return;
    }
    if (kind === "carton" && !canCarton) {
      setError("Cet envoi n’accepte pas les cartons par taille.");
      return;
    }
    if (kind === "drum" && !canDrum) {
      setError("Cet envoi n’accepte pas les fûts (réservé au maritime).");
      return;
    }

    const tierPayload = {
      size: tierSize,
      contentHint: contentHint.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const payload =
      kind === "carton"
        ? {
            forwarderId,
            recipientId,
            shipmentId: targetShipmentId,
            sizedCarton: tierPayload,
          }
        : {
            forwarderId,
            recipientId,
            shipmentId: targetShipmentId,
            drum: tierPayload,
          };

    startTransition(async () => {
      setSubmitLabel("Création du colis…");
      const res = await fetch("/api/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as {
        id?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        setError(json?.error ?? `Erreur ${res.status}`);
        setSubmitLabel(null);
        return;
      }
      const parcelId = json?.id;
      if (!parcelId) {
        setError("Réponse inattendue du serveur.");
        setSubmitLabel(null);
        return;
      }

      let photoUploadFailed = false;
      if (photos.length > 0) {
        setSubmitLabel(`Envoi des photos (${photos.length})…`);
        const uploadResult = await uploadParcelImagesViaApi(
          parcelId,
          photos.map((p) => p.file),
        );
        if (!uploadResult.ok) photoUploadFailed = true;
      }

      setSubmitLabel("Intégration à l'envoi…");
      const reqRes = await fetch(`/api/shipments/${targetShipmentId}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ parcelId }),
      });
      if (!reqRes.ok) {
        setError(
          "Colis enregistré. L'affectation à cet envoi a échoué — ouvre la fiche colis pour réessayer.",
        );
      }

      const q = new URLSearchParams();
      if (photoUploadFailed) q.set("photoError", "1");
      router.push(
        `/client/parcels/${parcelId}${q.toString() ? `?${q.toString()}` : ""}`,
      );
    });
  }

  const remaining = MAX_PHOTOS - photos.length;
  const sizeLabels = kind === "carton" ? CARTON_SIZE_LABEL_FR : DRUM_SIZE_LABEL_FR;
  const accent =
    kind === "carton"
      ? "border-violet-200 bg-violet-50/80 text-violet-950"
      : "border-amber-200 bg-amber-50/80 text-amber-950";

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-6 rounded-2xl border bg-white p-6 shadow-sm",
        kind === "carton" ? "border-violet-100" : "border-amber-100",
      )}
    >
      {(targetShipmentSummary || initialForwarderId) && (
        <div className="rounded-[var(--hh-radius-lg)] border border-hh-saffron/25 bg-hh-saffron-lt/60 px-4 py-3 text-sm text-hh-nuit">
          {targetShipmentSummary ? (
            <>
              <p className="font-medium text-hh-earth-dk">Envoi concerné</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
                <span className="font-semibold text-hh-nuit">
                  {countryLabelFr(targetShipmentSummary.originCountry)}
                </span>
                <span className="text-hh-muted" aria-hidden>
                  →
                </span>
                <span className="font-semibold text-hh-nuit">
                  {targetShipmentSummary.destinationCity
                    ? `${targetShipmentSummary.destinationCity}, `
                    : ""}
                  {countryLabelFr(targetShipmentSummary.destinationCountry)}
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-[13px] text-hh-muted">
                <li>
                  <span className="text-hh-nuit/80">Départ prévu : </span>
                  {formatDateInfo(targetShipmentSummary.departureDate)}
                </li>
                {targetShipmentSummary.arrivalDate ? (
                  <li>
                    <span className="text-hh-nuit/80">Arrivée estimée : </span>
                    {formatDateInfo(targetShipmentSummary.arrivalDate)}
                  </li>
                ) : null}
              </ul>
              <p className="mt-2 border-t border-hh-saffron/20 pt-2 font-mono text-[11px] text-hh-muted">
                Réf. interne : {targetShipmentSummary.reference}
              </p>
              {targetShipmentId ? (
                <span className="mt-2 block text-[13px] text-hh-muted">
                  Après la déclaration, une demande pour intégrer ce colis à cet envoi sera envoyée au
                  transitaire.
                </span>
              ) : (
                <span className="mt-2 block text-[13px] text-amber-800">
                  Cet envoi n&apos;accepte plus de nouvelles demandes automatiques — tu peux quand même
                  enregistrer le colis et contacter le transitaire.
                </span>
              )}
            </>
          ) : (
            <span>
              Transitaire présélectionné — tu peux le vérifier dans la liste ci-dessous si besoin.
            </span>
          )}
        </div>
      )}

      <div>
        <h2 className="text-[16px] font-semibold text-hh-earth-dk">
          Colis par palier (taille S / M / L)
        </h2>
        <p className="mt-1 text-[13px] text-hh-muted">
          Même démarche pour un carton standard ou un fût : tu choisis la taille, pas les
          dimensions au centimètre près.
        </p>
      </div>

      {canCarton && canDrum ? (
        <div className="flex gap-2 rounded-2xl bg-hh-earth-lt/60 p-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => setKind("carton")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all",
              kind === "carton"
                ? "bg-white text-violet-800 shadow-sm ring-1 ring-violet-200"
                : "text-hh-muted hover:text-hh-earth-dk",
            )}
          >
            <Box className="size-4 shrink-0" />
            Carton
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setKind("drum")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all",
              kind === "drum"
                ? "bg-white text-amber-900 shadow-sm ring-1 ring-amber-200"
                : "text-hh-muted hover:text-hh-earth-dk",
            )}
          >
            <Cylinder className="size-4 shrink-0" />
            Fût
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-hh-muted">
            Transitaire
          </Label>
          <select
            value={forwarderId}
            onChange={(e) => setForwarderId(e.target.value)}
            required
            disabled={pending || !!initialForwarderId}
            className={inputCls}
          >
            {forwarders.map((fw) => (
              <option key={fw.id} value={fw.id}>
                {fw.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-hh-muted">
              Destinataire
            </Label>
            <button
              type="button"
              onClick={() => setShowAddRecipient(true)}
              disabled={pending}
              className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-hh-saffron-dk hover:underline disabled:opacity-50"
            >
              <Plus size={12} strokeWidth={2.5} />
              Nouveau
            </button>
          </div>
          <select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            required
            disabled={pending}
            className={inputCls}
          >
            {localRecipients.length === 0 ? (
              <option value="">Ajoute un destinataire (bouton Nouveau)</option>
            ) : null}
            {localRecipients.map((r) => (
              <option key={r.id} value={r.id}>
                {r.firstName} {r.lastName} — {r.city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label className="text-[12px] text-hh-muted">Taille (palier)</Label>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SIZES.map((sz) => (
            <button
              key={sz}
              type="button"
              disabled={pending}
              onClick={() => setTierSize(sz)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left text-[13px] font-medium transition",
                tierSize === sz
                  ? cn("ring-2", accent, "border-transparent")
                  : "border-hh-sand-dk/30 bg-hh-sand/30 text-hh-earth-dk hover:bg-hh-sand/50",
              )}
            >
              {sizeLabels[sz]}
            </button>
          ))}
        </div>
      </div>

      {tariffEstimate ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-[13px]",
            kind === "carton"
              ? "border-violet-100 bg-violet-50/80 text-violet-900"
              : "border-amber-100 bg-amber-50/80 text-amber-900",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
            Tarif indicatif
          </p>
          <p className="mt-1 text-[20px] font-semibold tabular-nums">
            {new Intl.NumberFormat("fr-FR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(tariffEstimate.calculatedPrice)}{" "}
            <span className="text-[15px] font-medium opacity-90">
              {CURRENCY_SYMBOL[tariffEstimate.currency]}
            </span>
          </p>
          <p className="mt-1 text-[11px] opacity-90">
            {PRICING_TYPE_LABEL[tariffEstimate.pricingType]} · non contractuel
          </p>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-hh-sand-dk/35 bg-hh-sand/40 px-4 py-3 text-[12px] text-hh-muted">
          Tarif non affiché : paliers ou devise manquants sur l&apos;envoi — le transitaire
          confirmera.
        </p>
      )}

      <StepPhotosTiered
        imageEntries={photos}
        onAddFiles={addPhotos}
        onRemove={removePhoto}
        localError={photoErr}
        aiLoading={aiLoading}
      />
      {aiAlert ? (
        <p className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
          {aiAlert}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="tier-hint" className="text-[12px] text-hh-muted">
          Contenu (optionnel)
        </Label>
        <Input
          id="tier-hint"
          value={contentHint}
          onChange={(e) => setContentHint(e.target.value)}
          disabled={pending || aiLoading}
          maxLength={200}
          placeholder={
            kind === "carton" ? "Ex. vêtements, livres…" : "Ex. huile, produits chimiques…"
          }
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tier-notes" className="text-[12px] text-hh-muted">
          Notes pour le transitaire (optionnel)
        </Label>
        <textarea
          id="tier-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={pending || aiLoading}
          maxLength={500}
          rows={3}
          className={cn(inputCls, "min-h-[88px] resize-y py-2")}
          placeholder="Fragile, UN…"
        />
      </div>

      {error ? (
        <p className="text-[13px] text-hh-kola" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className={cn(
          "w-full text-white hover:opacity-95 sm:w-auto",
          kind === "carton" ? "bg-violet-600 hover:bg-violet-700" : "bg-amber-700 hover:bg-amber-800",
        )}
      >
        {pending && submitLabel ? submitLabel : "Déclarer ce colis"}
      </Button>

      <AddRecipientModal
        open={showAddRecipient}
        onClose={() => setShowAddRecipient(false)}
        onCreated={(r) => {
          setLocalRecipients((prev) => [...prev, r]);
          setRecipientId(r.id);
          setShowAddRecipient(false);
        }}
      />
    </form>
  );
}

function StepPhotosTiered({
  imageEntries,
  onAddFiles,
  onRemove,
  localError,
  aiLoading,
}: {
  imageEntries: PhotoEntry[];
  onAddFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  localError: string | null;
  aiLoading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-medium text-hh-earth-dk">Photos du colis</h2>
          <p className="mt-0.5 text-[12px] text-hh-muted">
            Optionnel · jusqu&apos;à {MAX_PHOTOS} photos (JPEG, PNG, WebP · max{" "}
            {Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo).
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-hh-saffron/8 px-2.5 py-1 text-[10px] font-semibold text-hh-saffron-dk">
          {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
          Analyse IA
        </div>
      </div>

      {imageEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {imageEntries.map((entry, i) => (
            <div key={entry.previewUrl} className="group relative aspect-square overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.previewUrl} alt={entry.file.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Supprimer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {imageEntries.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-hh-sand-dk/50 text-hh-muted transition-colors hover:border-hh-saffron/50 hover:text-hh-saffron-dk"
            >
              <ImagePlus size={20} strokeWidth={1.5} />
              <span className="text-[10px]">Ajouter</span>
            </button>
          )}
        </div>
      )}

      {imageEntries.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-hh-sand-dk/50 py-10 transition-colors hover:border-hh-saffron/50 hover:bg-hh-saffron-lt/30"
        >
          <ImagePlus size={28} strokeWidth={1.2} className="text-hh-saffron/70" />
          <div className="text-center">
            <p className="text-[14px] font-medium text-hh-earth-dk/70">Ajouter des photos</p>
            <p className="mt-0.5 text-[11px] text-hh-muted">
              L&apos;IA analysera le contenu automatiquement ✨
            </p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => onAddFiles(e.target.files)}
      />

      {localError && (
        <p className="text-[12px] text-hh-kola" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}
