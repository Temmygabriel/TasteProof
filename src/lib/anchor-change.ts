import type { ResolvedAnchor } from "./types";

export interface AnchorChange {
  index: number;
  previous: ResolvedAnchor | null;
  current: ResolvedAnchor | null;
}

/**
 * Reports changes to the actual Qloo entity inputs, not merely spelling changes.
 * A name alias that resolves to the same Qloo entity does not count as a signal change.
 */
export function compareAnchorChanges(
  previous: ResolvedAnchor[],
  current: ResolvedAnchor[]
): AnchorChange[] {
  const length = Math.max(previous.length, current.length);
  const changes: AnchorChange[] = [];

  for (let index = 0; index < length; index += 1) {
    const before = previous[index] ?? null;
    const after = current[index] ?? null;
    const sameSignal = Boolean(
      before && after &&
      before.entityId.toUpperCase() === after.entityId.toUpperCase() &&
      before.type === after.type
    );

    if (!sameSignal) changes.push({ index, previous: before, current: after });
  }

  return changes;
}
