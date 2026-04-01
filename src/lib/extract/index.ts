import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import type { ExtractedDocument, ExtractedSourceType } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_CONTENT_BYTES = 5_000_000;
const WORDS_PER_MINUTE = 225;
const X_WEB_BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
const X_TWEET_RESULT_QUERY_ID = "sBoAB5nqJTOyR9sZ5qVLsw";
const X_TWEET_RESULT_FEATURES = {
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
  verified_phone_label_enabled: false,
  view_counts_everywhere_api_enabled: true,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_enhance_cards_enabled: false,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
} as const;
const X_TWEET_RESULT_FIELD_TOGGLES = {
  withArticleRichContentState: true,
  withArticlePlainText: true,
  withArticleSummaryText: true,
  withArticleVoiceOver: false,
  withPayments: false,
  withAuxiliaryUserLabels: false,
} as const;

const turndown = new TurndownService({
  codeBlockStyle: "fenced",
  headingStyle: "atx",
  bulletListMarker: "-",
});

turndown.remove(["script", "style", "noscript", "iframe", "form"]);

export class ExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}

interface ExtractedBase {
  sourceType: ExtractedSourceType;
  title: string;
  url: string;
  canonicalUrl: string;
  siteName?: string;
  byline?: string;
  publishedAt?: string;
  excerpt?: string;
  contentMarkdown: string;
  contentText: string;
}

interface XOEmbedResponse {
  author_name?: string;
  author_url?: string;
  html?: string;
  url?: string;
}

interface XTweetResultResponse {
  data?: {
    tweetResult?: {
      result?: XApiTweet;
    };
  };
}

interface XApiTweet {
  __typename?: string;
  article?: {
    article_results?: {
      result?: XApiArticle;
    };
  };
  core?: {
    user_results?: {
      result?: {
        __typename?: string;
        core?: {
          name?: string;
          screen_name?: string;
        };
        legacy?: {
          name?: string;
          screen_name?: string;
        };
      };
    };
  };
  legacy?: {
    created_at?: string;
    entities?: {
      urls?: Array<{
        url?: string;
        expanded_url?: string;
      }>;
    };
    full_text?: string;
  };
  note_tweet?: {
    note_tweet_results?: {
      result?: {
        text?: string;
      };
    };
    text?: string;
  };
  note_tweet_results?: {
    result?: {
      text?: string;
    };
  };
  rest_id?: string;
}

interface XApiArticle {
  content_state?: {
    blocks?: XApiArticleBlock[];
  };
  metadata?: {
    first_published_at_secs?: number;
  };
  plain_text?: string;
  preview_text?: string;
  rest_id?: string;
  summary_text?: string;
  title?: string;
}

interface XApiArticleBlock {
  inlineStyleRanges?: Array<{
    length: number;
    offset: number;
    style: string;
  }>;
  text?: string;
  type?: string;
}

export async function extractFromUrl(input: string) {
  const url = normalizeInputUrl(input);

  if (isXContentUrl(url)) {
    return extractXContent(url);
  }

  return extractArticle(url);
}

async function extractArticle(url: URL) {
  await assertSafeRemoteTarget(url);

  const response = await fetch(url, {
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
      "Accept-Language": "en-US,en;q=0.8",
      "User-Agent":
        "x-articles/0.1 (+https://github.com/amartyasingh/x-articles) Mozilla/5.0",
    },
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new ExtractError(
      `The page responded with ${response.status}. Try a public article URL.`,
    );
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);

  if (contentLength > MAX_CONTENT_BYTES) {
    throw new ExtractError("That page is too large for the current extractor.");
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml+xml")
  ) {
    throw new ExtractError("That URL does not look like an HTML article page.");
  }

  const html = await response.text();
  const finalUrl = response.url || url.toString();
  const dom = new JSDOM(html, { url: finalUrl });
  const document = dom.window.document;
  const readable = new Readability(document, {
    charThreshold: 120,
    keepClasses: false,
  }).parse();

  if (!readable?.textContent?.trim()) {
    throw new ExtractError(
      "We could not find a readable article on that page yet. Try the canonical article URL.",
    );
  }

  const canonicalUrl = getCanonicalUrl(document, finalUrl);
  const cleanedContent = cleanArticleContent(
    readable.content,
    readable.textContent,
  );
  const contentMarkdown = cleanedContent.markdown;
  const contentText = cleanedContent.text;

  return finalizeDocument({
    sourceType: "web_article",
    title: cleanText(
      readable.title || getMetaContent(document, "og:title") || url.hostname,
    ),
    url: url.toString(),
    canonicalUrl,
    siteName: cleanText(
      readable.siteName || getMetaContent(document, "og:site_name") || url.hostname,
    ),
    byline: optionalText(readable.byline),
    publishedAt: normalizeDate(
      getMetaContent(document, "article:published_time") ||
        getMetaName(document, "pubdate") ||
        getMetaName(document, "publish_date"),
    ),
    excerpt: optionalText(readable.excerpt),
    contentMarkdown: contentMarkdown || contentText,
    contentText,
  });
}

async function extractXContent(url: URL) {
  await assertSafeRemoteTarget(url);

  const guestToken = await getXGuestToken(url);
  const restId = getXRestId(url);

  if (!restId) {
    throw new ExtractError("We couldn't identify the X post or article from that URL.");
  }

  const tweet = await fetchXWebTweetResult(restId, guestToken);
  const authorCore = tweet.core?.user_results?.result?.core;
  const authorLegacy = tweet.core?.user_results?.result?.legacy;
  const authorName = optionalText(authorCore?.name || authorLegacy?.name);
  const authorHandle = optionalText(
    authorCore?.screen_name || authorLegacy?.screen_name,
  );
  const byline =
    authorName && authorHandle
      ? `${authorName} (@${authorHandle})`
      : authorName || (authorHandle ? `@${authorHandle}` : undefined);
  const article = tweet.article?.article_results?.result;

  if (article?.plain_text?.trim()) {
    const contentText = cleanText(article.plain_text);
    const contentMarkdown = renderXArticleMarkdown(article, contentText);
    const title = cleanText(
      article.title || (authorHandle ? `Article by @${authorHandle}` : "X article"),
    );

    return finalizeDocument({
      sourceType: "x_article",
      title,
      url: url.toString(),
      canonicalUrl:
        authorHandle != null
          ? `https://x.com/${authorHandle}/article/${tweet.rest_id ?? restId}`
          : url.toString(),
      siteName: "X",
      byline,
      publishedAt: article.metadata?.first_published_at_secs
        ? new Date(article.metadata.first_published_at_secs * 1000).toISOString()
        : undefined,
      excerpt: optionalText(article.summary_text || article.preview_text),
      contentMarkdown,
      contentText,
    });
  }

  const noteTweetText = getXNoteTweetText(tweet);
  const legacyText = expandXUrlsInText(
    tweet.legacy?.full_text ?? "",
    tweet.legacy?.entities?.urls ?? [],
  );
  const contentText = cleanText(noteTweetText || legacyText);

  if (contentText) {
    const title = authorHandle
      ? `Post by @${authorHandle}`
      : authorName
        ? `${authorName} on X`
        : "X post";

    return finalizeDocument({
      sourceType: "x_post",
      title,
      url: url.toString(),
      canonicalUrl:
        authorHandle != null
          ? `https://x.com/${authorHandle}/status/${tweet.rest_id ?? restId}`
          : url.toString(),
      siteName: "X",
      byline,
      publishedAt: normalizeDate(tweet.legacy?.created_at),
      excerpt: contentText.slice(0, 220),
      contentMarkdown: contentText,
      contentText,
    });
  }

  return extractXOEmbedFallback(url);
}

function finalizeDocument(base: ExtractedBase): ExtractedDocument {
  const wordCount = countWords(base.contentText);
  const readingMinutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  const markdown = formatMarkdown(base);
  const plainText = formatPlainText(base);

  return {
    ...base,
    wordCount,
    readingMinutes,
    markdown,
    plainText,
  };
}

function formatMarkdown(document: ExtractedBase) {
  const metadata = [
    `Source: ${document.canonicalUrl}`,
    document.byline ? `Author: ${document.byline}` : null,
    document.publishedAt ? `Published: ${document.publishedAt}` : null,
  ].filter(Boolean);

  const sections = [`# ${document.title}`, "", ...metadata, "", document.contentMarkdown.trim()];

  return sections.join("\n");
}

function formatPlainText(document: ExtractedBase) {
  const lines = [
    document.title,
    "",
    `Source: ${document.canonicalUrl}`,
    document.byline ? `Author: ${document.byline}` : null,
    document.publishedAt ? `Published: ${document.publishedAt}` : null,
  ].filter(Boolean);

  lines.push("", document.contentText.trim());

  return lines.join("\n");
}

function cleanArticleContent(contentHtml: string | null | undefined, fallbackText: string) {
  if (!contentHtml) {
    const text = cleanText(fallbackText);

    return {
      markdown: text,
      text,
    };
  }

  const dom = new JSDOM(`<article>${contentHtml}</article>`);
  const root = dom.window.document.querySelector("article");

  if (!root) {
    const text = cleanText(fallbackText);

    return {
      markdown: text,
      text,
    };
  }

  root
    .querySelectorAll(
      "img, picture, figure, figcaption, svg, video, audio, iframe, form, button, input, script, style, noscript",
    )
    .forEach((element) => element.remove());

  root.querySelectorAll("sup").forEach((element) => {
    const text = cleanText(element.textContent ?? "");

    if (/^\[?\d+\]?$/.test(text)) {
      element.remove();
    }
  });

  root.querySelectorAll("a[href^='#']").forEach((element) => {
    const text = cleanText(element.textContent ?? "");

    if (!text || /^\[?\d+\]?$/.test(text)) {
      element.remove();
      return;
    }

    unwrapElement(element);
  });

  const markdown = cleanMarkdown(turndown.turndown(root.innerHTML).trim());
  const cleanedMarkdown = tidyMarkdownContent(markdown);
  const text = markdownToPlainText(cleanedMarkdown) || cleanText(fallbackText);

  return {
    markdown: cleanedMarkdown || text,
    text,
  };
}

function unwrapElement(element: Element) {
  const parent = element.parentNode;

  if (!parent) {
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
}

function normalizeInputUrl(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new ExtractError("Paste a public article or X post URL to extract it.");
  }

  const withProtocol = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;

  try {
    url = new URL(withProtocol);
  } catch {
    throw new ExtractError("That does not look like a valid URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new ExtractError("Only http and https URLs are supported.");
  }

  return url;
}

async function assertSafeRemoteTarget(url: URL) {
  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new ExtractError("Local and internal network URLs are blocked.");
  }

  if (isIP(hostname) && isPrivateIp(hostname)) {
    throw new ExtractError("Private network IPs are blocked.");
  }

  let addresses;

  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ExtractError("We couldn't resolve that hostname. Check the URL and try again.");
  }

  if (addresses.some((address) => isPrivateIp(address.address))) {
    throw new ExtractError("This hostname resolves to a private or local IP.");
  }
}

function isPrivateIp(address: string) {
  if (address === "::1" || address === "::") {
    return true;
  }

  const lowercase = address.toLowerCase();

  if (
    lowercase.startsWith("fc") ||
    lowercase.startsWith("fd") ||
    lowercase.startsWith("fe8") ||
    lowercase.startsWith("fe9") ||
    lowercase.startsWith("fea") ||
    lowercase.startsWith("feb")
  ) {
    return true;
  }

  const parts = address.split(".").map(Number);

  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19))
  );
}

function isXContentUrl(url: URL) {
  const hostname = url.hostname.replace(/^www\./, "");

  if (!["x.com", "twitter.com"].includes(hostname)) {
    return false;
  }

  return (
    /\/status\/\d+/i.test(url.pathname) ||
    /\/article\/\d+/i.test(url.pathname) ||
    /\/i\/articles\/\d+/i.test(url.pathname)
  );
}

function getXRestId(url: URL) {
  const match =
    url.pathname.match(/\/status\/(\d+)/i) ||
    url.pathname.match(/\/article\/(\d+)/i) ||
    url.pathname.match(/\/i\/articles\/(\d+)/i);

  return match?.[1] ?? null;
}

async function getXGuestToken(url: URL) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const html = await response.text();
  const match =
    html.match(/document\.cookie="gt=(\d+)/) || html.match(/\bgt=(\d+)/);

  if (!match?.[1]) {
    throw new ExtractError("We couldn't initialize a public X guest session.");
  }

  return match[1];
}

async function fetchXWebTweetResult(restId: string, guestToken: string) {
  const variables = encodeURIComponent(
    JSON.stringify({
      tweetId: restId,
      withCommunity: false,
      includePromotedContent: false,
      withVoice: true,
    }),
  );
  const features = encodeURIComponent(JSON.stringify(X_TWEET_RESULT_FEATURES));
  const fieldToggles = encodeURIComponent(
    JSON.stringify(X_TWEET_RESULT_FIELD_TOGGLES),
  );
  const endpoint = `https://x.com/i/api/graphql/${X_TWEET_RESULT_QUERY_ID}/TweetResultByRestId?variables=${variables}&features=${features}&fieldToggles=${fieldToggles}`;

  const response = await fetch(endpoint, {
    headers: {
      authorization: `Bearer ${X_WEB_BEARER_TOKEN}`,
      "x-guest-token": guestToken,
      "x-twitter-active-user": "yes",
      "x-twitter-client-language": "en",
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new ExtractError(
      "We couldn't load the public X content payload for that URL.",
    );
  }

  const payload = (await response.json()) as XTweetResultResponse;
  const tweet = unwrapXTweetResult(payload.data?.tweetResult?.result);

  if (!tweet?.rest_id) {
    throw new ExtractError("We couldn't find a public X post behind that URL.");
  }

  return tweet;
}

function unwrapXTweetResult(value: unknown): XApiTweet | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (record.__typename === "Tweet") {
    return record as XApiTweet;
  }

  if ("tweet" in record) {
    return unwrapXTweetResult(record.tweet);
  }

  if ("result" in record) {
    return unwrapXTweetResult(record.result);
  }

  return record as XApiTweet;
}

function getXNoteTweetText(tweet: XApiTweet) {
  return cleanText(
    tweet.note_tweet?.note_tweet_results?.result?.text ||
      tweet.note_tweet_results?.result?.text ||
      tweet.note_tweet?.text ||
      "",
  );
}

function expandXUrlsInText(
  text: string,
  urls: Array<{ url?: string; expanded_url?: string }>,
) {
  return urls.reduce((value, entry) => {
    if (!entry.url || !entry.expanded_url) {
      return value;
    }

    return value.split(entry.url).join(entry.expanded_url);
  }, text);
}

function renderXArticleMarkdown(article: XApiArticle, fallbackText: string) {
  const blocks = article.content_state?.blocks ?? [];

  if (blocks.length === 0) {
    return fallbackText;
  }

  const parts = blocks
    .map((block) => renderXArticleBlock(block))
    .filter((block): block is string => Boolean(block));

  return cleanMarkdown(parts.join("\n\n")) || fallbackText;
}

function renderXArticleBlock(block: XApiArticleBlock) {
  const text = applyInlineStylesToText(
    cleanText(block.text ?? ""),
    block.inlineStyleRanges ?? [],
  );

  if (block.type === "atomic" || !text) {
    return null;
  }

  switch (block.type) {
    case "header-one":
      return `# ${text}`;
    case "header-two":
      return `## ${text}`;
    case "header-three":
      return `### ${text}`;
    case "unordered-list-item":
      return `- ${text}`;
    case "ordered-list-item":
      return `1. ${text}`;
    case "blockquote":
      return `> ${text}`;
    default:
      return text;
  }
}

function applyInlineStylesToText(
  value: string,
  ranges: Array<{ length: number; offset: number; style: string }>,
) {
  let output = value;
  const sortedRanges = [...ranges].sort((left, right) => right.offset - left.offset);

  for (const range of sortedRanges) {
    const before = output.slice(0, range.offset);
    const target = output.slice(range.offset, range.offset + range.length);
    const after = output.slice(range.offset + range.length);

    if (!target) {
      continue;
    }

    const wrapped =
      range.style === "Bold"
        ? `**${target}**`
        : range.style === "Italic"
          ? `*${target}*`
          : target;

    output = `${before}${wrapped}${after}`;
  }

  return output;
}

async function extractXOEmbedFallback(url: URL) {
  const oEmbedUrl = new URL("https://publish.x.com/oembed");
  oEmbedUrl.searchParams.set("omit_script", "1");
  oEmbedUrl.searchParams.set("dnt", "true");
  oEmbedUrl.searchParams.set("url", url.toString());

  const response = await fetch(oEmbedUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new ExtractError(
      "We could not read that X post yet. Make sure the post is public and try again.",
    );
  }

  const payload = (await response.json()) as XOEmbedResponse;
  const html = payload.html ?? "";
  const dom = new JSDOM(html);
  const blockquote = dom.window.document.querySelector("blockquote");
  const paragraphs = Array.from(blockquote?.querySelectorAll("p") ?? [])
    .map((paragraph) => cleanText(paragraph.textContent ?? ""))
    .filter(Boolean);

  const contentText = paragraphs.join("\n\n").trim();

  if (!contentText) {
    throw new ExtractError(
      "That X URL did not expose readable text through the public extraction path.",
    );
  }

  const authorName = optionalText(payload.author_name);
  const authorHandle = getHandleFromAuthorUrl(payload.author_url);
  const byline =
    authorName && authorHandle
      ? `${authorName} (@${authorHandle})`
      : authorName || (authorHandle ? `@${authorHandle}` : undefined);

  const title = authorHandle
    ? `Post by @${authorHandle}`
    : authorName
      ? `${authorName} on X`
      : "X post";

  return finalizeDocument({
    sourceType: "x_post",
    title,
    url: url.toString(),
    canonicalUrl: payload.url ?? url.toString(),
    siteName: "X",
    byline,
    excerpt: contentText.slice(0, 220),
    contentMarkdown: contentText,
    contentText,
  });
}

function getCanonicalUrl(document: Document, fallback: string) {
  const canonical = document
    .querySelector("link[rel='canonical']")
    ?.getAttribute("href");

  if (!canonical) {
    return fallback;
  }

  try {
    return new URL(canonical, fallback).toString();
  } catch {
    return fallback;
  }
}

function getMetaContent(document: Document, property: string) {
  return document
    .querySelector(`meta[property="${property}"]`)
    ?.getAttribute("content");
}

function getMetaName(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute("content");
}

function getHandleFromAuthorUrl(authorUrl?: string) {
  if (!authorUrl) {
    return null;
  }

  try {
    const pathname = new URL(authorUrl).pathname;
    return pathname.split("/").filter(Boolean).at(-1) ?? null;
  } catch {
    return null;
  }
}

function optionalText(value?: string | null) {
  const cleaned = cleanText(value ?? "");
  return cleaned || undefined;
}

function normalizeDate(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return undefined;
  }

  return date.toISOString();
}

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function cleanText(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanMarkdown(value: string) {
  return value.replace(/\n{3,}/g, "\n\n").trim();
}

function tidyMarkdownContent(value: string) {
  return cleanMarkdown(
    value
      .replace(/!\[[^\]]*]\([^)]*\)/g, "")
      .replace(/^\s*\\?\[\s*\\?\]\s*$/gm, "")
      .replace(/\n\*\*Notes\*\*[\s\S]*$/i, "")
      .replace(/\nNotes[\s\S]*$/i, ""),
  );
}

function markdownToPlainText(value: string) {
  return cleanText(
    value
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s*[-+*]\s+/gm, "")
      .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
      .replace(/[*_`>#]/g, "")
      .replace(/\n{3,}/g, "\n\n"),
  );
}
