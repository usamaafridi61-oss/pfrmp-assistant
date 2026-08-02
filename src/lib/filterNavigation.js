/** Navigate to detail pages when a specific intervention or PU is chosen in filters. */
export function applyFilterNavigation(router, pathname, prevFilters, nextFilters) {
  if (
    nextFilters.interventionId &&
    nextFilters.interventionId !== "all" &&
    nextFilters.interventionId !== prevFilters.interventionId
  ) {
    const target = `/interventions/${nextFilters.interventionId}`;
    if (pathname !== target) router.push(target);
    return true;
  }
  if (
    nextFilters.planningUnitId &&
    nextFilters.planningUnitId !== "all" &&
    nextFilters.planningUnitId !== prevFilters.planningUnitId
  ) {
    const target = `/planning-units/${nextFilters.planningUnitId}`;
    if (pathname !== target) router.push(target);
    return true;
  }
  return false;
}
