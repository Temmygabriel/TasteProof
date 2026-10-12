import { describe, expect, it } from "vitest";
import { evaluateCandidates, verdictForRank } from "../src/lib/evaluate";
import { chooseEntity, parseQlooEntities } from "../src/lib/qloo";

describe("relative verdict rule", () => {
  it("splits three candidates into pass, review and fail", () => {
    expect(verdictForRank(1, 3)).toBe("PASS");
    expect(verdictForRank(2, 3)).toBe("REVIEW");
    expect(verdictForRank(3, 3)).toBe("FAIL");
  });
  it("withholds a verdict when ranking evidence is insufficient", () => {
    expect(verdictForRank(1, 1)).toBe("UNRESOLVED");
    expect(verdictForRank(0, 3)).toBe("UNRESOLVED");
  });
  it("keeps unresolved candidates unresolved", () => {
    const result = evaluateCandidates([
      { inputName: "Hotel Alpha", entity: null, resolution: "not_found" },
      { inputName: "Hotel Beta", entity: { entityId: "id-b", name: "Hotel Beta", subtype: "urn:entity:place" }, resolution: "resolved" },
      { inputName: "Hotel Gamma", entity: { entityId: "id-c", name: "Hotel Gamma", subtype: "urn:entity:place" }, resolution: "resolved" }
    ], [
      { entityId: "id-b", name: "Hotel Beta", subtype: "urn:entity:place" },
      { entityId: "id-c", name: "Hotel Gamma", subtype: "urn:entity:place" }
    ]);
    expect(result.candidates[0].verdict).toBe("UNRESOLVED");
    expect(result.candidates[1].verdict).toBe("PASS");
    expect(result.candidates[2].verdict).toBe("REVIEW");
    expect(result.rankedCandidateCount).toBe(2);
  });
});

describe("Qloo response parsing", () => {
  it("reads entity data from a results envelope", () => {
    expect(parseQlooEntities({ success: true, results: { entities: [
      { entity_id: "abc-123", name: "Hotel Alpha", subtype: "urn:entity:place" }
    ] } })).toEqual([{ entityId: "abc-123", name: "Hotel Alpha", subtype: "urn:entity:place" }]);
  });
  it("prefers exact names and avoids ambiguous fuzzy matches", () => {
    const entities = [
      { entityId: "1", name: "Dune", subtype: "urn:entity:movie" },
      { entityId: "2", name: "Dune: Part Two", subtype: "urn:entity:movie" }
    ];
    expect(chooseEntity("Dune", entities)?.entityId).toBe("1");
    expect(chooseEntity("Unknown title", entities)).toBeNull();
    expect(chooseEntity("Dune", [entities[0]])?.entityId).toBe("1");
    expect(chooseEntity("Only one", [entities[0]])).toBeNull();
  });
});


import { InputValidationError, parseTasteTestInput } from "../src/lib/validation";

describe("request validation", () => {
  it("accepts a valid taste test request", () => {
    expect(parseTasteTestInput({
      anchors: [
        { name: "Tyler, the Creator", type: "artist" },
        { name: "Aesop", type: "brand" }
      ],
      candidates: ["Candidate A", "Candidate B"],
      task: "Recommend a hotel",
      location: "Copenhagen"
    }).candidates).toEqual(["Candidate A", "Candidate B"]);
  });

  it("rejects non-text candidate entries", () => {
    expect(() => parseTasteTestInput({ ...valid, candidates: ["Candidate A", 123] }))
      .toThrow(InputValidationError);
  });

  it("rejects duplicate anchors and too few candidates", () => {
    expect(() => parseTasteTestInput({
      anchors: [
        { name: "Aesop", type: "brand" },
        { name: "Aesop", type: "brand" }
      ],
      candidates: ["Candidate A", "Candidate B"],
      task: "Recommend a hotel",
      location: "Copenhagen"
    })).toThrow(InputValidationError);

    expect(() => parseTasteTestInput({
      anchors: [
        { name: "Tyler, the Creator", type: "artist" },
        { name: "Aesop", type: "brand" }
      ],
      candidates: ["Only one"],
      task: "Recommend a hotel",
      location: "Copenhagen"
    })).toThrow(InputValidationError);
  });
});
