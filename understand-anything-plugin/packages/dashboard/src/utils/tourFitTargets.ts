const MULTI_REFERENCE_PRIMARY_FOCUS_THRESHOLD = 4;

/**
 * Pick the graph nodes a tour step should fit to.
 *
 * Tour steps often include one owner-facing concept followed by source-file
 * references. Fitting every reference can zoom so far out that the graph stops
 * being useful as an explanatory surface, while the references are already
 * available in the side panel for source drilldown.
 */
export function selectTourFitTargetIds(
  highlightedNodeIds: string[],
  readyNodeIds: ReadonlySet<string>,
): string[] {
  const readyInTourOrder = highlightedNodeIds.filter((id) => readyNodeIds.has(id));
  if (readyInTourOrder.length === 0) return [];

  const primaryId = highlightedNodeIds[0];
  if (
    highlightedNodeIds.length >= MULTI_REFERENCE_PRIMARY_FOCUS_THRESHOLD &&
    primaryId &&
    readyNodeIds.has(primaryId)
  ) {
    return [primaryId];
  }

  return readyInTourOrder;
}
