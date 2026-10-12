import { NextResponse } from "next/server";
import { qlooErrorResponse } from "../../../../lib/qloo-api-response";
import { searchEntities } from "../../../../lib/qloo";
import { ANCHOR_TYPES, type AnchorType } from "../../../../lib/types";
import { rateLimit } from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const limit = rateLimit(request, "qloo-search", 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many entity searches. Wait before trying again.", code: "RATE_LIMITED" }, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" }
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request must contain valid JSON." }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.query !== "string" || !body.query.trim() || body.query.trim().length > 120) {
    return NextResponse.json({ error: "query must be non-empty text of 120 characters or fewer." }, { status: 400 });
  }
  if (typeof body.type !== "string" || !ANCHOR_TYPES.includes(body.type as AnchorType)) {
    return NextResponse.json({ error: "type must be a supported Qloo entity category." }, { status: 400 });
  }

  try {
    const entities = await searchEntities(body.query.trim(), body.type as AnchorType);
    return NextResponse.json({ entities }, {
      headers: { "Cache-Control": "no-store", "X-RateLimit-Remaining": String(limit.remaining) }
    });
  } catch (error) {
    const response = qlooErrorResponse(error);
    if (response) return response;
    return NextResponse.json({ error: "The Qloo entity search failed." }, { status: 500 });
  }
}
