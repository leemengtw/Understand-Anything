import { describe, expect, it } from "vitest";
import type { KnowledgeGraph } from "@understand-anything/core/types";
import { buildDomainHandoffs, getDomainHandoffBadge } from "../domainHandoffs";

const graph: KnowledgeGraph = {
  version: "1.0.0",
  project: {
    name: "test",
    languages: [],
    frameworks: [],
    description: "test graph",
    analyzedAt: "2026-06-04T00:00:00.000Z",
    gitCommitHash: "test",
  },
  nodes: [
    {
      id: "domain:a",
      type: "domain",
      name: "Business authority",
      summary: "Authority summary",
      tags: [],
      complexity: "moderate",
    },
    {
      id: "domain:b",
      type: "domain",
      name: "BVI source intelligence",
      summary: "BVI summary",
      tags: [],
      complexity: "complex",
    },
  ],
  edges: [
    {
      source: "domain:a",
      target: "domain:b",
      type: "cross_domain",
      direction: "forward",
      description: "Business authority chooses scopes and source families.",
      weight: 0.9,
    },
  ],
  layers: [],
  tour: [],
};

describe("domain handoffs", () => {
  it("uses compact badges for canvas edge labels", () => {
    expect(getDomainHandoffBadge(0)).toBe("1");
    expect(getDomainHandoffBadge(11)).toBe("12");
  });

  it("preserves full transition text outside the canvas edge label", () => {
    const handoffs = buildDomainHandoffs(graph);

    expect(handoffs).toEqual([
      expect.objectContaining({
        badge: "1",
        sourceName: "Business authority",
        targetName: "BVI source intelligence",
        description: "Business authority chooses scopes and source families.",
      }),
    ]);
  });
});
