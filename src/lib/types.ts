export const ANCHOR_TYPES = [
  "artist", "brand", "movie", "tv_show", "book", "place", "podcast", "videogame"
] as const;

export type AnchorType = (typeof ANCHOR_TYPES)[number];
export type Verdict = "PASS" | "REVIEW" | "FAIL" | "UNRESOLVED";

export interface TasteAnchorInput {
  name: string;
  type: AnchorType;
}

export interface TasteTestInput {
  anchors: TasteAnchorInput[];
  candidates: string[];
  task: string;
  location: string;
}

export interface ResolvedAnchor {
  inputName: string;
  resolvedName: string;
  type: AnchorType;
  entityId: string;
}

export interface CandidateResult {
  inputName: string;
  resolvedName: string | null;
  entityId: string | null;
  resolution: "resolved" | "ambiguous" | "not_found";
  evaluationValue: number | null;
  qlooRank: number | null;
  verdict: Verdict;
  evidence: string;
}

export interface TasteTestRun {
  state: import("./test-state").TestState;
  stateHistory: import("./test-state").TestState[];
  testId: string;
  createdAt: string;
  mode: "qloo-live";
  task: string;
  location: string;
  anchors: ResolvedAnchor[];
  candidates: CandidateResult[];
  rankedCandidateCount: number;
  baselineResultCount: number;
  evaluationRule: string;
  providerNote: string;
}
