import { randomUUID } from "node:crypto";
import { evaluateCandidates } from "./evaluate";
import { chooseEntity, searchEntities, getAffinityBaseline, type QlooEntity } from "./qloo";
import type { TasteTestInput, TasteTestRun, AnchorType } from "./types";
import { TestStateMachine, type StateSnapshot } from "./test-state";

export class AnchorResolutionError extends Error {
  readonly unresolvedAnchors: Array<{ name: string; type: AnchorType; candidatesFound: number }>;
  readonly trace: StateSnapshot;
  constructor(items: Array<{ name: string; type: AnchorType; candidatesFound: number }>, trace: StateSnapshot) {
    super("One or more taste anchors could not be resolved uniquely by Qloo.");
    this.name = "AnchorResolutionError";
    this.unresolvedAnchors = items;
    this.trace = trace;
  }
}

export class DuplicateResolvedAnchorError extends Error {
  constructor() {
    super("Two taste anchors resolved to the same Qloo entity. Choose distinct anchors.");
    this.name = "DuplicateResolvedAnchorError";
  }
}

function resolveOne(name: string, entities: QlooEntity[]) {
  const entity = chooseEntity(name, entities);
  if (entity) return { entity, resolution: "resolved" as const };
  return { entity: null, resolution: entities.length > 1 ? "ambiguous" as const : "not_found" as const };
}

export async function runTasteTest(input: TasteTestInput): Promise<TasteTestRun> {
  const machine = new TestStateMachine();
  machine.transition("CONFIGURED");
  machine.transition("RESOLVING_TASTE");
  const anchorMatches = await Promise.all(input.anchors.map(async (anchor) => ({
    anchor,
    ...resolveOne(anchor.name, await searchEntities(anchor.name, anchor.type))
  })));

  const unresolvedAnchors = anchorMatches.filter((match) => !match.entity).map((match) => ({
    name: match.anchor.name,
    type: match.anchor.type,
    candidatesFound: match.resolution === "ambiguous" ? 2 : 0
  }));
  if (unresolvedAnchors.length) {
    machine.transition("ENTITY_NOT_FOUND");
    throw new AnchorResolutionError(unresolvedAnchors, machine.snapshot());
  }

  machine.transition("TASTE_READY");
  const anchors = anchorMatches.flatMap((match) => match.entity ? [{
    inputName: match.anchor.name,
    resolvedName: match.entity.name,
    type: match.anchor.type,
    entityId: match.entity.entityId
  }] : []);

  const uniqueAnchorIds = new Set(anchors.map((anchor) => anchor.entityId.toUpperCase()));
  if (uniqueAnchorIds.size !== anchors.length) {
    machine.transition("INPUT_INVALID");
    throw new DuplicateResolvedAnchorError();
  }

  machine.transition("RESOLVING_CANDIDATES");
  const candidateMatches = await Promise.all(input.candidates.map(async (name) => ({
    inputName: name,
    ...resolveOne(name, await searchEntities(name, "place"))
  })));

  machine.transition("EVALUATING");
  const baseline = await getAffinityBaseline(anchors.map((anchor) => anchor.entityId), input.location, 20);
  const evaluation = evaluateCandidates(candidateMatches, baseline);
  const hasRankedCandidate = evaluation.candidates.some((candidate) =>
    candidate.verdict === "PASS" || candidate.verdict === "REVIEW" || candidate.verdict === "FAIL"
  );
  const hasUnresolvedCandidate = evaluation.candidates.some((candidate) => candidate.verdict === "UNRESOLVED");
  const finalState = !hasRankedCandidate
    ? "UNRESOLVED"
    : hasUnresolvedCandidate
      ? "PARTIAL_RESULT"
      : "EVALUATED";
  machine.transition(finalState);

  return {
    ...machine.snapshot(),
    testId: randomUUID(),
    createdAt: new Date().toISOString(),
    mode: "qloo-live",
    task: input.task,
    location: input.location,
    anchors,
    candidates: evaluation.candidates,
    rankedCandidateCount: evaluation.rankedCandidateCount,
    baselineResultCount: evaluation.baselineResultCount,
    evaluationRule:
      "Evaluate each submitted candidate against Qloo's actual Insights baseline of up to 20 places sorted by affinity. Top third = PASS, middle third = REVIEW, bottom third = FAIL. Candidates absent from the returned baseline, or a baseline with fewer than three entities, remain UNRESOLVED. Rank is ordinal, not a numeric affinity score.",
    providerNote:
      "Live Qloo entity search plus Qloo Insights response order sorted by affinity. No numeric affinity score is fabricated."
  };
}
