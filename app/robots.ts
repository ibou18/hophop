import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/mail/app-url";

export default function robots(): MetadataRoute.Robots {
  const base = getAppBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/p/", "/track/", "/legal/"],
        disallow: [
          "/api/",
          "/admin/",
          "/client/",
          "/forwarder/",
          "/parcels/",
          "/shipments/",
          "/login",
          "/register",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
