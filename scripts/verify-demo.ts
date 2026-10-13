import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runTasteTest } from "../src/lib/run-test";
import { chooseEntity, getAffinityBaseline, searchEntities } from "../src/lib/qloo";
import { ANCHOR_TYPES, type AnchorType, type TasteTestInput, type TasteTestRun, type TasteAnchorInput } from "../src/lib/types";

interface CanonicalFixture {
  location: string;
  taskTemplate: string;
  anchors: TasteAnchorInput[];
  swapAnchor: { name: string; type: AnchorType };
}

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), "tests", "fixtures", "canonical-test.json"), "utf8")
) as CanonicalFixture;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + " is required for live verification.");
  return value;
}

function reportRun(run: TasteTestRun, label: string) {
  const unresolved = run.candidates.filter((candidate) => candidate.verdict === "UNRESOLVED").length;
  console.log(label + ": " + run.rankedCandidateCount + " candidates with Qloo ranking evidence; " +
    unresolved + " candidate(s) unresolved.");
}

async function main() {
  if (!process.env.QLOO_API_KEY?.trim()) {
    throw new Error("Set the GitHub Actions secret QLOO_API_KEY before running live verification.");
  }
  const suppliedCandidateNames = required("TASTEPROOF_DEMO_CANDIDATES")
    .split(",").map((item) => item.trim()).filter(Boolean);
  const baselineSmoke = process.env.TASTEPROOF_BASELINE_SMOKE === "true";
  if (!baselineSmoke && suppliedCandidateNames.length !== 3) {
    throw new Error("Provide exactly three candidate names copied from actual external-agent output.");
  }

  const location = process.env.TASTEPROOF_LOCATION?.trim() || fixture.location;
  const swapName = process.env.TASTEPROOF_SWAP_ANCHOR?.trim() || fixture.swapAnchor.name;
  const requestedSwapType = process.env.TASTEPROOF_SWAP_ANCHOR_TYPE?.trim() || fixture.swapAnchor.type;
  if (!ANCHOR_TYPES.includes(requestedSwapType as AnchorType)) {
    throw new Error("The requested Anchor Swap category is not supported.");
  }

  let candidateNames = suppliedCandidateNames;
  if (baselineSmoke) {
    // For the automatic integration smoke test, use actual entities returned
    // by Qloo itself. This avoids a false failure when arbitrary example names
    // do not appear in the taste-ranked baseline.
    const resolvedAnchors = await Promise.all(fixture.anchors.map(async (anchor) => {
      const entity = chooseEntity(anchor.name, await searchEntities(anchor.name, anchor.type));
      if (!entity) throw new Error("Smoke-test anchor did not resolve uniquely: " + anchor.name + " (" + anchor.type + ").");
      return entity;
    }));
    const smokeBaseline = await getAffinityBaseline(resolvedAnchors.map((entity) => entity.entityId), location, 20);
    if (smokeBaseline.length < 3) throw new Error("Qloo returned fewer than three places for the live smoke-test baseline.");
    candidateNames = smokeBaseline.slice(0, 3).map((entity) => entity.name);
    console.log("Automatic smoke test selected three real candidate names from the live Qloo baseline.");
  }

  const firstInput: TasteTestInput = {
    anchors: fixture.anchors,
    candidates: candidateNames,
    task: fixture.taskTemplate.replaceAll("{location}", location),
    location
  };
  let first: TasteTestRun;
  try {
    first = await runTasteTest(firstInput);
  } catch (error) {
    const detail = error as Error & { unresolvedAnchors?: Array<{ name: string; type: string; candidatesFound: number }> };
    if (detail.unresolvedAnchors?.length) {
      console.error("Unresolved taste anchors: " + detail.unresolvedAnchors.map((item) =>
        item.name + " (" + item.type + ", " + (item.candidatesFound ? "multiple exact matches" : "no exact match") + ")"
      ).join("; "));
    }
    throw error;
  }
  reportRun(first, "Initial live test");
  if (first.rankedCandidateCount < 1 || first.baselineResultCount < 3) {
    throw new Error("The initial run returned no candidate in a baseline of at least three Qloo results. Live verification failed.");
  }

  const swappedAnchors = firstInput.anchors.map((anchor, index) =>
    index === firstInput.anchors.length - 1
      ? { name: swapName, type: requestedSwapType as AnchorType }
      : anchor
  );
  const second = await runTasteTest({ ...firstInput, anchors: swappedAnchors });
  reportRun(second, "Anchor Swap live test");
  if (first.testId === second.testId || second.baselineResultCount < 3) {
    throw new Error("The second live Anchor Swap run is incomplete.");
  }

  const comparisons = first.candidates.map((oldCandidate) => {
    const newCandidate = second.candidates.find((candidate) =>
      candidate.inputName.toLocaleLowerCase() === oldCandidate.inputName.toLocaleLowerCase()
    );
    return {
      rankChanged: Boolean(newCandidate && oldCandidate.qlooRank !== newCandidate.qlooRank),
      verdictChanged: Boolean(newCandidate && oldCandidate.verdict !== newCandidate.verdict)
    };
  });
  const rankChanges = comparisons.filter((item) => item.rankChanged).length;
  const verdictChanges = comparisons.filter((item) => item.verdictChanged).length;
  console.log("Anchor Swap ran twice with live Qloo requests.");
  console.log(rankChanges + " candidate rank change(s); " + verdictChanges + " verdict change(s) observed.");
  console.log("No change is acceptable; TasteProof does not force a dramatic result.");
  console.log("TASTEPROOF_VERIFICATION_JSON=" + JSON.stringify({
    verified: true,
    mode: "qloo-live",
    runs: 2,
    rankedCandidates: [first.rankedCandidateCount, second.rankedCandidateCount],
    unresolvedCandidates: [
      first.candidates.filter((candidate) => candidate.verdict === "UNRESOLVED").length,
      second.candidates.filter((candidate) => candidate.verdict === "UNRESOLVED").length
    ],
    anchorSwapped: true,
    observedRankChanges: rankChanges,
    observedVerdictChanges: verdictChanges
  }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Live verification failed.");
  process.exitCode = 1;
});
