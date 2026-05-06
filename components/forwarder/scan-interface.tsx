"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  ScanLine,
  Camera,
  CameraOff,
  Search,
  CheckCheck,
  X,
  Loader2,
  ExternalLink,
  Package,
  User,
  MapPin,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { countryLabelFr } from "@/lib/country-label-fr";
import { parcelStatusLabelFr } from "@/lib/parcel-status-fr";
import { Button } from "@/components/ui/button";
import { QrCameraScanner } from "@/components/forwarder/qr-camera-scanner";
import type { Country, ParcelStatus, TransportMode } from "@/app/generated/prisma/enums";
import {
  ALL_PARCEL_STATUSES_ORDERED,
  isForwarderPrivilegedRole,
} from "@/lib/parcel-status-workflow";
import {
  TRACKING_CODE_PREFIX,
  fullTrackingCodeFromUserInput,
  sanitizeTrackingCodeSuffix,
} from "@/lib/codes";

// ── Types retournés par GET /api/parcels/scan ─────────────────────────────────
interface ScanParcel {
  id: string;
  trackingCode: string;
  status: ParcelStatus;
  weightKg: number | null;
  description: string | null;
  notes: string | null;
  price: number | null;
  currency: string;
  shipmentId: string | null;
  client: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null };
  recipient: { firstName: string; lastName: string; phone: string; city: string; country: Country };
  shipment: {
    id: string;
    reference: string;
    status: string;
    destinationCountry: Country;
    transportMode: TransportMode;
  } | null;
  images: { url: string }[];
}

interface AvailableShipment {
  id: string;
  reference: string;
  destinationCountry: Country;
  transportMode: TransportMode;
  departureDate: string | null;
}

interface ScanResult {
  parcel: ScanParcel;
  availableShipments: AvailableShipment[];
}

// ── Status → next actions ─────────────────────────────────────────────────────
type QuickAction = {
  label: string;
  nextStatus?: ParcelStatus;
  variant: "accept" | "danger" | "neutral";
};

function getActions(status: ParcelStatus): QuickAction[] {
  switch (status) {
    case "DECLARED":
      return [
        { label: "Accepter le colis", nextStatus: "COLLECTED", variant: "accept" },
        { label: "Refuser", nextStatus: "ISSUE", variant: "danger" },
      ];
    case "COLLECTED":
      return [
        { label: "Signaler un problème", nextStatus: "ISSUE", variant: "danger" },
      ];
    case "IN_TRANSIT":
      return [
        { label: "Marquer arrivé", nextStatus: "ARRIVED", variant: "accept" },
        { label: "Signaler un problème", nextStatus: "ISSUE", variant: "danger" },
      ];
    case "ARRIVED":
      return [
        { label: "Prêt à récupérer", nextStatus: "READY", variant: "accept" },
        { label: "Signaler un problème", nextStatus: "ISSUE", variant: "danger" },
      ];
    case "READY":
      return [
        { label: "Remettre au destinataire ✓", nextStatus: "DELIVERED", variant: "accept" },
        { label: "Signaler un problème", nextStatus: "ISSUE", variant: "danger" },
      ];
    case "DELIVERED":
      return [];
    case "ISSUE":
      return [
        { label: "Résoudre → Collecté", nextStatus: "COLLECTED", variant: "neutral" },
      ];
    default:
      return [];
  }
}

const STATUS_COLOR: Record<ParcelStatus, string> = {
  DECLARED: "bg-white text-hh-muted ring-1 ring-hh-sand-dk/30",
  COLLECTED: "bg-hh-earth-lt text-hh-earth-dk ring-1 ring-hh-earth/20",
  IN_TRANSIT: "bg-hh-saffron-lt text-hh-saffron-dk ring-1 ring-hh-saffron/35",
  ARRIVED: "bg-hh-earth-lt text-hh-earth-dk ring-1 ring-hh-earth/20",
  READY: "bg-hh-savane/10 text-hh-savane ring-1 ring-hh-savane/30",
  DELIVERED: "bg-hh-savane/10 text-hh-savane ring-1 ring-hh-savane/30",
  ISSUE: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

// ── Main component ────────────────────────────────────────────────────────────
export function ScanInterface({
  forwarderRole,
}: {
  forwarderRole?: "OWNER" | "ADMIN" | "STAFF" | null;
} = {}) {
  const [cameraOn, setCameraOn] = useState(false);
  const [inputSuffix, setInputSuffix] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [targetShipmentId, setTargetShipmentId] = useState("");
  const [adminStatusPick, setAdminStatusPick] = useState<ParcelStatus | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const privileged = isForwarderPrivilegedRole(forwarderRole);

  // Lookup par code (suffixe seul, ou collage HOP-… / TRS-… — comme la landing)
  const lookup = useCallback(async (raw: string) => {
    if (!sanitizeTrackingCodeSuffix(raw)) return;
    const clean = fullTrackingCodeFromUserInput(raw);
    setLoading(true);
    setError(null);
    setResult(null);
    setActionError(null);
    setTargetShipmentId("");
    try {
      const res = await fetch(
        `/api/parcels/scan?code=${encodeURIComponent(clean)}`,
        { credentials: "same-origin" },
      );
      const json = (await res.json().catch(() => null)) as
        | ScanResult
        | { error?: string }
        | null;
      if (!res.ok || !json || !("parcel" in json)) {
        setError(
          (json as { error?: string } | null)?.error ??
            "Colis introuvable. Vérifie le code.",
        );
      } else {
        setResult(json as ScanResult);
        setCameraOn(false); // stop camera after successful scan
      }
    } catch {
      setError("Erreur réseau. Réessaie.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Callback quand la caméra détecte un code
  const handleDetected = useCallback(
    (code: string) => {
      setCameraOn(false);
      setInputSuffix(sanitizeTrackingCodeSuffix(code).toUpperCase());
      void lookup(code);
    },
    [lookup],
  );

  // Changer le statut du colis
  function applyStatus(nextStatus: ParcelStatus) {
    if (!result) return;
    setActionError(null);
    startTransition(async () => {
      const res = await fetch(`/api/parcels/${result.parcel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: nextStatus }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        const msg = j?.error ?? "Erreur lors de la mise à jour.";
        setActionError(msg);
        toast.error(msg);
        return;
      }
      toast.success(`Statut mis à jour : ${parcelStatusLabelFr(nextStatus)}`);
      // Reload parcel data
      await lookup(result.parcel.trackingCode);
    });
  }

  // Affecter à un envoi
  function assignToShipment() {
    if (!result || !targetShipmentId) return;
    setActionError(null);
    const shipmentLabel =
      result.availableShipments.find((s) => s.id === targetShipmentId)?.reference ??
      "l'envoi";
    startTransition(async () => {
      const res = await fetch(`/api/shipments/${targetShipmentId}/parcels`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "assign", parcelIds: [result.parcel.id] }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        const msg = j?.error ?? "Affectation impossible.";
        setActionError(msg);
        toast.error(msg);
        return;
      }
      toast.success(`Colis affecté à ${shipmentLabel} ✓`);
      await lookup(result.parcel.trackingCode);
    });
  }

  function reset() {
    setResult(null);
    setError(null);
    setInputSuffix("");
    setActionError(null);
    setTargetShipmentId("");
    setCameraOn(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const p = result?.parcel;
  const actions = p ? getActions(p.status) : [];
  const canAssign =
    p?.status === "COLLECTED" && !p.shipmentId && (result?.availableShipments.length ?? 0) > 0;
  const showAdminCorrection = Boolean(privileged && p);

  useEffect(() => {
    if (p) setAdminStatusPick(p.status);
  }, [p?.id, p?.status]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      {/* ── Zone de saisie / caméra ── */}
      <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ScanLine size={18} className="text-hh-saffron-dk" />
          <h2 className="text-[15px] font-medium text-hh-earth-dk">Scanner un colis</h2>
        </div>

        {/* Input manuel */}
        <div className="flex gap-2">
          <div className="flex h-11 min-w-0 flex-1 items-center gap-0 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white shadow-sm focus-within:border-hh-saffron focus-within:ring-2 focus-within:ring-hh-saffron/20">
            <Search
              size={15}
              className="ml-3 shrink-0 text-hh-muted"
              aria-hidden
            />
            <span className="shrink-0 pl-1 font-mono text-[14px] tabular-nums tracking-tight text-hh-earth-dk/70">
              {TRACKING_CODE_PREFIX}
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              value={inputSuffix}
              onChange={(e) =>
                setInputSuffix(
                  sanitizeTrackingCodeSuffix(e.target.value).toUpperCase(),
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") void lookup(inputSuffix);
              }}
              placeholder="ex. A3F9K2"
              aria-label={`Suffixe après ${TRACKING_CODE_PREFIX}`}
              className="min-h-0 min-w-0 flex-1 bg-transparent py-2 pr-3 font-mono text-[14px] uppercase text-hh-earth-dk outline-none placeholder:font-sans placeholder:text-hh-muted/60"
            />
          </div>
          <Button
            type="button"
            disabled={
              loading || !sanitizeTrackingCodeSuffix(inputSuffix)
            }
            onClick={() => void lookup(inputSuffix)}
            className="bg-hh-saffron text-white hover:bg-hh-saffron-dk disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </Button>
          <Button
            type="button"
            variant="outline"
            title={cameraOn ? "Désactiver caméra" : "Scanner QR"}
            onClick={() => setCameraOn((v) => !v)}
            className={`border-hh-sand-dk/40 ${cameraOn ? "text-hh-saffron-dk bg-hh-saffron/10" : ""}`}
          >
            {cameraOn ? <CameraOff size={16} /> : <Camera size={16} />}
          </Button>
        </div>

        {/* Caméra */}
        <div className={`mt-3 transition-all duration-300 ${cameraOn ? "block" : "hidden"}`}>
          <QrCameraScanner onDetected={handleDetected} active={cameraOn} />
          <p className="mt-2 text-center text-[11px] text-hh-muted">
            Pointe la caméra vers le QR code de l&apos;étiquette
          </p>
        </div>

        {error && (
          <p className="mt-3 rounded-[var(--hh-radius-md)] bg-red-50 px-3 py-2 text-[13px] text-red-600 ring-1 ring-red-200">
            {error}
          </p>
        )}
      </div>

      {/* ── Résultat ── */}
      {p && (
        <div className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white shadow-sm">
          {/* Header colis */}
          <div className="flex items-center justify-between rounded-t-[var(--hh-radius-lg)] border-b border-hh-sand-dk/20 px-5 py-4">
            <div>
              <p className="font-mono text-[18px] font-bold text-hh-earth-dk">
                {p.trackingCode}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[p.status]}`}
                >
                  {parcelStatusLabelFr(p.status)}
                </span>
                {p.weightKg != null && (
                  <span className="text-[12px] text-hh-muted">{p.weightKg} kg</span>
                )}
                {p.price != null && (
                  <span className="text-[12px] font-medium text-hh-saffron-dk">
                    {p.price} {p.currency}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/parcels/${p.id}`}
                target="_blank"
                className="flex h-8 w-8 items-center justify-center rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 text-hh-muted transition-colors hover:bg-hh-sand/50 hover:text-hh-earth-dk"
                title="Fiche complète"
              >
                <ExternalLink size={14} />
              </Link>
              <button
                type="button"
                onClick={reset}
                title="Nouveau scan"
                className="flex h-8 w-8 items-center justify-center rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 text-hh-muted transition-colors hover:bg-hh-sand/50 hover:text-hh-earth-dk"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Actions rapides — en haut pour éviter de scroller sur mobile */}
          {(actions.length > 0 || canAssign || showAdminCorrection) && (
            <div className="sticky top-0 z-10 border-b border-hh-sand-dk/25 bg-white px-5 py-3 shadow-[0_6px_12px_-8px_rgba(74,31,8,0.25)]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-hh-muted">
                Statut & actions
              </p>
              {canAssign && (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={targetShipmentId}
                    onChange={(e) => setTargetShipmentId(e.target.value)}
                    disabled={pending}
                    className="h-9 flex-1 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-2.5 text-[12px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:opacity-50"
                  >
                    <option value="">Choisir un envoi…</option>
                    {result?.availableShipments.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.reference} — {countryLabelFr(s.destinationCountry)}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    disabled={!targetShipmentId || pending}
                    onClick={assignToShipment}
                    className="h-9 shrink-0 bg-hh-saffron px-3 text-[12px] text-white hover:bg-hh-saffron-dk disabled:opacity-50"
                  >
                    {pending ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    Affecter
                  </Button>
                </div>
              )}
              {actions.length > 0 && (
                <div className={`flex flex-wrap gap-2 ${canAssign ? "mt-3" : "mt-2"}`}>
                  {actions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      disabled={pending}
                      onClick={() => action.nextStatus && applyStatus(action.nextStatus)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold shadow-sm transition-colors disabled:opacity-50 ${
                        action.variant === "accept"
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : action.variant === "danger"
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-hh-sand text-hh-earth-dk ring-1 ring-hh-sand-dk/35 hover:bg-hh-sand-dk/30"
                      }`}
                    >
                      {pending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : action.variant === "accept" ? (
                        <CheckCheck size={12} />
                      ) : action.variant === "danger" ? (
                        <X size={12} />
                      ) : null}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              {actionError && (
                <p className="mt-2 text-[12px] text-red-600">{actionError}</p>
              )}

              {showAdminCorrection && p && adminStatusPick !== null && (
                <div className="mt-3 border-t border-hh-sand-dk/20 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-hh-muted">
                    Correction administrateur
                  </p>
                  <p className="mt-1 text-[11px] text-hh-muted">
                    En cas d&apos;erreur, choisis le statut réel du colis (toutes les transitions sont
                    autorisées).
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={adminStatusPick}
                      onChange={(e) =>
                        setAdminStatusPick(e.target.value as ParcelStatus)
                      }
                      disabled={pending}
                      className="h-9 flex-1 rounded-[var(--hh-radius-md)] border border-hh-sand-dk/35 bg-white px-2.5 text-[12px] text-hh-earth-dk outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:opacity-50"
                    >
                      {ALL_PARCEL_STATUSES_ORDERED.map((s) => (
                        <option key={s} value={s}>
                          {parcelStatusLabelFr(s)}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      disabled={
                        pending || adminStatusPick === p.status
                      }
                      onClick={() => applyStatus(adminStatusPick)}
                      className="h-9 shrink-0 bg-hh-earth-dk px-3 text-[12px] text-white hover:bg-hh-earth disabled:opacity-50"
                    >
                      {pending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : null}
                      Appliquer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info client + destinataire */}
          <div
            className={`grid gap-0 divide-y divide-hh-sand-dk/15 ${p.status !== "DELIVERED" ? "rounded-b-[var(--hh-radius-lg)]" : ""}`}
          >
            <div className="flex items-start gap-3 px-5 py-3">
              <User size={14} className="mt-0.5 shrink-0 text-hh-muted" />
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-hh-muted uppercase tracking-wide">Client</p>
                <p className="text-[13px] font-medium text-hh-earth-dk">
                  {p.client.firstName} {p.client.lastName}
                </p>
                {(p.client.email ?? p.client.phone) && (
                  <p className="text-[11px] text-hh-muted">
                    {p.client.email ?? p.client.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 px-5 py-3">
              <MapPin size={14} className="mt-0.5 shrink-0 text-hh-muted" />
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-hh-muted uppercase tracking-wide">Destinataire</p>
                <p className="text-[13px] font-medium text-hh-earth-dk">
                  {p.recipient.firstName} {p.recipient.lastName}
                </p>
                <p className="text-[11px] text-hh-muted">
                  {p.recipient.city} · {countryLabelFr(p.recipient.country)}
                  {p.recipient.phone && ` · ${p.recipient.phone}`}
                </p>
              </div>
            </div>

            {p.shipment && (
              <div className="flex items-start gap-3 px-5 py-3">
                <Package size={14} className="mt-0.5 shrink-0 text-hh-muted" />
                <div>
                  <p className="text-[12px] font-medium text-hh-muted uppercase tracking-wide">Envoi</p>
                  <p className="text-[13px] font-medium text-hh-earth-dk">
                    {p.shipment.reference}
                    <span className="ml-2 text-[11px] font-normal text-hh-muted">
                      → {countryLabelFr(p.shipment.destinationCountry)}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {p.description && (
              <div className="px-5 py-3">
                <p className="text-[12px] font-medium text-hh-muted uppercase tracking-wide">Contenu déclaré</p>
                <p className="mt-0.5 text-[13px] text-hh-earth-dk">{p.description}</p>
              </div>
            )}
          </div>

          {p.status === "DELIVERED" && (
            <div className="rounded-b-[var(--hh-radius-lg)] border-t border-hh-sand-dk/20 px-5 py-4">
              <p className="text-[13px] text-hh-savane font-medium">
                ✓ Colis remis au destinataire — aucune action possible.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
