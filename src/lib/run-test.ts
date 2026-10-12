import { randomUUID } from "node:crypto";
import { evaluateCandidates } from "./evaluate";
import { chooseEntity, searchEntities, getCandidateRanking, type QlooEntity } from "./qloo";
import type { TasteTestInput, TasteTestRun, AnchorType } from "./types";

export class AnchorResolutionError extends Error {
  readonly unresolvedAnchors: Array<{ name: string; type: AnchorType; candidatesFound: number }>;
  constructor(items: Array<{ name: string; type: AnchorType; candidatesFound: number }>) {
    super("One or more taste anchors could not be resolved uniquely by Qloo.");
    this.name = "AnchorResolutionError";
    this.unresolvedAnchors = items;
  }
}

function resolveOne(name: string, entities: QlooEntity[]) {
  const entity = chooseEntity(name, entities);
  if (entity) return { entity, resolution: "resolved" as const };
  return { entity: null, resolution: entities.length > 1 ? "ambiguous" as const : "not_found" as const };
}

export async function runTasteTest(input: TasteTestInput): Promise<TasteTestRun> {
  const anchorMatches = await Promise.all(input.anchors.map(async (anchor) => ({
    anchor,
    ...resolveOne(anchor.name, await searchEntities(anchor.name, anchor.type))
  })));
  const missing = anchorMatches.filter((match) => !match.entity).map((match) => ({
    name: match.anchor.name, type: match.anchor.type, candidatesFound: match.resolution === "ambiguous" ? 2 : 0
  }));
  if (missing.length) throw new AnchorResolutionError(missing);

  const anchors = anchorMatches.flatMap((match) => match.entity ? [{
    inputName: match.anchor.name, resolvedName: match.entity.name, type: match.anchor.type, entityId: match.entity.entityId
  }] : []);

  const candidateMatches = await Promise.all(input.candidates.map(async (name) => ({
    inputName: name,
    ...resolveOne(name, await searchEntities(name, "place"))
  })));
  const resolvedIds = candidateMatches.flatMap((match) => match.entity ? [match.entity.entityId] : []);
  const uniqueIds = Array.from(new Map(resolvedIds.map((id) => [id.toUpperCase(), id])).values());

  let ranked: QlooEntity[] = [];
  if (uniqueIds.length >= 2) ranked = await getCandidateRanking(anchors.map((anchor) => anchor.entityId), uniqueIds, input.location);
  const evaluation = evaluateCandidates(candidateMatches, ranked);

  return {
    testId: randomUUID(),
    createdAt: new Date().toISOString(),
    mode: "qloo-live",
    task: input.task,
    location: input.location,
    anchors,
    candidates: evaluation.candidates,
    rankedCandidateCount: evaluation.rankedCandidateCount,
    evaluationRule: "Top third of submitted candidates in Qloo's returned order = PASS; middle third = REVIEW; bottom third = FAIL. With fewer than two ranked candidates, return UNRESOLVED. This is comparative, not predicted liking.",
    providerNote: "Based on live Qloo entity IDs and the order returned by Qloo Insights. TasteProof does not invent numeric affinity scores."
  };
}
