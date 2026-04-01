import type { MetadataRoute } from "next";

import { getAbsoluteUrl, getRequestSiteUrl, getSiteUrl } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = getSiteUrl() ?? (await getRequestSiteUrl());
  const sitemapUrl =
    getAbsoluteUrl("/sitemap.xml") ??
    (siteUrl ? new URL("/sitemap.xml", siteUrl).toString() : undefined);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: sitemapUrl ? [sitemapUrl] : undefined,
  };
}
