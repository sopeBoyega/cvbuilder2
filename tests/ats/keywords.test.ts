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

describe("stemmed matching", () => {
  it("matches morphological variants (the false-missing-keyword bug)", () => {
    // A JD asking for "management" against a resume that says "managed"
    // used to report a false miss.
    const index = buildTokenIndex("managed a team of eight engineers");
    expect(hasTerm(index, "management")).toBe(true);
    expect(hasTerm(index, "managing")).toBe(true);
    expect(hasTerm(index, "manager")).toBe(true);
  });

  it("stems both words of a multi-word term", () => {
    const index = buildTokenIndex("drove data-driven decisions");
    expect(hasTerm(index, "data-driven decision")).toBe(true);
  });

  it("does not stem symbol-bearing or alphanumeric tokens", () => {
    const index = buildTokenIndex("shipped c++ and es2017 features");
    expect(hasTerm(index, "c++")).toBe(true);
    expect(hasTerm(index, "es2017")).toBe(true);
  });

  it("keeps distinct roots distinct (no over-stemming collisions)", () => {
    const index = buildTokenIndex("i know java well");
    expect(hasTerm(index, "javascript")).toBe(false);
  });

  it("reports coverage using stems in matchKeywords", () => {
    const keywords = [
      { term: "leadership", weight: 3, known: true },
      { term: "reporting", weight: 2, known: false },
    ];
    const result = matchKeywords(keywords, "led reporting on weekly metrics");
    // "reporting" ~ "report"/"reporting" both stem to "report"
    expect(result.matched).toContain("reporting");
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

  it("never surfaces prepositions or copulas as keywords", () => {
    // Regression: these leaked into production as "matched keywords" because
    // tokenize only drops 1-character tokens, so "in"/"on"/"of"/"to" survived.
    const jd = `Google is looking for a Senior Product Manager to lead our Core
      Search Infrastructure. You will be responsible for roadmapping complex
      systems using Agile methodologies. You will work closely with engineering
      teams to optimize query latency in production and report on results.`;

    const terms = extractJobKeywords(jd).map((k) => k.term);

    for (const noise of ["in", "on", "of", "to", "is", "be", "as", "by", "or"]) {
      expect(terms, `"${noise}" must not be a keyword`).not.toContain(noise);
    }
    // ...while the real signal survives.
    expect(terms).toContain("agile");
  });

  it("excludes stopwords from bigrams too", () => {
    const terms = extractJobKeywords(
      "report on results. report on results.",
    ).map((k) => k.term);
    expect(terms).not.toContain("report on");
    expect(terms).not.toContain("on results");
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

  it("requires unknown unigrams to recur (page-scrap regression)", () => {
    // "greenhouse"/"argentina"-style one-off scraps from a scraped page must
    // not rank; a repeated unknown term is real signal and still does.
    const jd = `Build dashboards with widgetify. Ship widgetify integrations.
      Our office is in Argentina. Experience with React required.`;
    const terms = extractJobKeywords(jd).map((k) => k.term);

    expect(terms).toContain("widgetify"); // unknown, appears twice
    expect(terms).toContain("react"); // known, once is enough
    expect(terms).not.toContain("argentina"); // unknown, appears once
  });

  it("treats EEO/application-form vocabulary as stopwords", () => {
    const jd = `We process your personal data per our notice. Employment is
      contingent on eligibility. Select your gender and veteran status below.
      Personal information stays private. Employment authorization required.
      Kubernetes experience required.`;
    const terms = extractJobKeywords(jd).map((k) => k.term);

    for (const noise of [
      "personal",
      "personal data",
      "employment",
      "select",
      "gender",
      "veteran",
      "status",
      "eligibility",
      "information",
    ]) {
      expect(terms, `"${noise}" must not be a keyword`).not.toContain(noise);
    }
    expect(terms).toContain("kubernetes");
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
