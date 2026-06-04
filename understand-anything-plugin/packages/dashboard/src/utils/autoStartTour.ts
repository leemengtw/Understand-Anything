import type { KnowledgeGraph } from "@understand-anything/core/types";

const TOUR_OPT_IN_VALUES = new Set(["1", "true", "on", "start", "force", "learn"]);

/**
 * Graphs that carry an authored tour already have a curated first-principles
 * entry path, but generated dashboards should not claim the first screen by
 * opening it automatically. Keep the tour explicit so Domain/overview remains
 * the default codebase-understanding surface.
 */
export function shouldAutoStartTour(
  graph: Pick<KnowledgeGraph, "tour"> | null | undefined,
  search: string = typeof window === "undefined" ? "" : window.location.search,
): boolean {
  if (!Array.isArray(graph?.tour) || graph.tour.length === 0) return false;
  const params = new URLSearchParams(search);
  const value = params.get("tour")?.trim().toLowerCase();
  return Boolean(value && TOUR_OPT_IN_VALUES.has(value));
}

/**
 * A domain graph is a higher-level business/workflow entry than an authored
 * structural tour. Prefer that overview unless the URL explicitly asks to keep
 * the tour running.
 */
export function shouldPreferDomainOverview(
  search: string = typeof window === "undefined" ? "" : window.location.search,
): boolean {
  const params = new URLSearchParams(search);
  const value = params.get("tour")?.trim().toLowerCase();
  return !value || !TOUR_OPT_IN_VALUES.has(value);
}
