import { randomUUID } from "node:crypto";
import { evaluateCandidates } from "./evaluate";
import { chooseEntity, searchEntities, getAffinityBaseline, getCandidateRanking, type QlooEntity } from "./qloo";
import type { TasteTestInput, TasteTestRun, AnchorType } from "./types";
import { TestStateMachine, type StateSnapshot } from "./test-state";

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]);
    }
  }));
  return results;
}

export class AnchorResolutionError extends Error {
  readonly unresolvedAnchors: Array<{
    name: string;
    type: AnchorType;
    candidatesFound: number;
    matches: QlooEntity[];
  }>;
  readonly trace: StateSnapshot;
  constructor(items: Array<{
    name: string;
    type: AnchorType;
    candidatesFound: number;
    matches: QlooEntity[];
  }>, trace: StateSnapshot) {
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
  if (entity) return { entity, resolution: "resolved" as const, matches: entities };
  return {
    entity: null,
    resolution: entities.length > 1 ? "ambiguous" as const : "not_found" as const,
    matches: entities
  };
}

function normalizedName(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export async function runTasteTest(input: TasteTestInput): Promise<TasteTestRun> {
  const machine = new TestStateMachine();
  machine.transition("CONFIGURED");
  machine.transition("RESOLVING_TASTE");

  // If the user picked a concrete Qloo result in the UI, use that exact entity
  // ID. Otherwise try exact-name resolution and return Qloo suggestions if it
  // is ambiguous or does not match exactly.
  const anchorMatches = await mapWithConcurrency(input.anchors, 2, async (anchor) => {
    if (anchor.entityId) {
      return {
        anchor,
        entity: { entityId: anchor.entityId, name: anchor.name, subtype: null },
        resolution: "resolved" as const,
        matches: [] as QlooEntity[]
      };
    }
    return {
      anchor,
      ...resolveOne(anchor.name, await searchEntities(anchor.name, anchor.type))
    };
  });

  const unresolvedAnchors = anchorMatches.filter((match) => !match.entity).map((match) => ({
    name: match.anchor.name,
    type: match.anchor.type,
    candidatesFound: match.matches.length,
    matches: match.matches
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
  const selectedCandidateByName = new Map(
    (input.candidateSelections ?? []).map((selection) => [normalizedName(selection.name), selection])
  );
  const candidateMatches = await mapWithConcurrency(input.candidates, 2, async (name) => {
    const selection = selectedCandidateByName.get(normalizedName(name));
    if (selection) {
      return {
        inputName: name,
        entity: { entityId: selection.entityId, name: selection.name, subtype: null },
        resolution: "resolved" as const
      };
    }
    return {
      inputName: name,
      ...resolveOne(name, await searchEntities(name, "place"))
    };
  });

  machine.transition("EVALUATING");
  const anchorEntityIds = anchors.map((anchor) => anchor.entityId);

  // Keep a separate discovery baseline for the evidence drawer, but score the
  // user's submitted place entities directly. Candidate recommendations should
  // not have to appear in an unrelated top-20 recommendation list to be ranked.
  const baseline = await getAffinityBaseline(anchorEntityIds, input.location, 20);

  // Preserve safe contextual disambiguation: if search gave multiple exact
  // candidates, a single exact-name place in the location-scoped discovery
  // baseline can identify it without guessing between duplicate entities.
  const normalizeName = (value: string) =>
    value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
  const candidatesForRanking = candidateMatches.map((match) => {
    if (match.entity || match.resolution !== "ambiguous") return match;
    const exact = baseline.filter((entity) => normalizeName(entity.name) === normalizeName(match.inputName));
    const unique = Array.from(new Map(exact.map((entity) => [entity.entityId.toUpperCase(), entity])).values());
    return unique.length === 1
      ? { ...match, entity: unique[0], resolution: "resolved" as const }
      : match;
  });

  const submittedEntityIds = candidatesForRanking.flatMap((candidate) =>
    candidate.entity ? [candidate.entity.entityId] : []
  );
  const candidateRanking = await getCandidateRanking(anchorEntityIds, submittedEntityIds, input.location);
  const evaluation = evaluateCandidates(candidatesForRanking, candidateRanking);
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
    baseline,
    rankedCandidateCount: evaluation.rankedCandidateCount,
    baselineResultCount: evaluation.baselineResultCount,
    evaluationRule:
      "Ask Qloo Insights to rank the submitted, resolved candidate place entities directly using filter.results.entities, the provided taste-anchor entity IDs, and the chosen location, sorted by affinity. Among candidate entities Qloo returns: top third = PASS, middle third = REVIEW, bottom third = FAIL. Candidates Qloo cannot resolve or return remain UNRESOLVED; if fewer than three candidates are returned, no relative verdict is assigned. Rank is ordinal, not a numeric affinity score. The separate 20-place discovery list is context only and is not used to decide whether a submitted candidate gets ranked.",
    providerNote:
      "Live Qloo entity search plus a candidate-filtered Qloo Insights response sorted by affinity. The separate discovery baseline is shown for context. No numeric affinity score is fabricated."
  };
}
