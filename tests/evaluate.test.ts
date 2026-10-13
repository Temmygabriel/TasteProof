import { describe, expect, it } from "vitest";
import { evaluateCandidates, verdictForRank } from "../src/lib/evaluate";
import { chooseEntity, parseQlooEntities } from "../src/lib/qloo";
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
