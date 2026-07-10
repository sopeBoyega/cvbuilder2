// @vitest-environment node
import { describe, expect, it } from "vitest";

import { detectSeniority } from "@/lib/ats/seniority";

describe("detectSeniority", () => {
  it("finds the seniority term in a title", () => {
    expect(detectSeniority("Senior Product Manager")).toBe("Senior");
    expect(detectSeniority("Staff Software Engineer")).toBe("Staff");
  });

  it("prefers the more senior term when several appear", () => {
    // "Senior Director" is a Director, not a Senior.
    expect(detectSeniority("Senior Director of Engineering")).toBe("Director");
  });

  it("is case insensitive", () => {
    expect(detectSeniority("PRINCIPAL ENGINEER")).toBe("Principal");
  });

  it("matches whole tokens, not substrings", () => {
    // "leadership" must not register as "lead"
    expect(detectSeniority("Leadership Coach")).toBeNull();
    // "internal" must not register as "intern"
    expect(detectSeniority("Internal Communications Manager")).toBeNull();
  });

  it("returns null when there is no seniority signal", () => {
    expect(detectSeniority("Product Manager")).toBeNull();
    expect(detectSeniority("")).toBeNull();
  });
});
