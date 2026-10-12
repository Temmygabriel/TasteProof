import { POST as evaluateTasteTest } from "../evaluate/route";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  return evaluateTasteTest(request);
}
