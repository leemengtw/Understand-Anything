import { useEffect, useMemo, useState } from "react";
import {
  BaseEdge,
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  EdgeLabelRenderer,
  MiniMap,
  getBezierPath,
  useReactFlow,
} from "@xyflow/react";
import type { Edge, EdgeProps, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import DomainClusterNode from "./DomainClusterNode";
import FlowNode from "./FlowNode";
import type { FlowFlowNode } from "./FlowNode";
import StepNode from "./StepNode";
import type { StepFlowNode } from "./StepNode";
import { useDashboardStore } from "../store";
import { useI18n } from "../contexts/I18nContext";
import { mergeElkPositions, nodesToElkInput } from "../utils/layout";
import { applyElkLayout } from "../utils/elk-layout";
import { buildDomainHandoffs } from "../utils/domainHandoffs";
import type { DomainHandoff } from "../utils/domainHandoffs";
import type { KnowledgeGraph, GraphNode } from "@understand-anything/core/types";

const nodeTypes = {
  "domain-cluster": DomainClusterNode,
  "flow-node": FlowNode,
  "step-node": StepNode,
};

function DomainHandoffEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  label,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute rounded-full border border-accent/40 bg-surface px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none text-accent shadow-sm shadow-black/20"
            data-testid="domain-handoff-edge-badge"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const edgeTypes = {
  "domain-handoff": DomainHandoffEdge,
};

const DOMAIN_OVERVIEW_READABLE_ZOOM = 0.72;
const DOMAIN_DETAIL_READABLE_ZOOM = 0.82;
const DOMAIN_OVERVIEW_MIN_ZOOM = 0.25;
const DOMAIN_DETAIL_MIN_ZOOM = 0.35;

function getDomainMeta(node: GraphNode) {
  return node.domainMeta;
}

function nodeCenterForReadableEntry(node: Node): { x: number; y: number } {
  const width = typeof node.measured?.width === "number" ? node.measured.width : node.width ?? 320;
  const height = typeof node.measured?.height === "number" ? node.measured.height : node.height ?? 180;
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}

interface BuiltGraph {
  nodes: Node[];
  edges: Edge[];
  dims: Map<string, { width: number; height: number }>;
}

interface DomainOverviewRouteDomain {
  id: string;
  label: string;
  summary: string;
  entities?: string[];
  flowCount: number;
  businessRules?: string[];
  incomingHandoffs: DomainHandoff[];
  outgoingHandoffs: DomainHandoff[];
}

function getDomainFlowCounts(graph: KnowledgeGraph): Map<string, number> {
  const flowCountMap = new Map<string, number>();
  for (const edge of graph.edges) {
    if (edge.type === "contains_flow") {
      flowCountMap.set(edge.source, (flowCountMap.get(edge.source) ?? 0) + 1);
    }
  }
  return flowCountMap;
}

function buildDomainOverviewRoute(graph: KnowledgeGraph): {
  domains: DomainOverviewRouteDomain[];
  handoffs: DomainHandoff[];
} {
  const domainNodes = graph.nodes.filter((n) => n.type === "domain");
  const flowCountMap = getDomainFlowCounts(graph);
  const handoffs = buildDomainHandoffs(graph);

  return {
    domains: domainNodes.map((node) => {
      const meta = getDomainMeta(node);
      return {
        id: node.id,
        label: node.name,
        summary: node.summary,
        entities: meta?.entities as string[] | undefined,
        flowCount: flowCountMap.get(node.id) ?? 0,
        businessRules: meta?.businessRules as string[] | undefined,
        incomingHandoffs: handoffs.filter((handoff) => handoff.targetId === node.id),
        outgoingHandoffs: handoffs.filter((handoff) => handoff.sourceId === node.id),
      };
    }),
    handoffs,
  };
}

function buildDomainDetail(
  graph: KnowledgeGraph,
  domainId: string,
): BuiltGraph {
  // Find flows for this domain
  const flowIds = new Set(
    graph.edges
      .filter((e) => e.type === "contains_flow" && e.source === domainId)
      .map((e) => e.target),
  );

  const flowNodes = graph.nodes.filter((n) => flowIds.has(n.id));
  const stepEdges = graph.edges.filter(
    (e) => e.type === "flow_step" && flowIds.has(e.source),
  );
  const stepIds = new Set(stepEdges.map((e) => e.target));
  const stepNodes = graph.nodes.filter((n) => stepIds.has(n.id));

  // Display flow-local step numbers as 1..N. Edge weights preserve source order,
  // but showing raw weighted labels creates gaps that make domain walkthroughs
  // look non-sequential.
  const stepOrderMap = new Map<string, number>();
  [...stepEdges]
    .sort((a, b) => a.weight - b.weight || a.target.localeCompare(b.target))
    .forEach((edge, index) => {
      stepOrderMap.set(edge.target, index + 1);
    });

  // Count steps per flow
  const stepCountMap = new Map<string, number>();
  for (const edge of stepEdges) {
    stepCountMap.set(edge.source, (stepCountMap.get(edge.source) ?? 0) + 1);
  }

  const dims = new Map<string, { width: number; height: number }>();

  const flowRfNodes: FlowFlowNode[] = flowNodes.map((node) => {
    const meta = getDomainMeta(node);
    dims.set(node.id, { width: 260, height: 120 });
    return {
      id: node.id,
      type: "flow-node" as const,
      position: { x: 0, y: 0 },
      data: {
        label: node.name,
        summary: node.summary,
        entryPoint: meta?.entryPoint as string | undefined,
        entryType: meta?.entryType as string | undefined,
        stepCount: stepCountMap.get(node.id) ?? 0,
        flowId: node.id,
      },
    };
  });
  const stepRfNodes: StepFlowNode[] = stepNodes.map((node) => {
    dims.set(node.id, { width: 200, height: 90 });
    return {
      id: node.id,
      type: "step-node" as const,
      position: { x: 0, y: 0 },
      data: {
        label: node.name,
        summary: node.summary,
        filePath: node.filePath,
        stepId: node.id,
        order: stepOrderMap.get(node.id) ?? 0,
      },
    };
  });
  const rfNodes: Node[] = [...flowRfNodes, ...stepRfNodes];

  const rfEdges: Edge[] = stepEdges.map((e, i) => ({
    id: `fs-${i}-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    style: { stroke: "var(--color-border-medium)", strokeWidth: 1.5 },
    animated: false,
  }));

  return { nodes: rfNodes, edges: rfEdges, dims };
}

function DomainOverviewHandoffList({ graph }: { graph: KnowledgeGraph }) {
  const selectNode = useDashboardStore((s) => s.selectNode);
  const handoffs = useMemo(() => buildDomainHandoffs(graph), [graph]);

  if (handoffs.length === 0) return null;

  return (
    <div
      className="shrink-0 rounded-lg border border-border-subtle bg-surface/95 p-3 shadow-lg shadow-black/15 backdrop-blur"
      data-testid="domain-overview-handoffs"
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        Domain handoffs
      </div>
      <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
        {handoffs.map((handoff) => (
          <button
            key={`${handoff.sourceId}-${handoff.targetId}-${handoff.index}`}
            type="button"
            onClick={() => selectNode(handoff.targetId)}
            className="block w-full rounded-md border border-border-subtle bg-elevated/80 px-2.5 py-2 text-left transition-colors hover:border-accent/40 hover:bg-accent/10"
            data-testid="domain-overview-handoff-row"
          >
            <div className="mb-1 flex min-w-0 items-start gap-1.5 text-[10px]">
              <span className="rounded-full bg-accent/20 px-1.5 py-0.5 font-mono font-semibold text-accent">
                {handoff.badge}
              </span>
              <span
                className="min-w-0 flex-1 leading-snug"
                data-testid="domain-overview-handoff-route"
              >
                <span
                  className="font-semibold text-text-primary"
                  data-testid="domain-overview-handoff-source"
                >
                  {handoff.sourceName}
                </span>
                <span className="mx-1 text-text-muted">-&gt;</span>
                <span
                  className="font-semibold text-text-primary"
                  data-testid="domain-overview-handoff-target"
                >
                  {handoff.targetName}
                </span>
              </span>
            </div>
            <div
              className="text-[11px] leading-snug text-text-secondary"
              data-testid="domain-overview-handoff-description"
            >
              {handoff.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DomainOverviewRouteMap({ graph }: { graph: KnowledgeGraph }) {
  const selectNode = useDashboardStore((s) => s.selectNode);
  const navigateToDomain = useDashboardStore((s) => s.navigateToDomain);
  const selectedNodeId = useDashboardStore((s) => s.selectedNodeId);
  const { domains } = useMemo(() => buildDomainOverviewRoute(graph), [graph]);

  return (
    <div
      className="h-full overflow-auto p-2"
      data-testid="domain-overview-route-map"
    >
      <div className="grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {domains.map((domain, index) => {
          const isSelected = selectedNodeId === domain.id;
          const cardHandoffs = [...domain.incomingHandoffs, ...domain.outgoingHandoffs];
          return (
            <button
              key={domain.id}
              type="button"
              onClick={() => selectNode(domain.id)}
              onDoubleClick={() => navigateToDomain(domain.id)}
              className={`flex min-h-[150px] flex-col rounded-lg border p-2.5 text-left transition-colors ${
                isSelected
                  ? "border-accent bg-accent/10 shadow-lg shadow-accent/10"
                  : "border-accent/35 bg-surface/90 hover:border-accent/65 hover:bg-elevated/80"
              }`}
              data-domain-id={domain.id}
              data-testid="domain-overview-route-card"
            >
              <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-1 text-[10px] font-mono font-semibold uppercase tracking-wide text-text-muted">
                    Domain {index + 1}
                  </div>
                  <div className="font-heading text-sm font-semibold text-accent">
                    {domain.label}
                  </div>
                </div>
                <div className="shrink-0 rounded-full border border-border-subtle bg-elevated px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                  {domain.flowCount} flow{domain.flowCount !== 1 ? "s" : ""}
                </div>
              </div>

              <div
                className="mb-1.5 text-[11px] leading-snug text-text-secondary"
                data-testid="domain-overview-route-summary"
              >
                {domain.summary}
              </div>

              {domain.entities && domain.entities.length > 0 ? (
                <div className="mb-1.5 flex max-h-5 flex-wrap gap-1 overflow-hidden">
                  {domain.entities.slice(0, 3).map((entity) => (
                    <span
                      key={entity}
                      className="rounded bg-elevated px-1.5 py-0.5 text-[10px] text-text-secondary"
                    >
                      {entity}
                    </span>
                  ))}
                  {domain.entities.length > 3 ? (
                    <span className="text-[10px] text-text-muted">
                      +{domain.entities.length - 3}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {cardHandoffs.length > 0 ? (
                <div className="mt-auto border-t border-border-subtle pt-1.5">
                  <div
                    className="flex flex-wrap gap-1"
                    data-testid="domain-overview-route-handoffs"
                  >
                    {cardHandoffs.slice(0, 2).map((handoff) => {
                      const isOutgoing = handoff.sourceId === domain.id;
                      return (
                        <span
                          key={`${domain.id}-${handoff.index}-${handoff.sourceId}-${handoff.targetId}`}
                          className="flex max-w-full items-start gap-1 rounded bg-elevated px-1.5 py-0.5 text-[10px] leading-4 text-text-secondary"
                          data-testid="domain-overview-route-handoff"
                          title={`${isOutgoing ? "To" : "From"} ${
                            isOutgoing ? handoff.targetName : handoff.sourceName
                          }: ${handoff.description}`}
                        >
                          <span className="h-4 min-w-4 rounded-full bg-accent/20 text-center font-mono font-semibold leading-4 text-accent">
                            {handoff.badge}
                          </span>
                          <span className="min-w-0 leading-snug">
                            <span className="font-semibold text-text-primary">
                              {isOutgoing ? "To" : "From"}
                            </span>{" "}
                            {isOutgoing ? handoff.targetName : handoff.sourceName}
                          </span>
                        </span>
                      );
                    })}
                    {cardHandoffs.length > 2 ? (
                      <span className="rounded bg-elevated px-1.5 py-0.5 text-[10px] leading-4 text-text-muted">
                        +{cardHandoffs.length - 2} handoff
                        {cardHandoffs.length - 2 !== 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DomainGraphViewInner() {
  const domainGraph = useDashboardStore((s) => s.domainGraph);
  const activeDomainId = useDashboardStore((s) => s.activeDomainId);
  const clearActiveDomain = useDashboardStore((s) => s.clearActiveDomain);
  const reactFlow = useReactFlow();
  const { t } = useI18n();

  // Build structural nodes/edges/dims synchronously; only the layout call
  // itself is async, so we memo the structural pieces and run ELK in an
  // effect.
  const built = useMemo<BuiltGraph | null>(() => {
    if (!domainGraph) return null;
    if (!activeDomainId) return null;
    return buildDomainDetail(domainGraph, activeDomainId);
  }, [domainGraph, activeDomainId]);

  const [layout, setLayout] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  useEffect(() => {
    if (!built) {
      setLayout({ nodes: [], edges: [] });
      return;
    }
    let cancelled = false;
    const { nodes: nodesArray, edges: edgesArray, dims } = built;
    // DomainGraphView used dagre LR; preserve that direction with ELK.
    const elkInput = nodesToElkInput(nodesArray, edgesArray, dims, {
      "elk.direction": "RIGHT",
    });
    applyElkLayout(elkInput, { strict: import.meta.env.DEV })
      .then(({ positioned, issues }) => {
        if (cancelled) return;
        if (issues.length > 0) {
          // Funnel into store so WarningBanner surfaces them.
          useDashboardStore.getState().appendLayoutIssues(issues);
        }
        setLayout({
          nodes: mergeElkPositions(nodesArray, positioned),
          edges: edgesArray,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[domain ELK] layout failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [built]);

  const { nodes, edges } = layout;
  const isOverview = !activeDomainId;

  useEffect(() => {
    if (isOverview) return;
    if (nodes.length === 0) return;
    const readableZoom = isOverview ? DOMAIN_OVERVIEW_READABLE_ZOOM : DOMAIN_DETAIL_READABLE_ZOOM;
    const timeoutId = window.setTimeout(() => {
      const anchorNode = nodes.reduce((leftMost, node) =>
        node.position.x < leftMost.position.x ? node : leftMost,
      );
      const center = nodeCenterForReadableEntry(anchorNode);
      void reactFlow.setCenter(center.x, center.y, {
        zoom: readableZoom,
        duration: 0,
      });
    }, 80);
    return () => window.clearTimeout(timeoutId);
  }, [isOverview, nodes, reactFlow]);

  // Double-click is handled by individual node components (e.g. DomainClusterNode)

  if (!domainGraph) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted text-sm">
        No domain graph available. Run /understand-domain to generate one.
      </div>
    );
  }

  const flow = (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      minZoom={isOverview ? DOMAIN_OVERVIEW_MIN_ZOOM : DOMAIN_DETAIL_MIN_ZOOM}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="var(--color-border-subtle)"
      />
      <Controls />
      <MiniMap
        nodeColor="var(--color-accent)"
        maskColor="var(--glass-bg)"
        className="!bg-surface !border !border-border-subtle"
      />
    </ReactFlow>
  );

  if (isOverview) {
    return (
      <div className="grid h-full w-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 p-3">
        {domainGraph && <DomainOverviewHandoffList graph={domainGraph} />}
        <div
          className="relative min-h-0 overflow-hidden rounded-lg border border-border-subtle bg-root/40"
          data-testid="domain-overview-flow-shell"
        >
          <DomainOverviewRouteMap graph={domainGraph} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {activeDomainId && (
        <div className="absolute top-3 left-3 z-10">
          <button
            type="button"
            onClick={() => clearActiveDomain()}
            className="px-3 py-1.5 text-xs rounded-lg bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary transition-colors"
          >
            {t.domainView.backToDomains}
          </button>
        </div>
      )}
      {flow}
    </div>
  );
}

export default function DomainGraphView() {
  return (
    <ReactFlowProvider>
      <DomainGraphViewInner />
    </ReactFlowProvider>
  );
}
