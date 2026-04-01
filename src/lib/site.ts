import { headers } from "next/headers";

export const APP_NAME = "xtract";
export const APP_DESCRIPTION =
  "Paste a public X post or article URL and get clean, agent-ready markdown in one click.";
export const DEFAULT_SITE_URL = "https://xtract.decocereus.com/";

export const APP_KEYWORDS = [
  "x extractor",
  "x post extractor",
  "x article extractor",
  "article to markdown",
  "web article extractor",
  "agent-ready markdown",
];

function normalizeSiteUrl(rawUrl: string) {
  const normalizedUrl =
    rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
      ? rawUrl
      : `https://${rawUrl}`;

  try {
    const url = new URL(normalizedUrl);
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return undefined;
  }
}

export function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    DEFAULT_SITE_URL;

  return normalizeSiteUrl(rawUrl);
}

export function getAbsoluteUrl(path = "/") {
  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}

export async function getRequestSiteUrl() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    return undefined;
  }

  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return normalizeSiteUrl(`${protocol}://${host}`);
}
