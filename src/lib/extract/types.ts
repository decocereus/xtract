export type ExtractedSourceType = "web_article" | "x_post" | "x_article";

export interface ExtractedDocument {
  sourceType: ExtractedSourceType;
  title: string;
  url: string;
  canonicalUrl: string;
  siteName?: string;
  byline?: string;
  publishedAt?: string;
  excerpt?: string;
  wordCount: number;
  readingMinutes: number;
  contentMarkdown: string;
  contentText: string;
  markdown: string;
  plainText: string;
}

export type ExtractResponse =
  | { ok: true; document: ExtractedDocument }
  | { ok: false; message: string };
