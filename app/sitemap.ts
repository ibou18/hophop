import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/mail/app-url";

export const revalidate = 3600; // 1h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppBaseUrl();

  const forwarders = await prisma.forwarder.findMany({
    where: { isActive: true },
    select: { code5: true, updatedAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/register`, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${base}/legal/conditions`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/legal/confidentialite`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const forwarderRoutes: MetadataRoute.Sitemap = forwarders.map((f) => ({
    url: `${base}/p/${f.code5}`,
    lastModified: f.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...forwarderRoutes];
}
