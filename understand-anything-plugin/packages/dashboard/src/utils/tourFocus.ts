type GraphLikeNode = {
  id: string;
};

type GraphLikeEdge = {
  source: string;
  target: string;
};

export const TOUR_REFERENCE_EDGE_DESCRIPTION =
  "UA tour evidence order; not a code dependency";

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

export function addTourReferenceEdges<TEdge extends GraphLikeEdge>(
  edges: TEdge[],
  tourNodeIds: string[],
): TEdge[] {
  if (tourNodeIds.length < 2) {
    return edges;
  }

  const existingPairs = new Set<string>();
  for (const edge of edges) {
    existingPairs.add(`${edge.source}\0${edge.target}`);
    existingPairs.add(`${edge.target}\0${edge.source}`);
  }

  const next = [...edges];
  for (let index = 1; index < tourNodeIds.length; index += 1) {
    const source = tourNodeIds[index - 1];
    const target = tourNodeIds[index];
    if (!source || !target) continue;
    const pairKey = `${source}\0${target}`;
    if (existingPairs.has(pairKey)) continue;
    existingPairs.add(pairKey);
    existingPairs.add(`${target}\0${source}`);
    next.push({
      source,
      target,
      type: "related",
      direction: "forward",
      weight: 0.2,
      description: TOUR_REFERENCE_EDGE_DESCRIPTION,
    } as unknown as TEdge);
  }

  return next;
}
