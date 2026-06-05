import { describe, expect, it } from "vitest";
import type { KnowledgeGraph } from "@understand-anything/core/types";
import { buildDomainDetail, layoutDomainDetailInFlowOrder } from "../DomainGraphView";

function graphWithScrambledFlowSteps(): KnowledgeGraph {
  return {
    version: "1.0.0",
    project: {
      name: "test",
      languages: [],
      frameworks: [],
      description: "test graph",
      analyzedAt: "2026-06-05T00:00:00.000Z",
      gitCommitHash: "test",
    },
    nodes: [
      {
        id: "domain:generation",
        type: "domain",
        name: "Signature-guided generation",
        summary: "Domain summary",
        tags: [],
        complexity: "complex",
      },
      {
        id: "flow:guided-generation",
        type: "flow",
        name: "Run guided generation",
        summary: "Flow summary",
        tags: [],
        complexity: "complex",
      },
      {
        id: "step:scene",
        type: "step",
        name: "選擇 scene mechanism",
        summary: "Third real step",
        tags: [],
        complexity: "moderate",
      },
      {
        id: "step:brief",
        type: "step",
        name: "規劃 creative brief",
        summary: "Second real step",
        tags: [],
        complexity: "moderate",
      },
      {
        id: "step:intent",
        type: "step",
        name: "正規化 user intent",
        summary: "First real step",
        tags: [],
        complexity: "moderate",
      },
    ],
    edges: [
      {
        source: "domain:generation",
        target: "flow:guided-generation",
        type: "contains_flow",
        direction: "forward",
        weight: 1,
      },
      {
        source: "flow:guided-generation",
        target: "step:scene",
        type: "flow_step",
        direction: "forward",
        weight: 0.7,
      },
      {
        source: "flow:guided-generation",
        target: "step:intent",
        type: "flow_step",
        direction: "forward",
        weight: 0.1,
      },
      {
        source: "flow:guided-generation",
        target: "step:brief",
        type: "flow_step",
        direction: "forward",
        weight: 0.3,
      },
    ],
    layers: [],
    tour: [],
  };
}

describe("DomainGraphView flow ordering", () => {
  it("positions step nodes by flow_step order instead of graph node order", () => {
    const built = buildDomainDetail(graphWithScrambledFlowSteps(), "domain:generation");
    const layout = layoutDomainDetailInFlowOrder(built);

    const visualSteps = layout.nodes
      .filter((node) => node.type === "step-node")
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
      .map((node) => ({
        label: String(node.data?.label ?? ""),
        order: node.data?.order,
        y: node.position.y,
      }));

    expect(visualSteps).toEqual([
      { label: "正規化 user intent", order: 1, y: 24 },
      { label: "規劃 creative brief", order: 2, y: 144 },
      { label: "選擇 scene mechanism", order: 3, y: 264 },
    ]);
  });
});
