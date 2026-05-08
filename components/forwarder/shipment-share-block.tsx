"use client";

import { useCallback, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Link2, MessageCircle, Share2, Trash2 } from "lucide-react";
import { type Country, ShipmentStatus } from "@/app/generated/prisma/enums";
import { countryLabelFr } from "@/lib/country-label-fr";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const btnClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--hh-radius-md)] border px-4 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hh-saffron/40 disabled:pointer-events-none disabled:opacity-40";

const noopSubscribe = () => () => {};

function getWindowOriginSnapshot(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

type DialogMode = "none" | "blocked-parcels" | "confirm-delete";

export function ShipmentShareBlock({
  code5,
  shipmentId,
  reference,
  originCountry,
  destinationCountry,
  forwarderName,
  isPublished,
  parcelCount,
  shipmentStatus,
}: {
  code5: string;
  shipmentId: string;
  reference: string;
  originCountry: Country;
  destinationCountry: Country;
  forwarderName: string;
  isPublished: boolean;
  parcelCount: number;
  shipmentStatus: ShipmentStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const origin = useSyncExternalStore(
    noopSubscribe,
    getWindowOriginSnapshot,
    () => "",
  );
  const [copied, setCopied] = useState(false);
  const [dialog, setDialog] = useState<DialogMode>("none");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canDelete =
    (shipmentStatus === ShipmentStatus.DRAFT ||
      shipmentStatus === ShipmentStatus.CONFIRMED) &&
    parcelCount === 0;

  const sharePath = `/p/${code5}?envoi=${encodeURIComponent(shipmentId)}`;
  const fullUrl = origin ? `${origin}${sharePath}` : sharePath;

  const buildShareText = useCallback(
    (absoluteUrl: string) => {
      const route = `${countryLabelFr(originCountry)} → ${countryLabelFr(destinationCountry)}`;
      return [
        "Bonjour 👋",
        "",
        `📦 Envoi ${reference}`,
        `🧭 Trajet: ${route}`,
        `🏢 Transitaire: ${forwarderName}`,
        "",
        "Déclarez vos colis ici :",
        absoluteUrl,
      ].join("\n");
    },
    [originCountry, destinationCountry, reference, forwarderName],
  );

  const openWhatsApp = useCallback(() => {
    const url = origin ? `${origin}${sharePath}` : sharePath;
    const text = encodeURIComponent(buildShareText(url));
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }, [buildShareText, origin, sharePath]);

  const openFacebook = useCallback(() => {
    if (!origin) return;
    const u = encodeURIComponent(`${origin}${sharePath}`);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [origin, sharePath]);

  const copyLink = useCallback(async () => {
    const toCopy = origin ? `${origin}${sharePath}` : sharePath;
    try {
      await navigator.clipboard.writeText(toCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [origin, sharePath]);

  function openDeleteFlow(): void {
    setDeleteError(null);
    if (parcelCount > 0) {
      setDialog("blocked-parcels");
      return;
    }
    setDialog("confirm-delete");
  }

  function runDelete(): void {
    setDeleteError(null);
    startTransition(async () => {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setDeleteError(j?.error ?? "Suppression impossible.");
        return;
      }
      setDialog("none");
      router.push("/shipments");
      router.refresh();
    });
  }

  const deleteSection = canDelete ? (
    <div className="mt-5 border-t border-hh-sand-dk/20 pt-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-hh-muted">
        Suppression
      </p>
      <p className="mt-1 text-[13px] text-hh-muted">
        Supprime envoi vide (brouillon ou confirmé). Aucun colis ne doit être assigné.
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        className="mt-2 border-hh-kola/40 text-hh-kola hover:bg-hh-kola/10"
        onClick={openDeleteFlow}
      >
        <Trash2 className="size-4 shrink-0" aria-hidden />
        Supprimer cet envoi
      </Button>
    </div>
  ) : null;

  return (
    <>
      <Dialog
        open={dialog !== "none"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog("none");
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="rounded-[var(--hh-radius-lg)] sm:max-w-md">
          {dialog === "blocked-parcels" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-hh-earth-dk">
                  Colis encore dans ce lot
                </DialogTitle>
                <DialogDescription className="space-y-3 text-[14px] leading-relaxed text-hh-earth-dk">
                  <span className="block">
                    Tu ne peux pas supprimer cet envoi tant qu’il contient{" "}
                    <strong>{parcelCount}</strong> colis assigné
                    {parcelCount > 1 ? "s" : ""}.
                  </span>
                  <span className="block">
                    Retire chaque colis du lot via la section{" "}
                    <strong>« Colis du lot »</strong> (désassignation), ou{" "}
                    <strong>refuse / traite</strong> les colis en attente de ton accord
                    depuis leur fiche ou le tableau de bord.
                  </span>
                  <span className="block text-[13px] text-hh-muted">
                    Une fois le lot vide, tu pourras supprimer l’envoi ici.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialog("none")}
                >
                  Fermer
                </Button>
                <Button
                  type="button"
                  asChild
                  className="bg-hh-saffron text-white hover:bg-hh-saffron-dk"
                >
                  <Link
                    href="#colis-du-lot"
                    onClick={() => setDialog("none")}
                  >
                    Voir les colis du lot
                  </Link>
                </Button>
              </DialogFooter>
            </>
          ) : null}
          {dialog === "confirm-delete" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-hh-earth-dk">
                  Supprimer cet envoi ?
                </DialogTitle>
                <DialogDescription className="text-[14px] leading-relaxed text-hh-earth-dk">
                  L’envoi <span className="font-mono">{reference}</span> sera supprimé
                  définitivement. Les demandes clients encore liées à cette fiche seront
                  aussi effacées. Cette action est irréversible.
                </DialogDescription>
                {deleteError ? (
                  <p className="text-[13px] text-hh-kola">{deleteError}</p>
                ) : null}
              </DialogHeader>
              <DialogFooter className="gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setDialog("none")}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  className="bg-hh-kola text-white hover:bg-hh-kola/90"
                  onClick={runDelete}
                >
                  {pending ? "Suppression…" : "Supprimer définitivement"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {!isPublished ? (
        <div className="rounded-[var(--hh-radius-md)] border border-dashed border-hh-sand-dk/40 bg-hh-sand/40 px-4 py-3 text-[13px] text-hh-muted">
          <span className="font-medium text-hh-earth-dk">Partage</span>
          <p className="mt-1">
            Publie cet envoi sur ta vitrine publique pour générer des liens WhatsApp et Facebook vers
            ta page Hophop (avec mise en avant de cet envoi).
          </p>
          {deleteSection}
        </div>
      ) : (
        <section className="rounded-[var(--hh-radius-lg)] border border-hh-sand-dk/25 bg-white p-5 shadow-sm">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-hh-muted">
            Partager cet envoi
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-hh-earth-dk">
            Invite des expéditeurs à rejoindre cet envoi : ils arrivent sur ta page publique avec cet
            envoi mis en avant pour déclarer un colis.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openWhatsApp}
              className={cn(
                btnClass,
                "border-[#25D366]/40 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/18",
              )}
            >
              <MessageCircle className="size-4 shrink-0" aria-hidden />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={openFacebook}
              className={cn(
                btnClass,
                "border-[#1877F2]/35 bg-[#1877F2]/8 text-[#1877F2] hover:bg-[#1877F2]/14",
              )}
            >
              <Share2 className="size-4 shrink-0" aria-hidden />
              Facebook
            </button>
            <button
              type="button"
              onClick={() => void copyLink()}
              className={cn(
                btnClass,
                "border-hh-sand-dk/35 bg-hh-sand/50 text-hh-earth-dk hover:bg-hh-sand-dk/15",
              )}
            >
              <Link2 className="size-4 shrink-0" aria-hidden />
              {copied ? "Lien copié" : "Copier le lien"}
            </button>
          </div>
          <p className="mt-3 font-mono text-[11px] text-hh-muted break-all">{fullUrl}</p>
          {deleteSection}
        </section>
      )}
    </>
  );
}
