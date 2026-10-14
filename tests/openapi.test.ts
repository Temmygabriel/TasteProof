import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { ANCHOR_TYPES } from "../src/lib/types";

it("keeps the public OpenAPI anchor categories aligned with runtime validation", () => {
  const schema = JSON.parse(readFileSync(join(process.cwd(), "public", "openapi.json"), "utf8")) as {
    paths: Record<string, {
      post?: {
        requestBody?: {
          content?: {
            "application/json"?: {
              schema?: {
                properties?: {
                  anchors?: {
                    items?: { properties?: { type?: { enum?: string[] } } };
                  };
                };
              };
            };
          };
        };
      };
    }>;
  };
  const documented = schema.paths["/api/test"]?.post?.requestBody?.content?.["application/json"]
    ?.schema?.properties?.anchors?.items?.properties?.type?.enum;
  expect(documented).toEqual([...ANCHOR_TYPES]);
});


it("documents explicit Qloo entity matching for custom test inputs", () => {
  const schema = JSON.parse(readFileSync(join(process.cwd(), "public", "openapi.json"), "utf8")) as {
    paths: Record<string, {
      post?: {
        requestBody?: {
          content?: {
            "application/json"?: {
              schema?: {
                properties?: {
                  anchors?: { items?: { properties?: { entityId?: { type?: string } } } };
                  candidateSelections?: { type?: string; items?: { required?: string[] } };
                };
              };
            };
          };
        };
      };
    }>;
  };
  for (const path of ["/api/test", "/api/evaluate"]) {
    const properties = schema.paths[path]?.post?.requestBody?.content?.["application/json"]?.schema?.properties;
    expect(properties?.anchors?.items?.properties?.entityId?.type).toBe("string");
    expect(properties?.candidateSelections?.type).toBe("array");
    expect(properties?.candidateSelections?.items?.required).toEqual(["name", "entityId"]);
  }
});
