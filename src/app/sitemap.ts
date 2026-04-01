import type { MetadataRoute } from "next";

import { getAbsoluteUrl, getRequestSiteUrl, getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl() ?? (await getRequestSiteUrl());
  const homeUrl =
    getAbsoluteUrl("/") ??
    (siteUrl ? new URL("/", siteUrl).toString() : undefined);

  if (!homeUrl) {
    return [];
  }

  return [
    {
      url: homeUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
