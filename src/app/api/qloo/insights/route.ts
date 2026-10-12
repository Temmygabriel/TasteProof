import { NextResponse } from "next/server";
import { getCandidateRanking } from "../../../../lib/qloo";
import { qlooErrorResponse } from "../../../../lib/qloo-api-response";
import { rateLimit } from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validIds(value: unknown, min: number, max: number): value is string[] {
  return Array.isArray(value) &&
    value.length >= min &&
    value.length <= max &&
    value.every((item) => typeof item === "string" && item.trim().length > 0 && item.trim().length <= 120);
}

export async function POST(request: Request) {
  const limit = rateLimit(request, "qloo-insights", 8, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many Insights requests. Wait before trying again.", code: "RATE_LIMITED" }, {
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

  if (!isRecord(body) ||
      !validIds(body.anchorEntityIds, 2, 5) ||
      !validIds(body.candidateEntityIds, 2, 10) ||
      typeof body.location !== "string" ||
      !body.location.trim() ||
      body.location.trim().length > 100) {
    return NextResponse.json({
      error: "Provide 2–5 anchorEntityIds, 2–10 candidateEntityIds and a location of 100 characters or fewer."
    }, { status: 400 });
  }

  try {
    const entities = await getCandidateRanking(
      body.anchorEntityIds.map((id) => id.trim()),
      body.candidateEntityIds.map((id) => id.trim()),
      body.location.trim()
    );
    return NextResponse.json({
      orderingSource: "Qloo Insights response order sorted by affinity",
      entities: entities.map((entity, index) => ({ ...entity, rank: index + 1 }))
    }, { headers: { "Cache-Control": "no-store", "X-RateLimit-Remaining": String(limit.remaining) } });
  } catch (error) {
    const response = qlooErrorResponse(error);
    if (response) return response;
    return NextResponse.json({ error: "The Qloo Insights request failed." }, { status: 500 });
  }
}
