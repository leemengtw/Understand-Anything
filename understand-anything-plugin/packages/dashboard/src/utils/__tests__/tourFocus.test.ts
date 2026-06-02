import { describe, expect, it } from "vitest";
import { filterToTourStepEvidence } from "../tourFocus";

const nodes = [
  { id: "concept:workflow" },
  { id: "file:agent.py" },
  { id: "file:prompt.j2" },
  { id: "file:unrelated.py" },
];

const edges = [
  { source: "concept:workflow", target: "file:agent.py", type: "documents" },
  { source: "file:agent.py", target: "file:prompt.j2", type: "calls" },
  { source: "file:agent.py", target: "file:unrelated.py", type: "imports" },
];

describe("filterToTourStepEvidence", () => {
  it("keeps only current tour-step nodes and edges between them", () => {
    const out = filterToTourStepEvidence(
      nodes,
      edges,
      ["concept:workflow", "file:agent.py", "file:prompt.j2"],
    );

    expect(out.active).toBe(true);
    expect(out.nodes.map((node) => node.id)).toEqual([
      "concept:workflow",
      "file:agent.py",
      "file:prompt.j2",
    ]);
    expect(out.edges).toEqual([
      { source: "concept:workflow", target: "file:agent.py", type: "documents" },
      { source: "file:agent.py", target: "file:prompt.j2", type: "calls" },
    ]);
  });

  it("stays inactive when there is no active tour step", () => {
    const out = filterToTourStepEvidence(nodes, edges, []);

    expect(out.active).toBe(false);
    expect(out.nodes).toBe(nodes);
    expect(out.edges).toBe(edges);
  });

  it("falls back to the full layer when tour nodes are not visible there", () => {
    const out = filterToTourStepEvidence(nodes, edges, ["file:outside-layer.py"]);

    expect(out.active).toBe(false);
    expect(out.nodes).toBe(nodes);
    expect(out.edges).toBe(edges);
  });
});
