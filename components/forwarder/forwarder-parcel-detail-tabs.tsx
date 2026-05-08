"use client";

import type { ReactNode } from "react";
import { Clock, FileText, User, QrCode } from "lucide-react";
import {
  ParcelDetailTabsBase,
  type ParcelDetailTabItem,
} from "@/components/shared/parcel-detail-tabs-base";

export function ForwarderParcelDetailTabs({
  trackingContent,
  detailsContent,
  clientContent,
  qrContent,
}: {
  trackingContent: ReactNode;
  detailsContent: ReactNode;
  clientContent: ReactNode;
  qrContent: ReactNode;
}) {
  const tabs: ParcelDetailTabItem[] = [
    {
      value: "tracking",
      label: "Suivi",
      icon: <Clock size={14} strokeWidth={1.8} />,
      content: trackingContent,
    },
    {
      value: "details",
      label: "Détails",
      icon: <FileText size={14} strokeWidth={1.8} />,
      content: detailsContent,
    },
    {
      value: "client",
      label: "Client",
      icon: <User size={14} strokeWidth={1.8} />,
      content: clientContent,
    },
    {
      value: "qr",
      label: "QR Code",
      icon: <QrCode size={14} strokeWidth={1.8} />,
      content: qrContent,
    },
  ];

  return (
    <ParcelDetailTabsBase defaultValue="tracking" tabs={tabs} />
  );
}
