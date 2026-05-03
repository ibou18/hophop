"use client";

import QRCode from "react-qr-code";

export function ParcelQrCode({ trackingCode }: { trackingCode: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-[var(--hh-radius-lg)] bg-white p-4 ring-1 ring-hh-sand-dk/20">
        <QRCode
          value={trackingCode}
          size={180}
          fgColor="#4A1F08"
          bgColor="#FFFFFF"
        />
      </div>
      <span className="font-mono text-[15px] font-medium tracking-widest text-hh-saffron-dk">
        {trackingCode}
      </span>
    </div>
  );
}
