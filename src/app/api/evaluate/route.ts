import { NextResponse } from "next/server";
import { AnchorResolutionError, DuplicateResolvedAnchorError, runTasteTest } from "../../../lib/run-test";
import { QlooApiError, QlooConfigurationError } from "../../../lib/qloo";
import { InputValidationError, parseTasteTestInput } from "../../../lib/validation";
import { rateLimit } from "../../../lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const limit = rateLimit(request, "taste-test", 4, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many test runs. Wait before trying again.", code: "RATE_LIMITED", state: "RATE_LIMITED" }, {
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
  try {
    const input = parseTasteTestInput(body);
    return NextResponse.json(await runTasteTest(input), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof InputValidationError) {
      return NextResponse.json({ error: error.message, state: "INPUT_INVALID" }, { status: 400 });
    }
    if (error instanceof AnchorResolutionError || error instanceof DuplicateResolvedAnchorError) {
      return NextResponse.json({
        error: error.message,
        state: error instanceof AnchorResolutionError ? error.trace.state : "INPUT_INVALID",
        stateHistory: error instanceof AnchorResolutionError ? error.trace.stateHistory : [],
        unresolvedAnchors: error instanceof AnchorResolutionError ? error.unresolvedAnchors : []
      }, { status: 422 });
    }
    if (error instanceof QlooConfigurationError) {
      return NextResponse.json({ error: error.message, code: "QLOO_NOT_CONFIGURED", state: "QLOO_UNAVAILABLE" }, { status: 503 });
    }
    if (error instanceof QlooApiError) {
      const status = error.status === 429 ? 429 : error.status === 504 ? 504 : [401, 403].includes(error.status) ? 503 : 502;
      return NextResponse.json({ error: error.message, code: "QLOO_REQUEST_FAILED", state: error.status === 429 ? "RATE_LIMITED" : "QLOO_UNAVAILABLE" }, { status });
    }
    return NextResponse.json({
      error: "The test could not be completed. No verdict was produced. Try again or inspect server configuration.",
      state: "UNRESOLVED"
    }, { status: 500 });
  }
}
