// @vitest-environment node
import { describe, expect, it } from "vitest";

import { analyzeResume } from "@/lib/ats/score";
import { AtsAnalysis } from "@/lib/validation/ats";
import { ResumeContent } from "@/lib/validation/resume";

function resume(overrides: Record<string, unknown> = {}) {
  return ResumeContent.parse({
    basics: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+44 20 7946 0958",
    },
    summary: "Engineer who ships.",
    work: [
      {
        company: "Analytical Engines",
        role: "Staff Engineer",
        start: "2020",
        end: null,
        bullets: ["Built a React and TypeScript platform used by 10k people."],
      },
    ],
    education: [{ school: "Cambridge", degree: "BSc" }],
    skills: ["React", "TypeScript", "Kubernetes"],
    ...overrides,
  });
}

describe("analyzeResume", () => {
  it("produces a schema-valid analysis", () => {
    const analysis = analyzeResume({ content: resume() });
    expect(() => AtsAnalysis.parse(analysis)).not.toThrow();
    expect(analysis.score).toBeGreaterThanOrEqual(0);
    expect(analysis.score).toBeLessThanOrEqual(100);
  });

  it("omits the keyword signal when no job description is given", () => {
    const analysis = analyzeResume({ content: resume() });

    expect(analysis.breakdown.keyword).toBeNull();
    expect(analysis.matched).toEqual([]);
    expect(analysis.missing).toEqual([]);
  });

  it("always leaves semantic null until Phase 2", () => {
    const analysis = analyzeResume({
      content: resume(),
      jobDescription: "React engineer",
    });
    expect(analysis.breakdown.semantic).toBeNull();
  });

  it("renormalizes weights to sum to 1 whether or not keyword is present", () => {
    const withoutJd = analyzeResume({ content: resume() });
    const sumWithout =
      withoutJd.breakdown.formatting.weight + withoutJd.breakdown.structure.weight;
    expect(sumWithout).toBeCloseTo(1, 3);

    const withJd = analyzeResume({
      content: resume(),
      jobDescription: "We need React and Kubernetes experience.",
    });
    const sumWith =
      withJd.breakdown.formatting.weight +
      withJd.breakdown.structure.weight +
      withJd.breakdown.keyword!.weight;
    expect(sumWith).toBeCloseTo(1, 3);
  });

  it("scores keyword coverage against the resume", () => {
    const analysis = analyzeResume({
      content: resume(),
      jobDescription: "Seeking React and Kubernetes and Terraform expertise.",
    });

    expect(analysis.matched).toContain("react");
    expect(analysis.matched).toContain("kubernetes");
    expect(analysis.missing).toContain("terraform");
  });

  it("flags a missing email as an error", () => {
    const analysis = analyzeResume({
      content: resume({ basics: { name: "Ada Lovelace", links: [] } }),
    });

    const codes = analysis.flags.map((flag) => flag.code);
    expect(codes).toContain("missing_email");
    expect(analysis.flags.find((f) => f.code === "missing_email")?.severity).toBe(
      "error",
    );
  });

  it("flags a missing skills section", () => {
    const analysis = analyzeResume({ content: resume({ skills: [] }) });
    expect(analysis.flags.map((f) => f.code)).toContain("missing_skills");
  });

  it("flags an over-long bullet", () => {
    const analysis = analyzeResume({
      content: resume({
        work: [
          {
            company: "Analytical Engines",
            role: "Staff Engineer",
            start: "2020",
            end: null,
            bullets: [Array.from({ length: 45 }, () => "word").join(" ")],
          },
        ],
      }),
    });
    expect(analysis.flags.map((f) => f.code)).toContain("long_bullets");
  });

  it("sorts flags errors-first", () => {
    const analysis = analyzeResume({
      content: resume({ basics: { name: "Ada", links: [] }, skills: [] }),
    });
    const ranks = analysis.flags.map((f) =>
      f.severity === "error" ? 0 : f.severity === "warning" ? 1 : 2,
    );
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("scores a complete, on-target resume above a sparse one", () => {
    const jobDescription = "React and TypeScript and Kubernetes engineer.";
    const strong = analyzeResume({ content: resume(), jobDescription });
    const weak = analyzeResume({
      content: resume({
        basics: { name: "Nobody", links: [] },
        summary: undefined,
        work: [],
        education: [],
        skills: [],
      }),
      jobDescription,
    });

    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("is deterministic", () => {
    const jobDescription = "React, Kubernetes, Terraform.";
    expect(analyzeResume({ content: resume(), jobDescription })).toEqual(
      analyzeResume({ content: resume(), jobDescription }),
    );
  });
});
