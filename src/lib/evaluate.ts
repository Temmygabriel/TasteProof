import type { CandidateResult, Verdict } from "./types";
import type { QlooEntity } from "./qloo";

export function verdictForRank(rank: number, count: number): Verdict {
  if (!Number.isInteger(rank) || rank < 1 || count < 2 || rank > count) return "UNRESOLVED";
  const passCutoff = Math.ceil(count / 3);
  const reviewCutoff = Math.ceil((count * 2) / 3);
  if (rank <= passCutoff) return "PASS";
  if (rank <= reviewCutoff) return "REVIEW";
  return "FAIL";
}

export function evaluateCandidates(
  inputs: Array<{ inputName: string; entity: QlooEntity | null; resolution: "resolved" | "ambiguous" | "not_found" }>,
  qlooResults: QlooEntity[]
): { candidates: CandidateResult[]; rankedCandidateCount: number } {
  const submittedIds = new Set(inputs.flatMap((item) => item.entity ? [item.entity.entityId.toUpperCase()] : []));
  const ordered = qlooResults.filter((entity) => submittedIds.has(entity.entityId.toUpperCase()));
  const rankById = new Map<string, number>();
  ordered.forEach((entity, index) => {
    const id = entity.entityId.toUpperCase();
    if (!rankById.has(id)) rankById.set(id, index + 1);
  });
  const count = rankById.size;
  const candidates = inputs.map((item): CandidateResult => {
    if (!item.entity) {
      return {
        inputName: item.inputName, resolvedName: null, entityId: null, resolution: item.resolution,
        qlooRank: null, verdict: "UNRESOLVED",
        evidence: item.resolution === "ambiguous"
          ? "Qloo returned multiple plausible matches. Refine the candidate name; no verdict was assigned."
          : "Qloo did not resolve this candidate. No verdict was assigned."
      };
    }
    const rank = rankById.get(item.entity.entityId.toUpperCase()) ?? null;
    if (rank === null || count < 2) {
      return {
        inputName: item.inputName, resolvedName: item.entity.name, entityId: item.entity.entityId,
        resolution: "resolved", qlooRank: rank, verdict: "UNRESOLVED",
        evidence: rank === null
          ? "Qloo resolved this entity but did not return it in the constrained ranking; evidence is insufficient."
          : "Fewer than two submitted candidates have usable Qloo ranking evidence."
      };
    }
    return {
      inputName: item.inputName, resolvedName: item.entity.name, entityId: item.entity.entityId,
      resolution: "resolved", qlooRank: rank, verdict: verdictForRank(rank, count),
      evidence: "Qloo ranked this resolved entity " + rank + " of " + count +
        " submitted candidates for the provided taste anchors and location. This is a relative rank, not a probability or guarantee."
    };
  });
  return { candidates, rankedCandidateCount: count };
}
