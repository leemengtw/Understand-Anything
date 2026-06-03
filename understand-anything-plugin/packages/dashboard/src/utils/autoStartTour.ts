import type { KnowledgeGraph } from "@understand-anything/core/types";

const TOUR_OPT_OUT_VALUES = new Set(["0", "false", "off", "raw", "overview"]);

/**
 * Graphs that carry an authored tour already have a curated first-principles
 * entry path. Start there by default so dense raw graphs are a deliberate
 * drill-down choice instead of the first thing a reader has to parse.
 */
export function shouldAutoStartTour(
  graph: Pick<KnowledgeGraph, "tour"> | null | undefined,
  search: string = typeof window === "undefined" ? "" : window.location.search,
): boolean {
  if (!Array.isArray(graph?.tour) || graph.tour.length === 0) return false;
  const params = new URLSearchParams(search);
  const value = params.get("tour")?.trim().toLowerCase();
  return !value || !TOUR_OPT_OUT_VALUES.has(value);
}
