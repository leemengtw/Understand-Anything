import type { Node } from "@xyflow/react";

const TOUR_EVIDENCE_BOARD_GAP_X = 380;
const TOUR_EVIDENCE_BOARD_GAP_Y = 190;

export function getTourEvidenceBoardColumnCount(nodeCount: number): number {
  if (nodeCount <= 1) return 1;
  if (nodeCount <= 4) return 2;
  return 3;
}

/**
 * Lay out guided-tour evidence as a compact reading board.
 *
 * ELK's layered layout is good for dependency flow, but a tour step often
 * contains an ordered evidence list plus synthetic "tour ref" edges. If we
 * feed that to ELK, source-heavy steps become a tall chain and the viewport
 * zooms out until the graph is unreadable. A stable board keeps the whole
 * step visible while preserving the tour's evidence order.
 */
export function layoutTourEvidenceBoard<T extends Node>(nodes: T[]): T[] {
  if (nodes.length === 0) return nodes;

  const columns = getTourEvidenceBoardColumnCount(nodes.length);

  return nodes.map((node, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const rowStart = row * columns;
    const rowNodeCount = Math.min(columns, nodes.length - rowStart);
    const rowOffsetX = ((columns - rowNodeCount) * TOUR_EVIDENCE_BOARD_GAP_X) / 2;

    return {
      ...node,
      position: {
        x: rowOffsetX + col * TOUR_EVIDENCE_BOARD_GAP_X,
        y: row * TOUR_EVIDENCE_BOARD_GAP_Y,
      },
    };
  });
}
