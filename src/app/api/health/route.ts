import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    app: "TasteProof",
    status: "available",
    qlooKeyConfigured: Boolean(process.env.QLOO_API_KEY?.trim()),
    checkNote: "This reports configuration presence only. It does not verify that Qloo will authorize the key."
  }, { headers: { "Cache-Control": "no-store" } });
}
