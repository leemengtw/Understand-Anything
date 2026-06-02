type GraphLikeNode = {
  id: string;
};

type GraphLikeEdge = {
  source: string;
  target: string;
};

export function filterToTourStepEvidence<
  TNode extends GraphLikeNode,
  TEdge extends GraphLikeEdge,
>(
  nodes: TNode[],
  edges: TEdge[],
  tourNodeIds: string[],
): { nodes: TNode[]; edges: TEdge[]; active: boolean } {
  if (tourNodeIds.length === 0) {
    return { nodes, edges, active: false };
  }

  const tourSet = new Set(tourNodeIds);
  const tourNodes = nodes.filter((node) => tourSet.has(node.id));
  if (tourNodes.length === 0) {
    return { nodes, edges, active: false };
  }

  const visibleNodeIds = new Set(tourNodes.map((node) => node.id));
  const tourEdges = edges.filter(
    (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
  );

  return { nodes: tourNodes, edges: tourEdges, active: true };
}
