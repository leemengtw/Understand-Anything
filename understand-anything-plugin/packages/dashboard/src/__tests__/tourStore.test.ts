import { beforeEach, describe, expect, it } from "vitest";
import type { KnowledgeGraph } from "@understand-anything/core/types";
import { useDashboardStore } from "../store";

const graph: KnowledgeGraph = {
  version: "1.0.0",
  project: {
    name: "Tour Test",
    description: "Minimal graph for tour navigation state.",
    languages: ["TypeScript"],
    frameworks: ["React"],
    analyzedAt: "2026-06-03T00:00:00.000Z",
    gitCommitHash: "abc1234",
  },
  nodes: [
    {
      id: "concept:one",
      type: "concept",
      name: "One",
      summary: "First concept.",
      tags: [],
      complexity: "simple",
    },
    {
      id: "concept:two",
      type: "concept",
      name: "Two",
      summary: "Second concept.",
      tags: [],
      complexity: "simple",
    },
  ],
  edges: [],
  layers: [
    {
      id: "layer:one",
      name: "Layer One",
      description: "First layer.",
      nodeIds: ["concept:one"],
    },
    {
      id: "layer:two",
      name: "Layer Two",
      description: "Second layer.",
      nodeIds: ["concept:two"],
    },
  ],
  tour: [
    {
      order: 1,
      title: "Step One",
      description: "Start here.",
      nodeIds: ["concept:one"],
    },
    {
      order: 2,
      title: "Step Two",
      description: "Move there.",
      nodeIds: ["concept:two"],
    },
  ],
};

describe("tour navigation state", () => {
  beforeEach(() => {
    useDashboardStore.setState(useDashboardStore.getInitialState(), true);
    useDashboardStore.getState().setGraph(graph);
    useDashboardStore.getState().startTour();
  });

  it("clears selected component details when advancing the guided tour", () => {
    useDashboardStore.getState().selectNode("concept:one");

    useDashboardStore.getState().nextTourStep();

    expect(useDashboardStore.getState().selectedNodeId).toBeNull();
    expect(useDashboardStore.getState().currentTourStep).toBe(1);
    expect(useDashboardStore.getState().tourHighlightedNodeIds).toEqual(["concept:two"]);
  });

  it("clears selected component details when jumping between tour steps", () => {
    useDashboardStore.getState().selectNode("concept:two");

    useDashboardStore.getState().setTourStep(0);

    expect(useDashboardStore.getState().selectedNodeId).toBeNull();
    expect(useDashboardStore.getState().currentTourStep).toBe(0);
    expect(useDashboardStore.getState().tourHighlightedNodeIds).toEqual(["concept:one"]);
  });

  it("clears selected component details when moving backward in the guided tour", () => {
    useDashboardStore.getState().setTourStep(1);
    useDashboardStore.getState().selectNode("concept:two");

    useDashboardStore.getState().prevTourStep();

    expect(useDashboardStore.getState().selectedNodeId).toBeNull();
    expect(useDashboardStore.getState().currentTourStep).toBe(0);
    expect(useDashboardStore.getState().tourHighlightedNodeIds).toEqual(["concept:one"]);
  });

  it("stops the guided tour filter when focusing a node for drill-down", () => {
    useDashboardStore.getState().setTourStep(1);

    useDashboardStore.getState().setFocusNode("concept:one");

    expect(useDashboardStore.getState().focusNodeId).toBe("concept:one");
    expect(useDashboardStore.getState().selectedNodeId).toBe("concept:one");
    expect(useDashboardStore.getState().tourActive).toBe(false);
    expect(useDashboardStore.getState().currentTourStep).toBe(1);
    expect(useDashboardStore.getState().tourHighlightedNodeIds).toEqual([]);
  });
});
