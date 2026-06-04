import { describe, expect, it } from "vitest";
import type { KnowledgeGraph } from "@understand-anything/core/types";
import { shouldAutoStartTour, shouldPreferDomainOverview } from "../autoStartTour";

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
  it("does not start authored tours by default", () => {
    expect(shouldAutoStartTour(graphWithTour, "")).toBe(false);
  });

  it("does not start when no tour exists", () => {
    expect(shouldAutoStartTour({ tour: [] }, "")).toBe(false);
  });

  it.each(["?tour=force", "?tour=on", "?tour=1", "?tour=true", "?tour=start", "?tour=learn"])(
    "allows explicit tour opt-in with %s",
    (search) => {
      expect(shouldAutoStartTour(graphWithTour, search)).toBe(true);
    },
  );

  it.each(["?tour=off", "?tour=false", "?tour=0", "?tour=raw", "?tour=overview"])(
    "keeps tour off with %s",
    (search) => {
      expect(shouldAutoStartTour(graphWithTour, search)).toBe(false);
    },
  );

  it("prefers domain overview by default when a domain graph exists", () => {
    expect(shouldPreferDomainOverview("")).toBe(true);
    expect(shouldPreferDomainOverview("?tour=off")).toBe(true);
  });

  it.each(["?tour=force", "?tour=on", "?tour=1", "?tour=true", "?tour=start", "?tour=learn"])(
    "allows explicit tour mode over domain overview with %s",
    (search) => {
      expect(shouldPreferDomainOverview(search)).toBe(false);
    },
  );
});
