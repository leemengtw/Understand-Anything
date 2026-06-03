import { describe, expect, it } from "vitest";
import type { KnowledgeGraph } from "@understand-anything/core/types";
import { shouldAutoStartTour } from "../autoStartTour";

const graphWithTour = {
  tour: [
    {
      order: 1,
      title: "Start here",
      description: "Curated first-principles entry.",
      nodeIds: ["concept:start"],
    },
  ],
} satisfies Pick<KnowledgeGraph, "tour">;

describe("shouldAutoStartTour", () => {
  it("starts authored tours by default", () => {
    expect(shouldAutoStartTour(graphWithTour, "")).toBe(true);
  });

  it("does not start when no tour exists", () => {
    expect(shouldAutoStartTour({ tour: [] }, "")).toBe(false);
  });

  it.each(["?tour=off", "?tour=false", "?tour=0", "?tour=raw", "?tour=overview"])(
    "allows raw graph opt-out with %s",
    (search) => {
      expect(shouldAutoStartTour(graphWithTour, search)).toBe(false);
    },
  );
});
