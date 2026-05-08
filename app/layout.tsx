import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import iconMark from "@/assets/logos/logo.png";
import { getAppBaseUrl } from "@/lib/mail/app-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: "hOpOp — Suivi de colis & transitaires",
    template: "%s | hOpOp",
  },
  description:
    "hOpOp relie transitaires et familles en Afrique et dans la diaspora. Suivez vos colis en temps réel, du départ à la livraison.",
  applicationName: "hOpOp",
  authors: [{ name: "hOpOp" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "hOpOp",
    title: "hOpOp — Suivi de colis & transitaires",
    description:
      "La plateforme de suivi pensée pour la diaspora ouest-africaine. Vos colis tracés à chaque étape.",
  },
  twitter: {
    card: "summary_large_image",
    title: "hOpOp — Suivi de colis & transitaires",
    description:
      "La plateforme de suivi pensée pour la diaspora ouest-africaine.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: iconMark.src, type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <script
          defer
          src="https://wtrack.ca/recorder.js"
          data-website-id="d48ea5c9-79c9-45b7-abb2-f37cbd1f8157"
          data-sample-rate="0.15"
          data-mask-level="moderate"
          data-max-duration="300000"
          data-block-selector=".no-record, #private, input[type='password']"
        ></script>
        <Script
          id="umami-analytics"
          src="https://wtrack.ca/script.js"
          strategy="afterInteractive"
          data-website-id="d48ea5c9-79c9-45b7-abb2-f37cbd1f8157"
        />
      </body>
    </html>
  );
}
