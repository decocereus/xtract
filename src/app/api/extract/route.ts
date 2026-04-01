import { NextResponse } from "next/server";

import { extractFromUrl, ExtractError } from "@/lib/extract";
import type { ExtractResponse } from "@/lib/extract/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: unknown };
    const url = typeof body.url === "string" ? body.url : "";

    if (!url.trim()) {
      const response: ExtractResponse = {
        ok: false,
        message: "Paste a public article or X post URL to extract it.",
      };

      return NextResponse.json(response, { status: 400 });
    }

    const document = await extractFromUrl(url);
    const response: ExtractResponse = { ok: true, document };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof ExtractError
        ? error.message
        : "We couldn't extract this URL yet. Try a public article page or a public X post.";

    const response: ExtractResponse = { ok: false, message };

    return NextResponse.json(response, { status: 400 });
  }
}
