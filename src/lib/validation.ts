import { ANCHOR_TYPES, type AnchorType, type TasteEntitySelection, type TasteTestInput } from "./types";

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

function plainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") throw new InputValidationError(label + " must be text.");
  const cleaned = value.trim();
  if (!cleaned) throw new InputValidationError(label + " cannot be empty.");
  if (cleaned.length > maxLength) throw new InputValidationError(label + " is too long.");
  return cleaned;
}

function normalized(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function cleanEntityId(value: unknown, label: string): string {
  return cleanText(value, label + " Qloo entity ID", 300);
}

export function parseTasteTestInput(value: unknown): TasteTestInput {
  if (!plainObject(value)) throw new InputValidationError("The request body must be a JSON object.");

  if (!Array.isArray(value.anchors) || value.anchors.length < 1 || value.anchors.length > 5) {
    throw new InputValidationError("Provide between 1 and 5 taste anchors.");
  }
  const anchors = value.anchors.map((item, index) => {
    if (!plainObject(item)) throw new InputValidationError("Taste anchor " + (index + 1) + " is invalid.");
    const name = cleanText(item.name, "Taste anchor " + (index + 1), 120);
    if (typeof item.type !== "string" || !ANCHOR_TYPES.includes(item.type as AnchorType)) {
      throw new InputValidationError("Choose a supported Qloo category for taste anchor " + (index + 1) + ".");
    }
    const entityId = item.entityId === undefined || item.entityId === null || item.entityId === ""
      ? undefined
      : cleanEntityId(item.entityId, "Taste anchor " + (index + 1));
    return { name, type: item.type as AnchorType, ...(entityId ? { entityId } : {}) };
  });

  const seenAnchors = new Set<string>();
  const seenAnchorIds = new Set<string>();
  for (const anchor of anchors) {
    const key = normalized(anchor.name);
    if (seenAnchors.has(key)) throw new InputValidationError("Taste anchors must be distinct.");
    seenAnchors.add(key);
    if (anchor.entityId) {
      const id = anchor.entityId.toLocaleUpperCase();
      if (seenAnchorIds.has(id)) throw new InputValidationError("Taste anchors must resolve to distinct Qloo entities.");
      seenAnchorIds.add(id);
    }
  }

  if (!Array.isArray(value.candidates)) {
    throw new InputValidationError("Provide recommendations from the agent you want to test.");
  }
  if (!value.candidates.every((item) => typeof item === "string")) {
    throw new InputValidationError("Every recommendation candidate must be text.");
  }
  const candidates = value.candidates
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  if (candidates.length < 1 || candidates.length > 10) {
    throw new InputValidationError("Provide between 1 and 10 non-empty recommendation candidates.");
  }
  if (candidates.some((item) => item.length > 160)) {
    throw new InputValidationError("Each recommendation candidate must be 160 characters or fewer.");
  }

  const seenCandidates = new Set<string>();
  for (const candidate of candidates) {
    const key = normalized(candidate);
    if (seenCandidates.has(key)) throw new InputValidationError("Recommendation candidates must be distinct.");
    seenCandidates.add(key);
  }

  let candidateSelections: TasteEntitySelection[] | undefined;
  if (value.candidateSelections !== undefined) {
    if (!Array.isArray(value.candidateSelections)) {
      throw new InputValidationError("Selected Qloo candidate matches must be a list.");
    }
    const candidateKeys = new Set(candidates.map(normalized));
    const seenSelectionNames = new Set<string>();
    const seenSelectionIds = new Set<string>();
    candidateSelections = value.candidateSelections.map((item, index) => {
      if (!plainObject(item)) {
        throw new InputValidationError("Selected Qloo candidate match " + (index + 1) + " is invalid.");
      }
      const name = cleanText(item.name, "Selected candidate name", 160);
      const entityId = cleanEntityId(item.entityId, "Selected candidate");
      const nameKey = normalized(name);
      if (!candidateKeys.has(nameKey)) {
        throw new InputValidationError("A selected Qloo match must correspond to a submitted candidate name.");
      }
      if (seenSelectionNames.has(nameKey)) {
        throw new InputValidationError("Each candidate can have only one selected Qloo match.");
      }
      const idKey = entityId.toLocaleUpperCase();
      if (seenSelectionIds.has(idKey)) {
        throw new InputValidationError("Two candidate rows cannot select the same Qloo entity.");
      }
      seenSelectionNames.add(nameKey);
      seenSelectionIds.add(idKey);
      return { name, entityId };
    });
  }

  return {
    anchors,
    candidates,
    ...(candidateSelections?.length ? { candidateSelections } : {}),
    task: cleanText(value.task, "Task description", 180),
    location: cleanText(value.location, "Location", 100)
  };
}
