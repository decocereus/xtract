"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  GitBranch,
  LoaderCircle,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { ExtractResponse, ExtractedDocument } from "@/lib/extract/types";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "markdown", label: "For agent" },
  { value: "text", label: "Text" },
  { value: "json", label: "JSON" },
] as const;

type TabValue = (typeof tabs)[number]["value"];

const OSS_REPO_URL = "https://github.com/decocereus/xtract";
const X_PROFILE_URL = "https://x.com/decocereus";

function formatPublishedDate(value?: string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getJsonPreview(document: ExtractedDocument) {
  return JSON.stringify(document, null, 2);
}

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-4">
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-72 w-full rounded-[1.35rem]" />
    </div>
  );
}

function getSourceLabel(result: ExtractedDocument) {
  if (result.sourceType === "x_article") {
    return "X article";
  }

  if (result.sourceType === "x_post") {
    return "X post";
  }

  return "Article";
}

export function ExtractorShell() {
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("markdown");
  const [result, setResult] = useState<ExtractedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedTab, setCopiedTab] = useState<TabValue | null>(null);
  const hasActiveDocument = isSubmitting || result !== null;

  const activeValue =
    result == null
      ? ""
      : activeTab === "markdown"
        ? result.markdown
        : activeTab === "text"
          ? result.plainText
          : getJsonPreview(result);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setCopiedTab(null);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        setError(
          response.status >= 500
            ? "The server hit an internal error while extracting this URL."
            : "The extractor returned an unexpected response for this URL.",
        );
        return;
      }

      const payload = (await response.json()) as ExtractResponse;

      if (!response.ok || !payload.ok) {
        setError(
          payload.ok ? "We couldn't extract that URL yet." : payload.message,
        );
        return;
      }

      setResult(payload.document);
      setActiveTab("markdown");
    } catch {
      setError(
        "The extractor could not reach the server. Try again in a moment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!activeValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeValue);
      setCopiedTab(activeTab);
      window.setTimeout(() => setCopiedTab(null), 1800);
    } catch {
      setError(
        "Clipboard access failed. You can still select and copy the output manually.",
      );
    }
  }

  const resultMeta = result
    ? [
        getSourceLabel(result),
        result.byline,
        formatPublishedDate(result.publishedAt),
      ].filter(Boolean)
    : [];

  return (
    <div
      className={cn(
        "min-h-screen",
        hasActiveDocument && "md:h-screen md:overflow-hidden",
      )}
    >
      <main
        className={cn(
          "mx-auto flex w-full max-w-5xl flex-col px-5 sm:px-8",
          hasActiveDocument
            ? "min-h-screen py-3 sm:py-4 md:h-full md:max-h-full"
            : "min-h-screen py-6 sm:py-10",
        )}
      >
        <header>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div
              className={cn(
                "flex flex-col",
                hasActiveDocument ? "gap-1" : "gap-2",
              )}
            >
              <p
                className={cn(
                  "font-heading leading-none italic tracking-[-0.04em] text-primary transition-[font-size,opacity] duration-300 ease-out",
                  hasActiveDocument
                    ? "text-[2rem] sm:text-[2.2rem]"
                    : "text-[2.4rem] sm:text-[2.8rem]",
                )}
              >
                xtract
              </p>
              <p
                className={cn(
                  "max-w-md text-pretty text-sm leading-6 text-muted-foreground transition-[opacity,transform] duration-300 ease-out",
                  hasActiveDocument
                    ? "hidden sm:block sm:text-xs"
                    : "text-sm",
                )}
              >
                Open source extraction for public X posts, X articles, and web
                links.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <a
                href={X_PROFILE_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-9 rounded-full px-3 text-foreground/55 transition-colors hover:bg-transparent hover:text-primary dark:text-foreground/52 dark:hover:text-primary",
                )}
              >
                @decocereus
              </a>
              <a
                href={OSS_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "ink-action h-9 rounded-full border-white/65 bg-background/78 px-3 shadow-sm shadow-black/5 backdrop-blur dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-foreground/88 dark:shadow-black/25 dark:hover:border-primary/30 dark:hover:bg-white/[0.06] dark:hover:text-foreground",
                )}
              >
                <GitBranch className="size-4" />
                GitHub
                <ArrowUpRight className="size-3.5 opacity-70" />
              </a>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <section
            className={cn(
              "flex flex-1 flex-col min-h-0",
              hasActiveDocument
                ? "gap-3 pt-3 sm:gap-4 sm:pt-4"
                : "gap-10 pt-16 sm:gap-12 sm:pt-24",
            )}
          >
          <div
            className={cn(
              "flex max-w-3xl flex-col",
              hasActiveDocument ? "gap-1.5" : "gap-4",
            )}
          >
            <h1
              className={cn(
                "font-heading leading-[0.94] tracking-[-0.05em] text-balance text-foreground transition-[font-size,opacity,transform] duration-300 ease-out",
                hasActiveDocument
                  ? "text-[2.1rem] sm:text-[2.5rem] lg:text-[2.7rem]"
                  : "text-5xl sm:text-6xl lg:text-7xl",
              )}
            >
              Paste an X link.
              <br />
              <span className="text-primary">Get the actual text.</span>
            </h1>
            <p
              className={cn(
                "max-w-2xl text-pretty text-muted-foreground transition-[opacity,transform] duration-300 ease-out",
                hasActiveDocument ? "hidden" : "text-base leading-7 sm:text-lg",
              )}
            >
              Posts and long-form X articles, formatted for agents.
            </p>
          </div>

          <div
            className={cn(
              "panel-shell surface-shadow relative isolate flex min-h-0 flex-col overflow-hidden rounded-[1.85rem] border border-white/70 bg-card/92 backdrop-blur dark:border-white/[0.08] dark:bg-card/[0.82]",
              hasActiveDocument ? "flex-1 p-3 sm:p-3.5" : "p-4 sm:p-5",
            )}
          >
            <form
              className="relative flex flex-col gap-3"
              onSubmit={handleSubmit}
            >
              <FieldGroup>
                <Field
                  data-invalid={error ? "true" : undefined}
                  className="gap-2"
                >
                  <FieldLabel htmlFor="url" className="sr-only">
                    X post or X article URL
                  </FieldLabel>

                  <div className="input-shell relative flex flex-col gap-1.5 rounded-[1.3rem] border border-white/65 bg-background/78 p-1.5 dark:border-white/[0.08] dark:bg-black/10 sm:flex-row sm:items-center">
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-5 top-0 h-px bg-linear-to-r from-transparent via-primary/26 to-transparent opacity-90"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-y-2 right-18 hidden w-16 rounded-full bg-primary/8 blur-2xl sm:block dark:bg-primary/10"
                    />
                    <Input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="Paste an X post or X article URL"
                      className="h-11 rounded-[1.05rem] border-0 bg-transparent px-3 text-[16px] shadow-none transition-[background-color,color] duration-200 ease-out placeholder:text-muted-foreground/80 focus-visible:bg-background/82 focus-visible:ring-0 dark:focus-visible:bg-white/[0.03] sm:flex-1"
                      aria-invalid={error ? "true" : undefined}
                    />

                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting || url.trim().length === 0}
                      className="h-11 rounded-[1.05rem] px-4 shadow-sm shadow-primary/10 transition-[transform,box-shadow,background-color,opacity] duration-200 ease-out hover:translate-y-[-1px] hover:shadow-lg hover:shadow-primary/18 sm:min-w-28"
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Extracting
                        </>
                      ) : (
                        "Extract"
                      )}
                    </Button>
                  </div>

                  <FieldError>{error}</FieldError>
                </Field>
              </FieldGroup>
            </form>

            {isSubmitting ? <ResultSkeleton /> : null}

            {result ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 flex min-h-0 flex-col gap-3 pt-3 duration-300">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    {resultMeta.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {resultMeta.join(" · ")}
                      </p>
                    ) : null}

                    <h2 className="font-heading text-[2rem] leading-tight tracking-[-0.04em] text-balance text-foreground sm:text-[2.4rem]">
                      {result.title}
                    </h2>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copiedTab === activeTab ? (
                      <>
                        <Check className="size-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as TabValue)}
                  className="flex min-h-0 flex-1 gap-2.5"
                >
                  <TabsList variant="line">
                    {tabs.map((tab) => (
                      <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {tabs.map((tab) => {
                    const value =
                      tab.value === "markdown"
                        ? result.markdown
                        : tab.value === "text"
                          ? result.plainText
                          : getJsonPreview(result);

                    return (
                      <TabsContent
                        key={tab.value}
                        value={tab.value}
                        className="animate-in fade-in slide-in-from-bottom-1 min-h-0 duration-200"
                      >
                        <div className="soft-outline h-[min(44vh,24rem)] overflow-hidden rounded-[1.35rem] border border-white/70 bg-background/72 transition-[border-color,transform,box-shadow] duration-300 ease-out dark:border-white/[0.08] dark:bg-black/10 md:h-full md:min-h-0">
                          <pre className="h-full overflow-auto px-4 py-4 font-mono text-[13px] leading-6 whitespace-pre-wrap break-words text-foreground sm:px-5">
                            {value}
                          </pre>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
