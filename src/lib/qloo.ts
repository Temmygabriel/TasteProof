import type { AnchorType } from "./types";

export interface QlooEntity {
  entityId: string;
  name: string;
  subtype: string | null;
}

export interface RankedQlooEntity extends QlooEntity {
  rank: number;
}

export class QlooConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QlooConfigurationError";
  }
}

export class QlooApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "QlooApiError";
    this.status = status;
  }
}

function qlooConfig(): { baseUrl: string; apiKey: string } {
  const apiKey = process.env.QLOO_API_KEY?.trim();
  if (!apiKey) throw new QlooConfigurationError("Qloo is not configured. Add QLOO_API_KEY to the server environment.");

  const rawBase = (process.env.QLOO_BASE_URL || "https://hackathon.api.qloo.com").trim();
  let parsed: URL;
  try {
    parsed = new URL(rawBase);
  } catch {
    throw new QlooConfigurationError("QLOO_BASE_URL must be a valid HTTPS Qloo host.");
  }

  const allowedHosts = new Set(["hackathon.api.qloo.com", "api.qloo.com", "staging.api.qloo.com"]);
  if (parsed.protocol !== "https:" || !allowedHosts.has(parsed.hostname) || (parsed.pathname !== "/" && parsed.pathname !== "")) {
    throw new QlooConfigurationError("QLOO_BASE_URL must be an approved Qloo origin without a path.");
  }
  return { baseUrl: parsed.origin, apiKey };
}

async function getJson(url: URL, allowNotFound = false): Promise<unknown | null> {
  const config = qlooConfig();
  let response: Response;
  try {
    // Qloo may apply short burst limits to parallel entity lookups. Retry 429s
    // twice with bounded backoff; never retry authentication or validation errors.
    for (let attempt = 0; ; attempt += 1) {
      response = await fetch(url, {
        method: "GET",
        headers: { accept: "application/json", "X-Api-Key": config.apiKey },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(12000)
      });
      if (response.status !== 429 || attempt >= 2) break;
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1200));
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new QlooApiError(504, "Qloo did not respond within 12 seconds. Try the test again.");
    }
    throw new QlooApiError(502, "Could not reach the configured Qloo API host.");
  }

  if (allowNotFound && response.status === 404) return null;
  if (!response.ok) {
    if (response.status === 401) throw new QlooApiError(401, "Qloo rejected the API key. Check that it was copied correctly.");
    if (response.status === 403) throw new QlooApiError(403, "Qloo denied this request. The key may not have hackathon access.");
    if (response.status === 429) throw new QlooApiError(429, "Qloo rate-limited the request. Wait briefly before trying again.");
    throw new QlooApiError(502, "Qloo returned an upstream error (HTTP " + response.status + "). No verdict was produced.");
  }

  try {
    return await response.json();
  } catch {
    throw new QlooApiError(502, "Qloo returned a response that was not valid JSON.");
  }
}

function objectValue(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseQlooEntities(payload: unknown): QlooEntity[] {
  const root = objectValue(payload);
  if (!root) return [];
  const resultsObject = objectValue(root.results);
  const rawList = Array.isArray(root.results)
    ? root.results
    : resultsObject && Array.isArray(resultsObject.entities)
      ? resultsObject.entities
      : Array.isArray(root.entities)
        ? root.entities
        : [];

  return rawList.flatMap((raw): QlooEntity[] => {
    const row = objectValue(raw);
    if (!row) return [];
    const id = row.entity_id ?? row.entityId ?? row.id;
    const name = row.name ?? row.label;
    if (typeof id !== "string" || !id.trim() || typeof name !== "string" || !name.trim()) return [];
    const subtype = row.subtype ?? row.type;
    return [{ entityId: id.trim(), name: name.trim(), subtype: typeof subtype === "string" ? subtype : null }];
  });
}

function normalizeEntityName(name: string): string {
  return name.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function chooseEntity(query: string, entities: QlooEntity[]): QlooEntity | null {
  const normalized = normalizeEntityName(query);
  const exact = entities.filter((entity) => normalizeEntityName(entity.name) === normalized);
  // Some provider responses can repeat the same entity ID. Repeated rows are not
  // genuine ambiguity; only distinct matching IDs should block exact resolution.
  const unique = Array.from(new Map(exact.map((entity) => [entity.entityId.toUpperCase(), entity])).values());
  return unique.length === 1 ? unique[0] : null;
}

export async function searchEntities(query: string, type: AnchorType): Promise<QlooEntity[]> {
  const config = qlooConfig();
  const url = new URL("/search", config.baseUrl);
  url.searchParams.set("query", query);
  url.searchParams.set("types", "urn:entity:" + type);
  url.searchParams.set("take", "8");
  const payload = await getJson(url, true);
  return payload === null ? [] : parseQlooEntities(payload);
}

/**
 * Pull a broader baseline from Qloo and preserve the provider's affinity order.
 * TasteProof uses ordinal position only; it does not invent an affinity score.
 */
export async function getAffinityBaseline(
  anchorEntityIds: string[],
  location: string,
  requestedTake = 20
): Promise<RankedQlooEntity[]> {
  const config = qlooConfig();
  const url = new URL("/v2/insights", config.baseUrl);
  url.searchParams.set("filter.type", "urn:entity:place");
  url.searchParams.set("signal.interests.entities", anchorEntityIds.join(","));
  url.searchParams.set("filter.location.query", location);
  url.searchParams.set("sort_by", "affinity");
  url.searchParams.set("take", String(Math.max(3, Math.min(20, Math.trunc(requestedTake)))));

  const parsed = parseQlooEntities(await getJson(url));
  const unique = Array.from(new Map(parsed.map((entity) => [entity.entityId.toUpperCase(), entity])).values());
  return unique.map((entity, index) => ({ ...entity, rank: index + 1 }));
}

export async function getCandidateRanking(
  anchorEntityIds: string[],
  candidateEntityIds: string[],
  location: string
): Promise<RankedQlooEntity[]> {
  const uniqueCandidateIds = Array.from(new Set(
    candidateEntityIds.map((id) => id.trim()).filter(Boolean)
  ));
  if (!uniqueCandidateIds.length) return [];

  const config = qlooConfig();
  const url = new URL("/v2/insights", config.baseUrl);
  url.searchParams.set("filter.type", "urn:entity:place");
  url.searchParams.set("signal.interests.entities", anchorEntityIds.join(","));
  url.searchParams.set("filter.location.query", location);
  // Ask Qloo to score the submitted entities themselves. Filtering a separate
  // top-20 discovery list client-side can make every valid submission appear
  // unresolved simply because none happens to be in that unrelated result window.
  url.searchParams.set("filter.results.entities", uniqueCandidateIds.join(","));
  url.searchParams.set("sort_by", "affinity");
  url.searchParams.set("take", String(Math.min(50, uniqueCandidateIds.length)));

  const parsed = parseQlooEntities(await getJson(url));
  const unique = Array.from(new Map(parsed.map((entity) => [entity.entityId.toUpperCase(), entity])).values());
  return unique.map((entity, index) => ({ ...entity, rank: index + 1 }));
}
