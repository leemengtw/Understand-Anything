/**
 * Pick the graph nodes a tour step should fit to.
 *
 * Tour focus is the first-principles learning surface. The graph should fit
 * the current step's whole evidence board so source-heavy steps do not look
 * like a single anchor plus a hidden side-panel list.
 */
export function selectTourFitTargetIds(
  highlightedNodeIds: string[],
  readyNodeIds: ReadonlySet<string>,
): string[] {
  const readyInTourOrder = highlightedNodeIds.filter((id) => readyNodeIds.has(id));
  return readyInTourOrder;
}
