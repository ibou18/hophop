"use client";

import { useRef, useState, useTransition, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Car, CheckCircle, Camera, X, ImageIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Recipient } from "@/app/generated/prisma/client";
import type { ClientForwarderRow } from "@/lib/client-data";
import { cn } from "@/lib/utils";
import { PARCEL_IMAGE_MAX_BYTES, normalizeImageContentType } from "@/lib/image-file-types";
import { uploadParcelImagesViaApi } from "@/lib/client/parcel-image-upload";
import {
  CURRENCY_SYMBOL,
  PRICING_TYPE_LABEL,
  vehicleTariffFromShipment,
} from "@/lib/pricing";
import type { TargetShipmentSummary } from "@/components/client/declare-target-shipment";
import { CAR_MAKES, getModelsForMake, VEHICLE_COLORS } from "@/lib/car-data";

type FuelType = "GASOLINE" | "DIESEL" | "ELECTRIC" | "HYBRID" | "OTHER";
type Condition = "RUNNING" | "NON_RUNNING";

// ─── Combobox filtré (marque / modèle) ────────────────────────────────────────

function VehicleCombobox({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.toLowerCase();
    return q.length === 0
      ? options.slice(0, 60)
      : options.filter((o) => o.toLowerCase().includes(q)).slice(0, 10);
  }, [value, options]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
  }, []);

  return (
    <div ref={wrapRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <input
          id={id}
          autoComplete="off"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={cn(inputCls, "pr-8")}
        />
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-hh-muted"
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-hh-sand-dk/30 bg-white shadow-lg">
          {filtered.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                tabIndex={0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  "w-full px-3 py-2 text-left text-[13px] text-hh-earth-dk hover:bg-hh-saffron-lt/60",
                  opt === value && "font-medium text-hh-saffron-dk bg-hh-saffron-lt/40",
                )}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const MAX_PHOTOS = 10;

const FUEL_OPTIONS: { value: FuelType; label: string; icon: string }[] = [
  { value: "GASOLINE", label: "Essence",    icon: "⛽" },
  { value: "DIESEL",   label: "Diesel",     icon: "🛢️" },
  { value: "ELECTRIC", label: "Électrique", icon: "⚡" },
  { value: "HYBRID",   label: "Hybride",    icon: "🔋" },
  { value: "OTHER",    label: "Autre",      icon: "❓" },
];

const inputCls =
  "h-10 w-full rounded-xl border border-hh-sand-dk/35 bg-white px-3 text-[15px] text-hh-earth-dk outline-none placeholder:text-hh-muted/60 focus-visible:ring-2 focus-visible:ring-hh-saffron/40";

type PhotoEntry = { file: File; previewUrl: string };

type Props = {
  forwarders: ClientForwarderRow[];
  recipients: Recipient[];
  initialForwarderId?: string;
  targetShipmentId?: string;
  /** Présent avec `?envoi=` — sert au tarif véhicule (ratePerVehicle). */
  targetShipmentSummary?: TargetShipmentSummary;
};

export function DeclareVehicleForm({
  forwarders,
  recipients,
  initialForwarderId,
  targetShipmentId,
  targetShipmentSummary,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);

  // Véhicule
  const [make,      setMake]      = useState("");
  const [model,     setModel]     = useState("");
  const [year,      setYear]      = useState(String(new Date().getFullYear()));
  const [color,     setColor]     = useState("");
  const [vin,       setVin]       = useState("");
  const [plate,     setPlate]     = useState("");
  const [fuelType,  setFuelType]  = useState<FuelType>("GASOLINE");
  const [condition, setCondition] = useState<Condition>("RUNNING");
  const [hasKeys,   setHasKeys]   = useState(true);
  const [note,      setNote]      = useState("");

  // Colis
  const [forwarderId, setForwarderId] = useState(initialForwarderId ?? forwarders[0]?.id ?? "");
  const [recipientId, setRecipientId] = useState(recipients[0]?.id ?? "");
  const [declaredValue, setDeclaredValue] = useState("");

  const vehicleTariffEstimate = useMemo(() => {
    const s = targetShipmentSummary;
    if (!s?.transportMode || !s.currency) return null;
    if (!s.acceptsVehicles) return null;
    return vehicleTariffFromShipment({
      ratePerKg: s.ratePerKg ?? null,
      ratePerBox: s.ratePerBox ?? null,
      flatRate: s.flatRate ?? null,
      ratePerVolume: s.ratePerVolume ?? null,
      ratePerVehicle: s.ratePerVehicle ?? null,
      volumeDivisor: s.volumeDivisor ?? 5000,
      minimumCharge: s.minimumCharge ?? 0,
      currency: s.currency,
      destinationCountry: s.destinationCountry,
      transportMode: s.transportMode,
    });
  }, [targetShipmentSummary]);

  // Photos
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => { photos.forEach((p) => URL.revokeObjectURL(p.previewUrl)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    setPhotoErr(null);
    const next = [...photos];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_PHOTOS) break;
      if (file.size > PARCEL_IMAGE_MAX_BYTES) {
        setPhotoErr(`Photo trop volumineuse (max ${Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo).`);
        continue;
      }
      if (!normalizeImageContentType(file)) {
        setPhotoErr("Format non pris en charge (JPEG, PNG, WebP, GIF).");
        continue;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setPhotos(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

    const yearInt = parseInt(year, 10);
    if (!make.trim() || !model.trim()) { setError("Marque et modèle requis."); return; }
    if (isNaN(yearInt) || yearInt < 1900 || yearInt > new Date().getFullYear() + 1) { setError("Année invalide."); return; }
    if (!forwarderId) { setError("Sélectionne un transitaire."); return; }
    if (!recipientId) { setError("Sélectionne un destinataire."); return; }

    const payload = {
      forwarderId,
      recipientId,
      ...(declaredValue.trim()
        ? { declaredValue: parseFloat(declaredValue.replace(",", ".")) }
        : {}),
      ...(targetShipmentId ? { shipmentId: targetShipmentId } : {}),
      vehicle: {
        make:           make.trim(),
        model:          model.trim(),
        year:           yearInt,
        color:          color.trim() || undefined,
        vin:            vin.trim() || undefined,
        plate:          plate.trim() || undefined,
        fuelType,
        condition,
        hasKeys,
        inspectionNote: note.trim() || undefined,
      },
    };

    startTransition(async () => {
      setSubmitLabel("Création du dossier…");
      const res = await fetch("/api/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null) as { id?: string; error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? `Erreur ${res.status}`);
        setSubmitLabel(null);
        return;
      }
      const parcelId = json?.id;
      if (!parcelId) { setError("Réponse inattendue du serveur."); setSubmitLabel(null); return; }

      let photoUploadFailed = false;
      if (photos.length > 0) {
        setSubmitLabel(`Envoi des photos (${photos.length})…`);
        const uploadResult = await uploadParcelImagesViaApi(
          parcelId,
          photos.map((p) => p.file),
        );
        if (!uploadResult.ok) {
          photoUploadFailed = true;
        }
      }

      if (targetShipmentId) {
        setSubmitLabel("Intégration à l'envoi…");
        const reqRes = await fetch(
          `/api/shipments/${targetShipmentId}/requests`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ parcelId }),
          },
        );
        if (!reqRes.ok) {
          setError(
          "Dossier enregistré. L'affectation à cet envoi a échoué — ouvre la fiche colis pour réessayer.",
          );
        }
      }

      const q = new URLSearchParams();
      if (photoUploadFailed) q.set("photoError", "1");
      router.push(
        `/client/parcels/${parcelId}${q.toString() ? `?${q.toString()}` : ""}`,
      );
    });
  }

  const remaining = MAX_PHOTOS - photos.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">

      {/* Transitaire + Destinataire */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-hh-muted">Transitaire</Label>
          <select
            value={forwarderId}
            onChange={(e) => setForwarderId(e.target.value)}
            required
            disabled={pending || !!initialForwarderId}
            className={inputCls}
          >
            {forwarders.map((fw) => (
              <option key={fw.id} value={fw.id}>{fw.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-hh-muted">Destinataire</Label>
          <select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            required
            disabled={pending}
            className={inputCls}
          >
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>
                {r.firstName} {r.lastName} — {r.city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Identité du véhicule */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Car className="size-4 text-indigo-600" />
          <h3 className="text-[14px] font-semibold text-hh-earth-dk">Identité du véhicule</h3>
        </div>

        {/* Marque + Modèle + Année */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="make" className="text-[12px] text-hh-muted">Marque *</Label>
            <VehicleCombobox
              id="make"
              value={make}
              onChange={(v) => { setMake(v); setModel(""); }}
              options={CAR_MAKES}
              placeholder="Toyota"
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vmodel" className="text-[12px] text-hh-muted">Modèle *</Label>
            <VehicleCombobox
              id="vmodel"
              value={model}
              onChange={setModel}
              options={getModelsForMake(make).length > 0 ? getModelsForMake(make) : []}
              placeholder={make ? "Corolla…" : "Choisir la marque d'abord"}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year" className="text-[12px] text-hh-muted">Année *</Label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              disabled={pending}
              className={inputCls}
            >
              {Array.from(
                { length: new Date().getFullYear() - 1979 + 2 },
                (_, i) => new Date().getFullYear() + 1 - i,
              ).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Couleur — chips visuelles */}
        <div className="mt-4 space-y-2">
          <Label className="text-[12px] text-hh-muted">Couleur</Label>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_COLORS.map(({ value: v, label, hex }) => (
              <button
                key={v}
                type="button"
                disabled={pending}
                onClick={() => setColor(color === v ? "" : v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                  color === v
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200"
                    : "border-hh-sand-dk/30 bg-white text-hh-earth-dk hover:bg-hh-sand/30",
                )}
              >
                <span
                  className="inline-block size-3 rounded-full border border-black/10 shrink-0"
                  style={{ background: hex }}
                />
                {label}
              </button>
            ))}
            {/* Autre couleur (saisie libre) */}
            {!VEHICLE_COLORS.some((c) => c.value === color) && color && (
              <span className="flex items-center gap-1.5 rounded-full border border-hh-saffron bg-hh-saffron-lt px-3 py-1.5 text-[12px] font-medium text-hh-saffron-dk">
                {color}
                <button type="button" onClick={() => setColor("")} className="ml-1">
                  <X size={10} />
                </button>
              </span>
            )}
          </div>
          {/* Input libre si couleur non listée */}
          <div className="flex gap-2">
            <Input
              value={VEHICLE_COLORS.some((c) => c.value === color) ? "" : color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Autre couleur…"
              disabled={pending}
              className={cn(inputCls, "max-w-[200px] text-[13px]")}
            />
          </div>
        </div>

        {/* Immatriculation + VIN */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="plate" className="text-[12px] text-hh-muted">Immatriculation</Label>
            <Input
              id="plate"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="ABC 1234"
              disabled={pending}
              className={cn(inputCls, "font-mono")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vin" className="text-[12px] text-hh-muted">
              VIN{" "}
              <span className="normal-case font-normal text-hh-muted/70">(optionnel)</span>
            </Label>
            <Input
              id="vin"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="1HGCM82633A…"
              disabled={pending}
              className={cn(inputCls, "font-mono")}
            />
            <p className="text-[11px] text-hh-muted">
              17 caractères — figurent sur la carte grise ou sous le pare-brise.
            </p>
          </div>
        </div>
      </div>

      {/* Carburant */}
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-hh-muted">Carburant</p>
        <div className="flex flex-wrap gap-2">
          {FUEL_OPTIONS.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              disabled={pending}
              onClick={() => setFuelType(value)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition",
                fuelType === value
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200"
                  : "border-hh-sand-dk/30 bg-white text-hh-muted hover:bg-hh-sand/30",
              )}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      </div>

      {/* État + clés */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-hh-muted">État du véhicule</p>
          <div className="flex gap-2">
            {(["RUNNING", "NON_RUNNING"] as Condition[]).map((c) => (
              <button
                key={c}
                type="button"
                disabled={pending}
                onClick={() => setCondition(c)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition",
                  condition === c
                    ? c === "RUNNING"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200"
                      : "border-red-400 bg-red-50 text-red-700 ring-2 ring-red-200"
                    : "border-hh-sand-dk/30 bg-white text-hh-muted hover:bg-hh-sand/30",
                )}
              >
                {c === "RUNNING" ? "✅ Fonctionnel" : "🔧 En panne"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-hh-muted">Clés présentes</p>
          <div className="flex gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                disabled={pending}
                onClick={() => setHasKeys(v)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition",
                  hasKeys === v
                    ? "border-hh-saffron bg-hh-saffron/10 text-hh-saffron-dk ring-2 ring-hh-saffron/20"
                    : "border-hh-sand-dk/30 bg-white text-hh-muted hover:bg-hh-sand/30",
                )}
              >
                {v ? "🔑 Oui" : "❌ Non"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Note d'inspection */}
      <div className="space-y-1.5">
        <Label htmlFor="insp-note" className="text-[12px] font-semibold uppercase tracking-wide text-hh-muted">
          Note d&apos;état (optionnel)
        </Label>
        <textarea
          id="insp-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={pending}
          placeholder="Rayures, bosses, accessoires, état général…"
          className="w-full rounded-xl border border-hh-sand-dk/35 bg-white px-3 py-2 text-[14px] text-hh-earth-dk outline-none placeholder:text-hh-muted/60 focus-visible:ring-2 focus-visible:ring-hh-saffron/40"
        />
      </div>

      {/* ── Photos du véhicule ───────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={14} className="text-indigo-600" />
            <p className="text-[12px] font-semibold uppercase tracking-wide text-hh-muted">
              Photos du véhicule
            </p>
          </div>
          <span className="text-[11px] text-hh-muted">
            {photos.length}/{MAX_PHOTOS}
          </span>
        </div>

        {/* Preview grid */}
        {photos.length > 0 && (
          <div className="mb-3 grid grid-cols-5 gap-2">
            {photos.map((p, idx) => (
              <div key={p.previewUrl} className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-hh-sand-dk/25">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removePhoto(idx)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  aria-label="Supprimer"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            {/* Add more slot */}
            {remaining > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-hh-sand-dk/40 bg-hh-sand/30 transition hover:bg-hh-sand/60 disabled:opacity-40"
              >
                <Camera size={16} className="text-hh-muted" />
              </button>
            )}
          </div>
        )}

        {/* Empty state / add button */}
        {photos.length === 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 py-6 transition hover:bg-indigo-50 disabled:opacity-40"
          >
            <ImageIcon size={24} className="text-indigo-400" />
            <span className="text-[13px] font-medium text-indigo-600">Ajouter des photos</span>
            <span className="text-[11px] text-indigo-400">Jusqu&apos;à {MAX_PHOTOS} photos — JPEG, PNG, WebP</span>
          </button>
        )}

        {photos.length > 0 && remaining > 0 && photos.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={pending}
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 text-[12px] font-medium text-indigo-600 hover:underline disabled:opacity-40"
          >
            + Ajouter d&apos;autres photos ({remaining} restantes)
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          tabIndex={-1}
          disabled={pending || remaining === 0}
          onChange={(e) => addPhotos(e.target.files)}
        />

        {photoErr && (
          <p className="mt-1.5 text-[12px] text-hh-kola">{photoErr}</p>
        )}
      </div>

      {/* Tarif transport depuis l’envoi (ratePerVehicle) */}
      {vehicleTariffEstimate ? (
        <div className="rounded-xl border border-hh-saffron/35 bg-hh-saffron-lt/50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-hh-muted">
            Prix transport (tarif envoi)
          </p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums text-hh-earth-dk">
            {vehicleTariffEstimate.calculatedPrice.toLocaleString("fr-FR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{" "}
            <span className="text-[16px] font-medium text-hh-muted">
              {CURRENCY_SYMBOL[vehicleTariffEstimate.currency]}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-hh-muted">
            {PRICING_TYPE_LABEL[vehicleTariffEstimate.pricingType]} — même calcul qu&apos;à
            l&apos;affectation au lot (minimum facturable inclus).
          </p>
        </div>
      ) : targetShipmentSummary?.acceptsVehicles &&
        targetShipmentSummary.ratePerVehicle == null ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-[13px] text-amber-950">
          Cet envoi accepte les véhicules mais n&apos;a pas de{" "}
          <strong>tarif par véhicule</strong> renseigné. Le transitaire fixera le prix
          de transport. Renseigne la valeur déclarée du véhicule ci-dessous.
        </div>
      ) : null}

      {/* Valeur déclarée du véhicule */}
      <div className="space-y-1.5">
        <Label
          htmlFor="declared-value"
          className="text-[12px] font-semibold uppercase tracking-wide text-hh-muted"
        >
          Valeur déclarée du véhicule (optionnel)
        </Label>
        <Input
          id="declared-value"
          type="number"
          min={0}
          step="0.01"
          value={declaredValue}
          onChange={(e) => setDeclaredValue(e.target.value)}
          placeholder="ex. 8500"
          disabled={pending}
          className={inputCls}
        />
        <p className="text-[11px] text-hh-muted">
          Sert à la valeur déclarative (assurance/douane). Le prix transport est
          calculé automatiquement depuis l&apos;envoi quand disponible, sinon fixé
          par le transitaire.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-indigo-600 text-[14px] font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
      >
        {pending ? (submitLabel ?? "Envoi en cours…") : (
          <span className="flex items-center gap-2">
            <CheckCircle className="size-4" />
            {photos.length > 0 ? `Déclarer le véhicule + ${photos.length} photo${photos.length > 1 ? "s" : ""}` : "Déclarer le véhicule"}
          </span>
        )}
      </Button>
    </form>
  );
}
