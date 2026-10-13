import { describe, expect, it } from "vitest";
import { compareAnchorChanges } from "../src/lib/anchor-change";
import type { ResolvedAnchor } from "../src/lib/types";

function anchor(inputName: string, entityId: string, type: ResolvedAnchor["type"] = "artist"): ResolvedAnchor {
  return { inputName, resolvedName: inputName, entityId, type };
}

describe("controlled anchor-change detection", () => {
  it("recognizes exactly one changed Qloo entity", () => {
    const before = [anchor("Artist A", "id-a"), anchor("Brand B", "id-b", "brand"), anchor("Movie C", "id-c", "movie")];
    const after = [before[0], before[1], anchor("Movie D", "id-d", "movie")];
    const changes = compareAnchorChanges(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ index: 2, previous: before[2], current: after[2] });
  });

  it("does not treat a spelling alias for the same entity as a signal change", () => {
    const changes = compareAnchorChanges(
      [anchor("Aesop", "ID-42", "brand")],
      [anchor("AESOP", "id-42", "brand")]
    );
    expect(changes).toEqual([]);
  });

  it("marks multiple replacements and a changed anchor count as separate changes", () => {
    const before = [anchor("Artist A", "id-a"), anchor("Brand B", "id-b", "brand")];
    const after = [anchor("Artist C", "id-c"), anchor("Brand D", "id-d", "brand"), anchor("Movie E", "id-e", "movie")];
    expect(compareAnchorChanges(before, after).map((change) => change.index)).toEqual([0, 1, 2]);
  });
});
