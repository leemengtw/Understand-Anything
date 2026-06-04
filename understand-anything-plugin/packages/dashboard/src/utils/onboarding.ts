const ONBOARDING_FORCE_VALUES = new Set(["1", "true", "force", "on"]);

export const ONBOARDING_DISMISSED_KEY = "ua-onboarding-dismissed-v1";

/**
 * Keep onboarding opt-in by default so generated dashboards open directly to
 * the graph a reader came to inspect. `?onboard=force` remains available for
 * product walkthroughs and demos.
 */
export function shouldShowOnboarding(
  search: string = typeof window === "undefined" ? "" : window.location.search,
): boolean {
  const params = new URLSearchParams(search);
  const value = params.get("onboard") ?? params.get("onboarding");
  if (!value) return false;
  return ONBOARDING_FORCE_VALUES.has(value.trim().toLowerCase());
}
