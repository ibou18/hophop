import Link from "next/link";
import { Plus } from "lucide-react";

export function ForwarderAddParcelButton({
  shipmentId,
}: {
  shipmentId: string;
  /** Conservé pour compatibilité avec les appels existants */
  forwarderCode5?: string;
}) {
  return (
    <Link
      href={`/shipments/${shipmentId}/add-parcel`}
      className="inline-flex items-center gap-2 rounded-[var(--hh-radius-md)] bg-hh-saffron px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
    >
      <Plus size={14} strokeWidth={2.5} />
      Ajouter un colis client
    </Link>
  );
}
