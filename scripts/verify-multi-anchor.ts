import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runTasteTest } from "../src/lib/run-test";
import type { AnchorType, TasteAnchorInput, TasteTestInput, TasteTestRun } from "../src/lib/types";

interface CanonicalFixture {
  location: string;
  taskTemplate: string;
  anchors: TasteAnchorInput[];
}

function report(run: TasteTestRun, label: string) {
  const unresolved = run.candidates.filter((candidate) => candidate.verdict === "UNRESOLVED").length;
  console.log(label + ": anchors=" + run.anchors.length + ", baseline=" + run.baselineResultCount +
    ", ranked=" + run.rankedCandidateCount + "/" + run.candidates.length + ", unresolved=" + unresolved + ".");
  console.log(label + " anchors: " + run.anchors.map((anchor) => anchor.resolvedName + " (" + anchor.type + ")").join(" | "));
  console.log(label + " top baseline: " + run.baseline.slice(0, 5).map((entity) => entity.name + " #" + entity.rank).join(" | "));
}

async function main() {
  if (!process.env.QLOO_API_KEY?.trim()) throw new Error("QLOO_API_KEY is required for live multi-anchor verification.");
  const fixture = JSON.parse(readFileSync(join(process.cwd(), "tests", "fixtures", "canonical-test.json"), "utf8")) as CanonicalFixture;
  const location = process.env.TASTEPROOF_LOCATION?.trim() || "New York City";
  const swapName = process.env.TASTEPROOF_SWAP_ANCHOR?.trim() || "Frank Ocean";
  const swapType = (process.env.TASTEPROOF_SWAP_ANCHOR_TYPE?.trim() || "artist") as AnchorType;
  const task = fixture.taskTemplate.replaceAll("{location}", location);

  // First fetch an actual multi-anchor baseline, then use names from that
  // provider response as candidates. No synthetic result data is introduced.
  const seed: TasteTestInput = {
    anchors: fixture.anchors,
    candidates: ["One Times Square", "Brooklyn Bridge", "Mood Fabrics"],
    task,
    location
  };
  const seedRun = await runTasteTest(seed);
  report(seedRun, "Mixed-anchor seed");
  if (seedRun.baselineResultCount < 3) {
    throw new Error("The three-anchor live baseline returned fewer than three places; the default multi-anchor experience needs investigation.");
  }

  const candidates = seedRun.baseline.slice(0, 10).map((entity) => entity.name);
  const first = await runTasteTest({ ...seed, candidates });
  report(first, "Mixed-anchor evaluation");
  if (first.baselineResultCount < 3 || first.rankedCandidateCount < 3) {
    throw new Error("Mixed-anchor evaluation needs at least three baseline places and three ranked candidates; got baseline=" +
      first.baselineResultCount + ", ranked=" + first.rankedCandidateCount + ".");
  }

  const swappedAnchors = fixture.anchors.map((anchor, index) =>
    index === fixture.anchors.length - 1 ? { name: swapName, type: swapType } : anchor
  );
  const second = await runTasteTest({ ...seed, anchors: swappedAnchors, candidates });
  report(second, "Mixed-anchor Anchor Swap");
  if (second.testId === first.testId || second.baselineResultCount < 3 || second.rankedCandidateCount < 3) {
    throw new Error("Mixed-anchor Anchor Swap needs a distinct live run, at least three baseline places, and at least three ranked candidates.");
  }

  const rankChanges = first.candidates.filter((oldCandidate) => {
    const next = second.candidates.find((candidate) => candidate.inputName.toLocaleLowerCase() === oldCandidate.inputName.toLocaleLowerCase());
    return Boolean(next && oldCandidate.qlooRank !== next.qlooRank);
  }).length;
  const verdictChanges = first.candidates.filter((oldCandidate) => {
    const next = second.candidates.find((candidate) => candidate.inputName.toLocaleLowerCase() === oldCandidate.inputName.toLocaleLowerCase());
    return Boolean(next && oldCandidate.verdict !== next.verdict);
  }).length;
  console.log("TASTEPROOF_MULTI_ANCHOR_JSON=" + JSON.stringify({
    verified: true,
    mode: "qloo-live-mixed-anchors",
    anchorsBefore: first.anchors.length,
    anchorsAfter: second.anchors.length,
    baselineResultCounts: [first.baselineResultCount, second.baselineResultCount],
    rankedCandidates: [first.rankedCandidateCount, second.rankedCandidateCount],
    anchorSwapped: true,
    observedRankChanges: rankChanges,
    observedVerdictChanges: verdictChanges
  }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Live multi-anchor verification failed.");
  process.exitCode = 1;
});
