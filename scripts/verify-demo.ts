import { runTasteTest } from "../src/lib/run-test";
import type { AnchorType, TasteTestInput, TasteTestRun } from "../src/lib/types";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + " is required for live verification.");
  return value;
}
function report(run: TasteTestRun) {
  console.log("Live Qloo test: " + run.testId);
  console.log("Created: " + run.createdAt);
  console.log("Resolved anchors: " + run.anchors.map((anchor) => anchor.resolvedName).join(" / "));
  console.log("Ranked candidates: " + run.rankedCandidateCount);
  run.candidates.forEach((item) => console.log(item.inputName + " | " + (item.qlooRank ? "rank " + item.qlooRank : "no rank") + " | " + item.verdict + " | " + item.evidence));
}
async function main() {
  if (!process.env.QLOO_API_KEY?.trim()) throw new Error("Set the GitHub Actions secret QLOO_API_KEY before running live verification.");
  const candidates = required("TASTEPROOF_DEMO_CANDIDATES").split(",").map((item) => item.trim()).filter(Boolean);
  if (candidates.length < 3) throw new Error("Provide three candidate names copied from actual external agent output.");
  const location = process.env.TASTEPROOF_LOCATION?.trim() || "Copenhagen";
  const swapName = process.env.TASTEPROOF_SWAP_ANCHOR?.trim() || "The Bear";
  const swapType = (process.env.TASTEPROOF_SWAP_ANCHOR_TYPE?.trim() || "tv_show") as AnchorType;
  const firstInput: TasteTestInput = {
    anchors: [
      { name: "Tyler, the Creator", type: "artist" },
      { name: "Aesop", type: "brand" },
      { name: "Dune", type: "movie" }
    ],
    candidates,
    task: "Recommend a hotel in " + location + " based on the supplied taste context.",
    location
  };
  const first = await runTasteTest(firstInput);
  report(first);
  if (first.rankedCandidateCount < 2) throw new Error("First run has fewer than two ranked candidates; the demo is not verified.");
  const secondInput: TasteTestInput = {
    ...firstInput,
    anchors: [firstInput.anchors[0], firstInput.anchors[1], { name: swapName, type: swapType }]
  };
  const second = await runTasteTest(secondInput);
  report(second);
  if (first.testId === second.testId || second.rankedCandidateCount < 2) throw new Error("The second live anchor-swap run is incomplete.");
  console.log("ANCHOR SWAP: " + firstInput.anchors[2].name + " -> " + swapName);
  first.candidates.forEach((old) => {
    const next = second.candidates.find((candidate) => candidate.inputName === old.inputName);
    if (next) console.log(old.inputName + ": " + (old.qlooRank !== next.qlooRank || old.verdict !== next.verdict ? "OBSERVED CHANGE" : "NO OBSERVED CHANGE"));
  });
  console.log("Completed two separate live Qloo requests. No fixture or synthetic response was used.");
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Live verification failed.");
  process.exitCode = 1;
});
