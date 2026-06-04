import { describe, expect, it } from "vitest";
import { shouldShowOnboarding } from "../onboarding";

describe("dashboard onboarding", () => {
  it("stays hidden by default", () => {
    expect(shouldShowOnboarding("")).toBe(false);
    expect(shouldShowOnboarding("?token=abc")).toBe(false);
  });

  it.each(["?onboard=force", "?onboard=1", "?onboard=true", "?onboard=on", "?onboarding=force"])(
    "can be forced with %s",
    (search) => {
      expect(shouldShowOnboarding(search)).toBe(true);
    },
  );

  it.each(["?onboard=0", "?onboard=false", "?onboard=off"])("ignores non-force values in %s", (search) => {
    expect(shouldShowOnboarding(search)).toBe(false);
  });
});
