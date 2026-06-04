import type { GraphEdge, KnowledgeGraph } from "@understand-anything/core/types";

export interface DomainHandoff {
  index: number;
  badge: string;
  edge: GraphEdge;
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
  description: string;
}

export function getDomainHandoffBadge(index: number): string {
  return String(index + 1);
}

export function buildDomainHandoffs(graph: KnowledgeGraph): DomainHandoff[] {
  const nodeNameById = new Map(graph.nodes.map((node) => [node.id, node.name]));

  return graph.edges
    .filter((edge) => edge.type === "cross_domain")
    .map((edge, index) => ({
      index,
      badge: getDomainHandoffBadge(index),
      edge,
      sourceId: edge.source,
      targetId: edge.target,
      sourceName: nodeNameById.get(edge.source) ?? edge.source,
      targetName: nodeNameById.get(edge.target) ?? edge.target,
      description: edge.description?.trim() || "Cross-domain handoff",
    }));
}
