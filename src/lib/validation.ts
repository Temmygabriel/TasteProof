import { ANCHOR_TYPES, type AnchorType, type TasteTestInput } from "./types";

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

export function parseTasteTestInput(value: unknown): TasteTestInput {
  if (!plainObject(value)) throw new InputValidationError("The request body must be a JSON object.");

  if (!Array.isArray(value.anchors) || value.anchors.length < 2 || value.anchors.length > 5) {
    throw new InputValidationError("Provide between 2 and 5 taste anchors.");
  }
  const anchors = value.anchors.map((item, index) => {
    if (!plainObject(item)) throw new InputValidationError("Taste anchor " + (index + 1) + " is invalid.");
    const name = cleanText(item.name, "Taste anchor " + (index + 1), 120);
    if (typeof item.type !== "string" || !ANCHOR_TYPES.includes(item.type as AnchorType)) {
      throw new InputValidationError("Choose a supported Qloo category for taste anchor " + (index + 1) + ".");
    }
    return { name, type: item.type as AnchorType };
  });

  const seenAnchors = new Set<string>();
  for (const anchor of anchors) {
    const key = anchor.name.toLocaleLowerCase();
    if (seenAnchors.has(key)) throw new InputValidationError("Taste anchors must be distinct.");
    seenAnchors.add(key);
  }

  if (!Array.isArray(value.candidates)) {
    throw new InputValidationError("Provide recommendations from the agent you want to test.");
  }
  const candidates = value.candidates
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  if (candidates.length < 2 || candidates.length > 10) {
    throw new InputValidationError("Provide between 2 and 10 non-empty recommendation candidates.");
  }
  if (candidates.some((item) => item.length > 160)) {
    throw new InputValidationError("Each recommendation candidate must be 160 characters or fewer.");
  }

  const seenCandidates = new Set<string>();
  for (const candidate of candidates) {
    const key = candidate.toLocaleLowerCase();
    if (seenCandidates.has(key)) throw new InputValidationError("Recommendation candidates must be distinct.");
    seenCandidates.add(key);
  }

  return {
    anchors,
    candidates,
    task: cleanText(value.task, "Task description", 180),
    location: cleanText(value.location, "Location", 100)
  };
}
