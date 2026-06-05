import { describe, expect, it } from "vitest";
import { compareConnectionRowOrder } from "../NodeInfo";

describe("NodeInfo connection ordering", () => {
  it("keeps flow_step rows in workflow order before falling back to names", () => {
    const rows = [
      {
        edge: { type: "flow_step", weight: 1 },
        otherType: "step",
        otherName: "執行 runtime 與 critic",
      },
      {
        edge: { type: "flow_step", weight: 0.1 },
        otherType: "step",
        otherName: "正規化 user intent",
      },
      {
        edge: { type: "flow_step", weight: 0.3 },
        otherType: "step",
        otherName: "規劃 creative brief",
      },
    ];

    const orderedNames = [...rows].sort(compareConnectionRowOrder).map((row) => row.otherName);

    expect(orderedNames).toEqual([
      "正規化 user intent",
      "規劃 creative brief",
      "執行 runtime 與 critic",
    ]);
  });
});
