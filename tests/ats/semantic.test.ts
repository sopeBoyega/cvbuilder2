// @vitest-environment node
import { describe, expect, it } from "vitest";

import { cosineSimilarity, toSemanticScore } from "@/lib/ats/semantic";
import { analyzeResume } from "@/lib/ats/score";
import { ResumeContent } from "@/lib/validation/resume";

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
  });

  it("is 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it("is scale-invariant (unnormalized vectors are fine)", () => {
    expect(cosineSimilarity([1, 2, 3], [10, 20, 30])).toBeCloseTo(1, 6);
  });

  it("guards against length mismatch and empties", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it("guards against zero vectors (no divide-by-zero)", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe("toSemanticScore", () => {
  it("maps identical vectors to 100", () => {
    expect(toSemanticScore([1, 2, 3], [1, 2, 3])).toBe(100);
  });

  it("clamps negative similarity to 0", () => {
    expect(toSemanticScore([1, 0], [-1, 0])).toBe(0);
  });
});

describe("analyzeResume with a semantic signal", () => {
  const content = ResumeContent.parse({
    basics: { name: "Ada Lovelace", email: "ada@example.com" },
    summary: "Engineer.",
    work: [
      {
        company: "Analytical Engines",
        role: "Staff Engineer",
        start: "2020",
        end: null,
        bullets: ["Built a React platform."],
      },
    ],
    skills: ["React"],
  });

  it("includes semantic in the breakdown when provided", () => {
    const analysis = analyzeResume({
      content,
      jobDescription: "React engineer wanted.",
      semanticScore: 72,
    });
    expect(analysis.breakdown.semantic).not.toBeNull();
    expect(analysis.breakdown.semantic?.score).toBe(72);
  });

  it("leaves semantic null when not provided", () => {
    const analysis = analyzeResume({
      content,
      jobDescription: "React engineer wanted.",
    });
    expect(analysis.breakdown.semantic).toBeNull();
  });

  it("renormalizes all four weights to sum to 1 with semantic present", () => {
    const { breakdown } = analyzeResume({
      content,
      jobDescription: "React engineer wanted.",
      semanticScore: 72,
    });
    const total =
      (breakdown.keyword?.weight ?? 0) +
      (breakdown.semantic?.weight ?? 0) +
      breakdown.formatting.weight +
      breakdown.structure.weight;
    expect(total).toBeCloseTo(1, 3);
  });

  it("gives semantic the largest share of the four (0.30 base)", () => {
    const { breakdown } = analyzeResume({
      content,
      jobDescription: "React engineer wanted.",
      semanticScore: 72,
    });
    // keyword 0.35 is the only one above semantic 0.30 in the base weights.
    expect(breakdown.semantic!.weight).toBeGreaterThan(
      breakdown.formatting.weight,
    );
    expect(breakdown.semantic!.weight).toBeLessThan(breakdown.keyword!.weight);
  });
});
