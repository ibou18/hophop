"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GooglePlacesAddressField,
  type PlaceResolved,
} from "@/components/maps/google-places-address";
import { COUNTRY_OPTIONS, countryLabelFr } from "@/lib/country-label-fr";
import type { Recipient } from "@/app/generated/prisma/client";
import type { Country, ParcelRequestStatus } from "@/app/generated/prisma/enums";
import {
  ParcelContentSelection,
  parcelContentLinesFromAiCategories,
  type ParcelContentLine,
} from "@/components/client/parcel-content-selection";
import { ImagePlus, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import {
  normalizeImageContentType,
  PARCEL_IMAGE_MAX_BYTES,
} from "@/lib/image-file-types";
import { uploadParcelRequestImagesViaApi } from "@/lib/client/parcel-request-image-upload";
import { AddRecipientModal } from "@/components/client/add-recipient-modal";

const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const PHOTOS_MAX = 10;

const inputClass =
  "h-10 w-full rounded-xl border border-hh-sand-dk/35 bg-white text-[13px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40";

export type ParcelRequestEditInitial = {
  id: string;
  status: ParcelRequestStatus;
  recipientId: string;
  maxDepartureDate: string;
  originCountry: Country | null;
  originCity: string | null;
  originLatitude: number | null;
  originLongitude: number | null;
  weightKg: number | null;
  declaredValue: number | null;
  description: string | null;
  items: ParcelContentLine[];
  existingImages: { id: string; url: string }[];
};

export function NewParcelRequestForm({
  recipients,
  edit,
}: {
  recipients: Recipient[];
  edit?: ParcelRequestEditInitial;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageEntries, setImageEntries] = useState<{ file: File; previewUrl: string }[]>(
    [],
  );
  const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>(
    edit?.existingImages ?? [],
  );
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [aiAlert, setAiAlert] = useState<string | null>(null);
  const [localRecipients, setLocalRecipients] = useState<Recipient[]>(recipients);
  const [showAddRecipient, setShowAddRecipient] = useState(false);

  const [recipientId, setRecipientId] = useState(
    edit?.recipientId ??
      recipients.find((r) => r.isDefault)?.id ??
      recipients[0]?.id ??
      "",
  );

  const [originCountry, setOriginCountry] = useState<Country>(
    edit?.originCountry ?? "CA",
  );
  const [originCityInput, setOriginCityInput] = useState(edit?.originCity ?? "");
  const [originPlace, setOriginPlace] = useState<PlaceResolved | null>(null);

  const [maxDepartureDate, setMaxDepartureDate] = useState(
    edit?.maxDepartureDate ?? "",
  );

  const [items, setItems] = useState<ParcelContentLine[]>(edit?.items ?? []);
  const [weightKg, setWeightKg] = useState(
    edit?.weightKg != null ? String(edit.weightKg) : "",
  );
  const [declaredValue, setDeclaredValue] = useState(
    edit?.declaredValue != null ? String(edit.declaredValue) : "",
  );
  const [description, setDescription] = useState(edit?.description ?? "");

  const selectedRecipient = localRecipients.find((r) => r.id === recipientId);
  const totalPhotos = existingImages.length + imageEntries.length;
  const isEdit = Boolean(edit);

  async function analyzePhotoWithAI(file: File) {
    setAiLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = (reader.result as string).split(",")[1];
          if (result) resolve(result);
          else reject(new Error("empty"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mimeType = file.type || "image/jpeg";
      const res = await fetch("/api/ai/analyze-parcel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      if (!res.ok) return;

      const data = await res.json() as {
        description?: string;
        estimatedWeightKg?: number | null;
        categories?: unknown;
        customsAlert?: string | null;
      };

      let suggested = false;
      if (data.description && !description.trim()) {
        setDescription(data.description);
        suggested = true;
      }
      if (data.estimatedWeightKg != null && !weightKg) {
        setWeightKg(String(data.estimatedWeightKg));
        suggested = true;
      }
      if (Array.isArray(data.categories) && data.categories.length > 0 && items.length === 0) {
        const newItems = parcelContentLinesFromAiCategories(data.categories);
        if (newItems.length) { setItems(newItems); suggested = true; }
      }
      if (data.customsAlert) setAiAlert(data.customsAlert);
      if (suggested) setAiSuggested(true);
    } catch {
      // silent fail — AI is optional
    } finally {
      setAiLoading(false);
    }
  }

  function handlePhotoFiles(list: FileList | null) {
    if (!list?.length) return;
    setPhotoError(null);
    const remaining = PHOTOS_MAX - existingImages.length - imageEntries.length;
    if (remaining <= 0) {
      setPhotoError(`Maximum ${PHOTOS_MAX} photos.`);
      return;
    }
    const valid: { file: File; previewUrl: string }[] = [];
    for (const f of Array.from(list).slice(0, remaining)) {
      if (f.size > PARCEL_IMAGE_MAX_BYTES) {
        setPhotoError(`"${f.name}" dépasse ${Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo.`);
        continue;
      }
      if (!normalizeImageContentType(f)) {
        setPhotoError(`"${f.name}" : format non supporté (JPEG, PNG, WebP).`);
        continue;
      }
      valid.push({ file: f, previewUrl: URL.createObjectURL(f) });
    }
    if (valid.length) {
      const isFirstPhoto = existingImages.length === 0 && imageEntries.length === 0;
      setImageEntries((prev) => [...prev, ...valid]);
      if (isFirstPhoto && valid[0]) void analyzePhotoWithAI(valid[0].file);
    }
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setImageEntries((prev) => {
      const entry = prev[index];
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function removeExistingImage(imageId: string) {
    if (!edit) return;
    setRemovingImageId(imageId);
    setPhotoError(null);
    try {
      const res = await fetch(
        `/api/parcel-requests/${edit.id}/images/${imageId}`,
        { method: "DELETE", credentials: "same-origin" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhotoError((data as { error?: string }).error ?? "Suppression impossible.");
        return;
      }
      setExistingImages((prev) => prev.filter((x) => x.id !== imageId));
    } finally {
      setRemovingImageId(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!recipientId) {
      setError("Choisissez un destinataire.");
      return;
    }

    if (!edit && mapsApiKey && !originPlace) {
      setError("Ville de départ : sélectionne une suggestion dans la liste.");
      return;
    }
    if (!originCityInput.trim()) {
      setError("Ville de départ requise.");
      return;
    }
    if (!maxDepartureDate) {
      setError("Date limite de départ requise.");
      return;
    }
    if (items.length === 0) {
      setError("Sélectionnez au moins une catégorie pour le contenu du colis.");
      return;
    }

    if (edit && edit.status !== "PENDING") {
      setError("Cette demande ne peut plus être modifiée.");
      return;
    }

    setLoading(true);
    try {
      const originCity =
        originPlace?.city ??
        originCityInput.split(",")[0]?.trim() ??
        originCityInput;
      const originLatitude =
        originPlace?.latitude ?? edit?.originLatitude ?? undefined;
      const originLongitude =
        originPlace?.longitude ?? edit?.originLongitude ?? undefined;

      const payload = {
        recipientId,
        maxDepartureDate: new Date(maxDepartureDate).toISOString(),
        originCountry,
        originCity,
        originLatitude,
        originLongitude,
        description: description.trim() || undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        declaredValue: declaredValue ? parseFloat(declaredValue) : undefined,
        items: items.map((it) => ({
          name: it.name.trim(),
          quantity: it.quantity,
          category: it.category,
        })),
      };

      if (edit) {
        const res = await fetch(`/api/parcel-requests/${edit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { error?: string }).error ?? "Modification impossible.");
          return;
        }
        if (imageEntries.length > 0) {
          const uploadResult = await uploadParcelRequestImagesViaApi(
            edit.id,
            imageEntries.map((e) => e.file),
          );
          if (!uploadResult.ok) {
            setError(
              `${uploadResult.error} Les autres modifications ont été enregistrées.`,
            );
            router.push("/client/parcel-requests");
            router.refresh();
            return;
          }
        }
      } else {
        const res = await fetch("/api/parcel-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { error?: string }).error ?? "Une erreur est survenue.");
          return;
        }
        const requestId = (data as { id?: string }).id;
        if (requestId && imageEntries.length > 0) {
          const uploadResult = await uploadParcelRequestImagesViaApi(
            requestId,
            imageEntries.map((e) => e.file),
          );
          if (!uploadResult.ok) {
            setError(
              `${uploadResult.error} La demande a bien été créée ; les photos peuvent être ajoutées plus tard.`,
            );
          }
        }
      }

      router.push("/client/parcel-requests");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  const departureLabel =
    originPlace?.city ?? (originCityInput.trim() || null);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="rounded-2xl border border-hh-sand-dk/20 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-[14px] font-semibold text-hh-earth-dk">
          Trajet
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-hh-muted">
              Départ
            </p>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-hh-muted">Pays d'origine</Label>
              <select
                value={originCountry}
                onChange={(e) => {
                  setOriginCountry(e.target.value as Country);
                  setOriginCityInput("");
                  setOriginPlace(null);
                }}
                className={inputClass}
              >
                {COUNTRY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-hh-muted">Ville de départ</Label>
              <GooglePlacesAddressField
                key={originCountry}
                apiKey={mapsApiKey}
                value={originCityInput}
                predictionTypes={["(cities)"]}
                onChangeText={(v) => {
                  setOriginCityInput(v);
                  if (!v.trim()) setOriginPlace(null);
                }}
                onResolved={(p) => {
                  setOriginPlace(p);
                  setOriginCityInput(
                    p.city ??
                      p.formattedAddress.split(",")[0]?.trim() ??
                      p.formattedAddress,
                  );
                }}
                placeholder="Ex : Montréal"
                inputClassName={inputClass}
                restrictCountry={originCountry}
                required
              />
              {originPlace && (
                <p className="text-[11px] text-green-600">
                  ✓ {originPlace.city ?? originCityInput}
                </p>
              )}
              {isEdit && !originPlace && originCityInput.trim() && (
                <p className="text-[11px] text-hh-muted">
                  Modifie la ville ou choisis une suggestion pour mettre à jour les
                  coordonnées GPS.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-hh-muted">
              Arrivée
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[12px] text-hh-muted">Destinataire</Label>
                <button
                  type="button"
                  onClick={() => setShowAddRecipient(true)}
                  className="flex items-center gap-1 text-[11px] font-medium text-hh-saffron-dk hover:underline"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  Nouveau
                </button>
              </div>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger className="h-10 rounded-xl border-hh-sand-dk/35 text-[13px]">
                  <SelectValue placeholder="Sélectionner…" />
                </SelectTrigger>
                <SelectContent>
                  {localRecipients.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.firstName} {r.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRecipient && (
              <div className="rounded-xl border border-hh-sand-dk/20 bg-hh-sand/40 px-4 py-3">
                <p className="text-[13px] font-semibold text-hh-earth-dk">
                  {selectedRecipient.city}
                </p>
                <p className="text-[12px] text-hh-muted">
                  {countryLabelFr(selectedRecipient.country)}
                </p>
                {selectedRecipient.phone && (
                  <p className="mt-1 text-[11px] text-hh-muted">
                    {selectedRecipient.firstName} · {selectedRecipient.phone}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {departureLabel && selectedRecipient && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-hh-saffron/8 px-4 py-2.5">
            <span className="text-[13px] font-medium text-hh-earth-dk">
              {departureLabel}
            </span>
            <span className="flex-1 border-t border-dashed border-hh-saffron/40" />
            <span className="text-hh-saffron">✈</span>
            <span className="flex-1 border-t border-dashed border-hh-saffron/40" />
            <span className="text-[13px] font-medium text-hh-earth-dk">
              {selectedRecipient.city}, {countryLabelFr(selectedRecipient.country)}
            </span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-hh-sand-dk/20 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-[14px] font-semibold text-hh-earth-dk">
          Date limite de départ
        </h2>
        <p className="mb-4 text-[12px] text-hh-muted">
          Le colis doit partir avant cette date au plus tard.
        </p>
        <Input
          type="date"
          value={maxDepartureDate}
          onChange={(e) => setMaxDepartureDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          required
          className="h-11 rounded-xl border-hh-sand-dk/35"
        />
      </div>

      {/* ── Photos — AVANT contenu pour que l'IA remplisse en avance ── */}
      <div className="rounded-2xl border border-hh-sand-dk/20 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-semibold text-hh-earth-dk">Photos du colis</h2>
            <p className="mt-0.5 text-[12px] text-hh-muted">
              Optionnel · jusqu&apos;à {PHOTOS_MAX} photos (JPEG, PNG, WebP · max{" "}
              {Math.round(PARCEL_IMAGE_MAX_BYTES / 1024 / 1024)} Mo).
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-hh-saffron/8 px-2.5 py-1 text-[10px] font-semibold text-hh-saffron-dk">
            <Sparkles size={10} />
            Analyse IA
          </div>
        </div>

        {totalPhotos > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {existingImages.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  disabled={removingImageId === img.id}
                  className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                  aria-label="Supprimer la photo"
                >
                  {removingImageId === img.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            ))}
            {imageEntries.map((entry, i) => (
              <div
                key={entry.previewUrl}
                className="group relative aspect-square overflow-hidden rounded-xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.previewUrl} alt={entry.file.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Retirer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {totalPhotos < PHOTOS_MAX && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-hh-sand-dk/50 text-hh-muted transition-colors hover:border-hh-saffron/50 hover:text-hh-saffron-dk"
              >
                <ImagePlus size={20} strokeWidth={1.5} />
                <span className="text-[10px]">Ajouter</span>
              </button>
            )}
          </div>
        )}

        {totalPhotos === 0 && (
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-hh-sand-dk/50 py-10 transition-colors hover:border-hh-saffron/50 hover:bg-hh-saffron/5"
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
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => handlePhotoFiles(e.target.files)}
        />

        {photoError && (
          <p className="mt-2 text-[12px] text-red-600" role="alert">
            {photoError}
          </p>
        )}
      </div>

      {/* ── Contenu du colis ── */}
      <div className="rounded-2xl border border-hh-sand-dk/20 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-semibold text-hh-earth-dk">Contenu du colis</h2>
            <p className="mt-0.5 text-[12px] text-hh-muted">Sélectionne une ou plusieurs catégories.</p>
          </div>
          {aiLoading && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-hh-saffron/10 px-3 py-1.5 text-[11px] font-medium text-hh-saffron-dk">
              <Loader2 size={11} className="animate-spin" />
              Analyse IA…
            </div>
          )}
          {aiSuggested && !aiLoading && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700">
              <Sparkles size={11} />
              Pré-rempli par l&apos;IA
              <button type="button" onClick={() => setAiSuggested(false)} className="ml-0.5 opacity-60 hover:opacity-100">
                <X size={11} />
              </button>
            </div>
          )}
        </div>
        {aiLoading && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-hh-saffron/20 bg-hh-saffron/6 px-4 py-3">
            <Loader2 size={16} className="animate-spin shrink-0 text-hh-saffron" />
            <div>
              <p className="text-[13px] font-semibold text-hh-saffron-dk">Analyse en cours…</p>
              <p className="text-[11px] text-hh-saffron-dk/70">L&apos;IA lit votre photo et remplit le contenu automatiquement.</p>
            </div>
          </div>
        )}
        {aiAlert && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <span className="mt-0.5 text-[14px]">⚠️</span>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-amber-800">Alerte douanière</p>
              <p className="text-[12px] text-amber-700">{aiAlert}</p>
            </div>
            <button type="button" onClick={() => setAiAlert(null)} className="text-amber-500 hover:text-amber-700">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex flex-col gap-4">
          <ParcelContentSelection
            items={items}
            onItemsChange={setItems}
            showIntro={false}
          />

          <div className="grid grid-cols-2 gap-3 border-t border-hh-sand-dk/15 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] text-hh-muted">Poids estimé (kg)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="Ex : 5.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="h-10 rounded-xl border-hh-sand-dk/35 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] text-hh-muted">Valeur déclarée</Label>
              <Input
                type="number"
                step="1"
                min="0"
                placeholder="Ex : 150"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
                className="h-10 rounded-xl border-hh-sand-dk/35 text-[13px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] text-hh-muted">
              Description libre (optionnel)
            </Label>
            <Textarea
              placeholder="Ex : Vêtements pour enfants, produits cosmétiques…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-xl border-hh-sand-dk/35 text-[13px]"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-xl bg-hh-saffron text-[14px] font-semibold text-white shadow-md shadow-hh-saffron/25 hover:bg-hh-saffron-dk"
      >
        {loading ? (isEdit ? "Enregistrement…" : "Envoi…") : isEdit ? "Enregistrer les modifications" : "Envoyer la demande"}
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
