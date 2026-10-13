import type { CandidateResult, Verdict } from "./types";
import type { QlooEntity, RankedQlooEntity } from "./qloo";

export function verdictForRank(rank: number, baselineCount: number): Verdict {
  if (!Number.isInteger(rank) || rank < 1 || baselineCount < 3 || rank > baselineCount) return "UNRESOLVED";
  const passCutoff = Math.ceil(baselineCount / 3);
  const reviewCutoff = Math.ceil((baselineCount * 2) / 3);
  if (rank <= passCutoff) return "PASS";
  if (rank <= reviewCutoff) return "REVIEW";
  return "FAIL";
}

export function evaluateCandidates(
  inputs: Array<{
    inputName: string;
    entity: QlooEntity | null;
    resolution: "resolved" | "ambiguous" | "not_found";
  }>,
  baseline: RankedQlooEntity[]
): { candidates: CandidateResult[]; rankedCandidateCount: number; baselineResultCount: number } {
  const rankById = new Map<string, number>();
  for (const entity of baseline) {
    const id = entity.entityId.toUpperCase();
    if (!rankById.has(id)) rankById.set(id, entity.rank);
  }

  const baselineResultCount = baseline.length;
  const rankedIds = new Set<string>();

  const candidates = inputs.map((item): CandidateResult => {
    // A candidate name can have multiple exact Qloo search matches (for
    // example, similarly named places). If the location-filtered Insights
    // baseline contains exactly one entity with that exact normalized name,
    // that provides contextual disambiguation without guessing between search
    // results. If the baseline also contains duplicates, keep it unresolved.
    const normalizedInput = item.inputName.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
    const exactBaselineMatches = item.resolution === "ambiguous" && !item.entity
      ? baseline.filter((entity) =>
          entity.name.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ") === normalizedInput
        )
      : [];
    const uniqueBaselineMatches = Array.from(
      new Map(exactBaselineMatches.map((entity) => [entity.entityId.toUpperCase(), entity])).values()
    );
    const baselineDisambiguated = uniqueBaselineMatches.length === 1 ? uniqueBaselineMatches[0] : null;
    const entity = item.entity ?? baselineDisambiguated;

    if (!entity) {
      return {
        inputName: item.inputName,
        resolvedName: null,
        entityId: null,
        resolution: item.resolution,
        evaluationValue: null,
        qlooRank: null,
        verdict: "UNRESOLVED",
        evidence: item.resolution === "ambiguous"
          ? "Qloo returned multiple exact-name matches, and the location-filtered baseline did not uniquely disambiguate them. Use a more precise name; no verdict was assigned."
          : "Qloo did not resolve this candidate. No verdict was assigned."
      };
    }

    const id = entity.entityId.toUpperCase();
    const rank = rankById.get(id) ?? null;
    if (rank === null) {
      return {
        inputName: item.inputName,
        resolvedName: entity.name,
        entityId: entity.entityId,
        resolution: "resolved",
        evaluationValue: null,
        qlooRank: null,
        verdict: "UNRESOLVED",
        evidence: "The entity resolved, but Qloo did not include it in the returned affinity-ranked baseline. Absence from this result window is not proof of a mismatch."
      };
    }

    rankedIds.add(id);
    const verdict = verdictForRank(rank, baselineResultCount);
    return {
      inputName: item.inputName,
      resolvedName: entity.name,
      entityId: entity.entityId,
      resolution: "resolved",
      evaluationValue: rank,
      qlooRank: rank,
      verdict,
      evidence: baselineResultCount < 3
        ? "Qloo returned too few baseline places to apply the documented rank thresholds. No verdict was assigned."
        : (baselineDisambiguated
            ? "Qloo search returned multiple exact-name matches, but the location-filtered baseline contained one exact-name entity. Resolved within that context. "
            : "") + "Qloo placed this entity at rank " + rank + " of " + baselineResultCount +
          " returned places sorted by affinity for the supplied taste anchors and location. This is an ordinal position, not a numeric affinity score or a guarantee of preference."
    };
  });

  return { candidates, rankedCandidateCount: rankedIds.size, baselineResultCount };
}
