import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import {
  getTourEvidenceBoardColumnCount,
  layoutTourEvidenceBoard,
} from "../tourEvidenceBoard";

function node(id: string): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {},
  };
}

describe("layoutTourEvidenceBoard", () => {
  it("uses a compact three-column board for source-heavy tour evidence", () => {
    const laidOut = layoutTourEvidenceBoard(
      Array.from({ length: 14 }, (_, index) => node(`n${index + 1}`)),
    );

    expect(getTourEvidenceBoardColumnCount(laidOut.length)).toBe(3);
    expect(laidOut.slice(0, 6).map((n) => [n.position.x, n.position.y])).toEqual([
      [0, 0],
      [380, 0],
      [760, 0],
      [0, 190],
      [380, 190],
      [760, 190],
    ]);
    expect(laidOut[12].position).toEqual({ x: 190, y: 760 });
    expect(laidOut[13].position).toEqual({ x: 570, y: 760 });
  });

  it("keeps small tour steps readable without a sparse board", () => {
    const laidOut = layoutTourEvidenceBoard(["a", "b", "c", "d"].map(node));

    expect(getTourEvidenceBoardColumnCount(laidOut.length)).toBe(2);
    expect(laidOut.map((n) => [n.position.x, n.position.y])).toEqual([
      [0, 0],
      [380, 0],
      [0, 190],
      [380, 190],
    ]);
  });

  it("centers a partial final row", () => {
    const laidOut = layoutTourEvidenceBoard(["a", "b", "c", "d", "e"].map(node));

    expect(laidOut[3].position).toEqual({ x: 190, y: 190 });
    expect(laidOut[4].position).toEqual({ x: 570, y: 190 });
  });
});
