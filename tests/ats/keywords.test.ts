// @vitest-environment node
import { describe, expect, it } from "vitest";

import { extractJobKeywords, matchKeywords } from "@/lib/ats/keywords";
import { buildTokenIndex, hasTerm, normalize, tokenize } from "@/lib/ats/text";

describe("text normalization", () => {
  it("preserves symbol-bearing tech tokens", () => {
    expect(tokenize("C++, C#, Node.js and CI/CD")).toEqual([
      "c++",
      "c#",
      "node.js",
      "and",
      "ci/cd",
    ]);
  });

  it("strips punctuation that carries no meaning", () => {
    expect(normalize("Led (3) teams — shipped 5 features!")).toBe(
      "led 3 teams shipped 5 features",
    );
  });

  it("matches whole tokens only, not substrings", () => {
    expect(hasTerm(buildTokenIndex("i know java"), "java")).toBe(true);
    expect(hasTerm(buildTokenIndex("i know javascript"), "java")).toBe(false);
  });

  it("treats symbol-bearing tokens as indivisible", () => {
    const index = buildTokenIndex("built with c++ daily");
    expect(hasTerm(index, "c++")).toBe(true);
    // "c" must not match inside "c++"
    expect(hasTerm(index, "c")).toBe(false);
  });

  it("ignores trailing sentence punctuation when matching", () => {
    expect(hasTerm(buildTokenIndex("i use react."), "react")).toBe(true);
    expect(hasTerm(buildTokenIndex("we run node.js here"), "node.js")).toBe(
      true,
    );
  });

  it("indexes bigrams so multi-word skills can match", () => {
    const index = buildTokenIndex("applied machine learning at scale");
    expect(hasTerm(index, "machine learning")).toBe(true);
    expect(hasTerm(index, "learning machine")).toBe(false);
  });
});

describe("extractJobKeywords", () => {
  it("returns nothing for an empty job description", () => {
    expect(extractJobKeywords("")).toEqual([]);
  });

  it("boosts known skills over more frequent filler", () => {
    const jd = "collaborate collaborate collaborate. Must know Kubernetes.";
    const terms = extractJobKeywords(jd).map((k) => k.term);
    expect(terms[0]).toBe("kubernetes");
  });

  it("drops stopwords and pure numbers", () => {
    const terms = extractJobKeywords("You will have 5 years with the team").map(
      (k) => k.term,
    );
    expect(terms).not.toContain("the");
    expect(terms).not.toContain("5");
  });

  it("keeps known multi-word skills as one phrase", () => {
    const terms = extractJobKeywords("Experience with machine learning.").map(
      (k) => k.term,
    );
    expect(terms).toContain("machine learning");
  });

  it("suppresses unigrams already covered by a selected phrase", () => {
    const terms = extractJobKeywords("Deep machine learning expertise.").map(
      (k) => k.term,
    );
    expect(terms).toContain("machine learning");
    expect(terms).not.toContain("learning");
  });

  it("is deterministic across runs", () => {
    const jd = "React, TypeScript, GraphQL, React, Docker, TypeScript.";
    expect(extractJobKeywords(jd)).toEqual(extractJobKeywords(jd));
  });

  it("respects the limit", () => {
    const jd = "react vue angular svelte redux docker kubernetes terraform aws";
    expect(extractJobKeywords(jd, 3)).toHaveLength(3);
  });
});

describe("matchKeywords", () => {
  it("returns a null score when there are no keywords to match", () => {
    expect(matchKeywords([], "anything")).toEqual({
      matched: [],
      missing: [],
      score: null,
    });
  });

  it("splits matched and missing and computes coverage", () => {
    const keywords = [
      { term: "react", weight: 3, known: true },
      { term: "kubernetes", weight: 3, known: true },
    ];
    const result = matchKeywords(keywords, "i build react apps");

    expect(result.matched).toEqual(["react"]);
    expect(result.missing).toEqual(["kubernetes"]);
    expect(result.score).toBe(50);
  });
});
