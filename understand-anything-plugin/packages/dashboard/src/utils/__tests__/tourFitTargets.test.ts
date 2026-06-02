import { describe, expect, it } from "vitest";
import { selectTourFitTargetIds } from "../tourFitTargets";

describe("selectTourFitTargetIds", () => {
  it("focuses the primary anchor for source-heavy tour steps", () => {
    expect(
      selectTourFitTargetIds(
        ["concept:workflow", "file:a.ts", "file:b.ts", "file:c.ts"],
        new Set(["concept:workflow", "file:a.ts", "file:b.ts", "file:c.ts"]),
      ),
    ).toEqual(["concept:workflow"]);
  });

  it("keeps compact tour steps as a readable multi-node fit", () => {
    expect(
      selectTourFitTargetIds(
        ["concept:a", "concept:b", "file:c.ts"],
        new Set(["concept:a", "concept:b", "file:c.ts"]),
      ),
    ).toEqual(["concept:a", "concept:b", "file:c.ts"]);
  });

  it("falls back to ready nodes when the primary anchor has not materialized", () => {
    expect(
      selectTourFitTargetIds(
        ["concept:workflow", "file:a.ts", "file:b.ts", "file:c.ts"],
        new Set(["file:a.ts", "file:b.ts"]),
      ),
    ).toEqual(["file:a.ts", "file:b.ts"]);
  });
});
