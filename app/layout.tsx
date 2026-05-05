import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import iconMark from "@/assets/logos/logo.png";

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
  title: {
    default: "Hophop",
    template: "%s | Hophop",
  },
  description: "Suivi de colis et gestion transitaire",
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
