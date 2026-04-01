import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
// import { Agentation } from "agentation";

import { ThemeProvider } from "@/components/theme-provider";
import {
  APP_DESCRIPTION,
  APP_KEYWORDS,
  APP_NAME,
  getRequestSiteUrl,
  getSiteUrl,
} from "@/lib/site";

import "./globals.css";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const heading = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const metadataBase = getSiteUrl() ?? (await getRequestSiteUrl());
  const canonicalUrl = metadataBase
    ? new URL("/", metadataBase).toString()
    : "/";

  return {
    metadataBase,
    applicationName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    keywords: APP_KEYWORDS,
    alternates: {
      canonical: canonicalUrl,
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/xtract-favicon.png", type: "image/png" },
      ],
      shortcut: ["/favicon.ico"],
      apple: [
        {
          url: "/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      type: "website",
      siteName: APP_NAME,
      url: canonicalUrl,
      images: [
        {
          url: "/xtract-og-image.png",
          width: 1200,
          height: 630,
          alt: "xtract interface preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: ["/xtract-og-image.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${sans.variable} ${heading.variable} antialiased`}>
        <ThemeProvider>
          {children}
          {/*{process.env.NODE_ENV === "development" && <Agentation />}*/}
        </ThemeProvider>
      </body>
    </html>
  );
}
