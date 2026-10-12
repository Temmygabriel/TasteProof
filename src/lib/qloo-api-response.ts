import { NextResponse } from "next/server";
import { QlooApiError, QlooConfigurationError } from "./qloo";

export function qlooErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof QlooConfigurationError) {
    return NextResponse.json({ error: error.message, code: "QLOO_NOT_CONFIGURED" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }
  if (error instanceof QlooApiError) {
    const status = error.status === 429
      ? 429
      : error.status === 504
        ? 504
        : error.status === 401 || error.status === 403
          ? 503
          : 502;
    return NextResponse.json({ error: error.message, code: "QLOO_REQUEST_FAILED" }, {
      status,
      headers: { "Cache-Control": "no-store" }
    });
  }
  return null;
}
