import { describe, expect, it, vi } from "vitest";
import { evaluateCandidates, verdictForRank } from "../src/lib/evaluate";
import { chooseEntity, getCandidateRanking, parseQlooEntities } from "../src/lib/qloo";
import { InputValidationError, parseTasteTestInput } from "../src/lib/validation";
import { TestStateMachine } from "../src/lib/test-state";

describe("verdicts based on Qloo's broader affinity baseline", () => {
  it("applies documented top/middle/bottom-third rules to actual provider rank", () => {
    expect(verdictForRank(1, 20)).toBe("PASS");
    expect(verdictForRank(7, 20)).toBe("PASS");
    expect(verdictForRank(8, 20)).toBe("REVIEW");
    expect(verdictForRank(14, 20)).toBe("REVIEW");
    expect(verdictForRank(15, 20)).toBe("FAIL");
    expect(verdictForRank(20, 20)).toBe("FAIL");
  });

  it("withholds a verdict when the baseline is too small or rank invalid", () => {
    expect(verdictForRank(1, 2)).toBe("UNRESOLVED");
    expect(verdictForRank(0, 20)).toBe("UNRESOLVED");
    expect(verdictForRank(21, 20)).toBe("UNRESOLVED");
  });

  it("supports one submitted candidate when it appears in the real baseline", () => {
    const candidate = { entityId: "id-b", name: "Place B", subtype: "urn:entity:place", rank: 3 };
    const result = evaluateCandidates([
      { inputName: "Place B", entity: candidate, resolution: "resolved" }
    ], [
      { entityId: "id-a", name: "Place A", subtype: "urn:entity:place", rank: 1 },
      { entityId: "id-c", name: "Place C", subtype: "urn:entity:place", rank: 2 },
      candidate
    ]);
    expect(result.rankedCandidateCount).toBe(1);
    expect(result.baselineResultCount).toBe(3);
    expect(result.candidates[0].qlooRank).toBe(3);
    expect(result.candidates[0].evaluationValue).toBe(3);
    expect(result.candidates[0].verdict).toBe("FAIL");
  });

  it("keeps a resolved candidate unresolved when Qloo did not return it", () => {
    const result = evaluateCandidates([
      { inputName: "Hotel Alpha", entity: { entityId: "id-a", name: "Hotel Alpha", subtype: "urn:entity:place" }, resolution: "resolved" }
    ], [
      { entityId: "id-b", name: "Place B", subtype: null, rank: 1 },
      { entityId: "id-c", name: "Place C", subtype: null, rank: 2 },
      { entityId: "id-d", name: "Place D", subtype: null, rank: 3 }
    ]);
    expect(result.candidates[0].verdict).toBe("UNRESOLVED");
    expect(result.candidates[0].evaluationValue).toBeNull();
    expect(result.rankedCandidateCount).toBe(0);
  });

  it("uses a unique exact-name entity in the location-filtered baseline to disambiguate search duplicates", () => {
    const baseline = [
      { entityId: "place-a", name: "Brooklyn Bridge", subtype: "urn:entity:place", rank: 2 },
      { entityId: "place-b", name: "One Times Square", subtype: "urn:entity:place", rank: 1 },
      { entityId: "place-c", name: "Mood Fabrics", subtype: "urn:entity:place", rank: 3 }
    ];
    const result = evaluateCandidates([
      { inputName: "Brooklyn Bridge", entity: null, resolution: "ambiguous" }
    ], baseline);
    expect(result.candidates[0].resolution).toBe("resolved");
    expect(result.candidates[0].entityId).toBe("place-a");
    expect(result.candidates[0].qlooRank).toBe(2);
    expect(result.candidates[0].verdict).toBe("REVIEW");
    expect(result.candidates[0].evidence).toContain("location-filtered baseline contained one exact-name entity");
  });

  it("keeps a duplicate name unresolved when the baseline itself has multiple exact-name entities", () => {
    const result = evaluateCandidates([
      { inputName: "Central Park", entity: null, resolution: "ambiguous" }
    ], [
      { entityId: "park-a", name: "Central Park", subtype: "urn:entity:place", rank: 1 },
      { entityId: "park-b", name: "Central Park", subtype: "urn:entity:place", rank: 2 },
      { entityId: "place-c", name: "Mood Fabrics", subtype: "urn:entity:place", rank: 3 }
    ]);
    expect(result.candidates[0].resolution).toBe("ambiguous");
    expect(result.candidates[0].verdict).toBe("UNRESOLVED");
    expect(result.candidates[0].entityId).toBeNull();
  });

  it("does not count one resolved entity twice", () => {
    const shared = { entityId: "same", name: "Hotel Alpha", subtype: "urn:entity:place", rank: 1 };
    const result = evaluateCandidates([
      { inputName: "Hotel Alpha", entity: shared, resolution: "resolved" },
      { inputName: "Alias", entity: { ...shared, name: "Alias" }, resolution: "resolved" }
    ], [
      shared,
      { entityId: "other", name: "Place B", subtype: null, rank: 2 },
      { entityId: "another", name: "Place C", subtype: null, rank: 3 }
    ]);
    expect(result.rankedCandidateCount).toBe(1);
  });
});

describe("candidate-specific Qloo affinity ranking", () => {
  it("asks Insights to rank submitted entity IDs directly instead of intersecting a top-20 discovery list", async () => {
    vi.stubEnv("QLOO_API_KEY", "unit-test-key");
    vi.stubEnv("QLOO_BASE_URL", "https://hackathon.api.qloo.com");

    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      expect(init?.headers).toMatchObject({
        accept: "application/json",
        "X-Api-Key": "unit-test-key"
      });
      expect(url.searchParams.get("filter.type")).toBe("urn:entity:place");
      expect(url.searchParams.get("signal.interests.entities")).toBe("anchor-artist,anchor-brand");
      expect(url.searchParams.get("filter.location.query")).toBe("Houston, Texas");
      expect(url.searchParams.get("filter.results.entities")).toBe("candidate-one,candidate-two,candidate-three");
      expect(url.searchParams.get("sort_by")).toBe("affinity");
      expect(url.searchParams.get("take")).toBe("3");

      return new Response(JSON.stringify({
        success: true,
        results: { entities: [
          { entity_id: "candidate-three", name: "Place Three", subtype: "urn:entity:place" },
          { entity_id: "candidate-one", name: "Place One", subtype: "urn:entity:place" },
          { entity_id: "candidate-two", name: "Place Two", subtype: "urn:entity:place" }
        ] }
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const ranked = await getCandidateRanking(
        ["anchor-artist", "anchor-brand"],
        ["candidate-one", "candidate-two", "candidate-three"],
        "Houston, Texas"
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(ranked.map((entity) => [entity.entityId, entity.rank])).toEqual([
        ["candidate-three", 1],
        ["candidate-one", 2],
        ["candidate-two", 3]
      ]);
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });
});

describe("Qloo entity response parsing", () => {
  it("reads entities from a standard results envelope", () => {
    expect(parseQlooEntities({ success: true, results: { entities: [
      { entity_id: "abc-123", name: "Hotel Alpha", subtype: "urn:entity:place" }
    ] } })).toEqual([{ entityId: "abc-123", name: "Hotel Alpha", subtype: "urn:entity:place" }]);
  });

  it("requires exact normalized names rather than guessing", () => {
    const entities = [
      { entityId: "1", name: "Dune", subtype: "urn:entity:movie" },
      { entityId: "2", name: "Dune: Part Two", subtype: "urn:entity:movie" }
    ];
    expect(chooseEntity("Dune", entities)?.entityId).toBe("1");
    expect(chooseEntity("Unknown title", entities)).toBeNull();
    expect(chooseEntity("Only one", [entities[0]])).toBeNull();
  });
});

describe("request validation", () => {
  const valid = {
    anchors: [{ name: "Aesop", type: "brand" }],
    candidates: ["Candidate A"],
    task: "Recommend a hotel",
    location: "Copenhagen"
  };

  it("accepts one taste anchor and one candidate", () => {
    expect(parseTasteTestInput(valid).candidates).toEqual(["Candidate A"]);
  });

  it("accepts an explicit Qloo entity selection for an ambiguous anchor and candidate", () => {
    const parsed = parseTasteTestInput({
      ...valid,
      anchors: [{ name: "Houston, Texas", type: "place", entityId: "urn:entity:place:houston" }],
      candidateSelections: [{ name: "Candidate A", entityId: "urn:entity:place:candidate-a" }]
    });
    expect(parsed.anchors[0].entityId).toBe("urn:entity:place:houston");
    expect(parsed.candidateSelections).toEqual([
      { name: "Candidate A", entityId: "urn:entity:place:candidate-a" }
    ]);
  });

  it("rejects a selected entity that is not one of the submitted candidate names", () => {
    expect(() => parseTasteTestInput({
      ...valid,
      candidateSelections: [{ name: "Another Place", entityId: "urn:entity:place:other" }]
    })).toThrow(/must correspond to a submitted candidate/);
  });

  it("rejects duplicate selected Qloo entity IDs across candidate rows", () => {
    expect(() => parseTasteTestInput({
      ...valid,
      candidates: ["Candidate A", "Candidate B"],
      candidateSelections: [
        { name: "Candidate A", entityId: "urn:entity:place:shared" },
        { name: "Candidate B", entityId: "urn:entity:place:shared" }
      ]
    })).toThrow(/cannot select the same Qloo entity/);
  });

  it("allows blank UI rows but needs at least one candidate", () => {
    expect(parseTasteTestInput({ ...valid, candidates: ["Candidate A", "", "Candidate B"] }).candidates)
      .toEqual(["Candidate A", "Candidate B"]);
    expect(() => parseTasteTestInput({ ...valid, candidates: ["", " "] })).toThrow(InputValidationError);
  });

  it("rejects non-text candidates and duplicate inputs", () => {
    expect(() => parseTasteTestInput({ ...valid, candidates: ["Candidate A", 123] })).toThrow(InputValidationError);
    expect(() => parseTasteTestInput({ ...valid, anchors: [
      { name: "Aesop", type: "brand" }, { name: "Aesop", type: "brand" }
    ] })).toThrow(InputValidationError);
    expect(() => parseTasteTestInput({ ...valid, candidates: ["Same", "same"] })).toThrow(InputValidationError);
  });
});

describe("TasteProof execution state machine", () => {
  it("records only actual, legal stages through a partial result", () => {
    const machine = new TestStateMachine();
    machine.transition("CONFIGURED");
    machine.transition("RESOLVING_TASTE");
    machine.transition("TASTE_READY");
    machine.transition("RESOLVING_CANDIDATES");
    machine.transition("EVALUATING");
    const trace = machine.transition("PARTIAL_RESULT");
    expect(trace.stateHistory).toEqual([
      "IDLE", "CONFIGURED", "RESOLVING_TASTE", "TASTE_READY",
      "RESOLVING_CANDIDATES", "EVALUATING", "PARTIAL_RESULT"
    ]);
    expect(trace.state).toBe("PARTIAL_RESULT");
  });

  it("rejects an impossible transition instead of faking progress", () => {
    const machine = new TestStateMachine();
    expect(() => machine.transition("EVALUATED")).toThrow(/Invalid TasteProof state transition/);
  });
});
