// @vitest-environment node
import { describe, expect, it } from "vitest";

import { analyzeExtraction, toExtractedGroups } from "@/lib/ats/extraction";
import { ResumeContent } from "@/lib/validation/resume";

const content = ResumeContent.parse({
  basics: {
    name: "Ada Lovelace",
    email: "ada@example.com",
    links: [],
  },
  work: [
    {
      company: "Analytical Engines",
      role: "Software Engineer",
      start: "2023",
      bullets: ["Built a compiler for the difference engine using Rust"],
    },
  ],
  skills: ["rust", "compilers"],
});

describe("analyzeExtraction", () => {
  it("reports unavailable when there is no source text", () => {
    for (const raw of [null, undefined, "   "]) {
      const report = analyzeExtraction(raw, content);
      expect(report.available).toBe(false);
      // Never a 0% — that would read as a failure rather than "not checked".
      expect(report.coverage).toBeNull();
      expect(report.droppedLines).toEqual([]);
    }
  });

  it("scores full coverage when everything survived structuring", () => {
    const raw = "Ada Lovelace ada@example.com Software Engineer Analytical Engines Built a compiler for the difference engine using Rust";
    const report = analyzeExtraction(raw, content);

    expect(report.available).toBe(true);
    expect(report.coverage).toBe(100);
    expect(report.droppedLines).toEqual([]);
  });

  it("flags a content line that did not reach the structure", () => {
    const raw = [
      "Ada Lovelace",
      "ada@example.com",
      "Software Engineer at Analytical Engines",
      "Built a compiler for the difference engine using Rust",
      // A whole section the parser lost — the case this check exists for.
      "Volunteer mentorship coordinating weekly algorithms workshops for undergraduate students",
    ].join("\n");

    const report = analyzeExtraction(raw, content);

    expect(report.coverage).toBeLessThan(100);
    expect(report.droppedLines).toHaveLength(1);
    expect(report.droppedLines[0]).toContain("Volunteer mentorship");
  });

  it("ignores short lines like section headings", () => {
    const raw = [
      "Ada Lovelace",
      "ada@example.com",
      "EXPERIENCE", // heading: never surfaces as "dropped content"
      "SKILLS",
      "Built a compiler for the difference engine using Rust",
    ].join("\n");

    expect(analyzeExtraction(raw, content).droppedLines).toEqual([]);
  });

  it("ignores stopwords and bare numbers when measuring coverage", () => {
    // Filler and page numbers must not drag coverage down.
    const raw =
      "Ada Lovelace ada@example.com Software Engineer Analytical Engines " +
      "Built a compiler for the difference engine using Rust 1 2 3 the and of to";
    expect(analyzeExtraction(raw, content).coverage).toBe(100);
  });
});

describe("toExtractedGroups", () => {
  it("renders absent optional fields as null rather than hiding them", () => {
    const contact = toExtractedGroups(content).find(
      (group) => group.name === "contact",
    );
    const phone = contact?.fields.find((field) => field.label === "phone");

    expect(phone).toBeDefined();
    expect(phone?.value).toBeNull();
  });

  it("marks name, email and skills as critical", () => {
    const groups = toExtractedGroups(content);
    const critical = groups
      .flatMap((group) => group.fields)
      .filter((field) => field.critical)
      .map((field) => field.label);

    expect(critical).toContain("name");
    expect(critical).toContain("email");
    expect(critical).toContain("list"); // skills
  });

  it("shows an empty education section as a null row", () => {
    const education = toExtractedGroups(content).find((group) =>
      group.name.startsWith("education"),
    );
    expect(education?.name).toBe("education[0]");
    expect(education?.fields[0].value).toBeNull();
  });

  it("counts work entries in the group name", () => {
    const work = toExtractedGroups(content).find((group) =>
      group.name.startsWith("experience"),
    );
    expect(work?.name).toBe("experience[1]");
  });

  it("lists every bullet verbatim instead of summarising the count", () => {
    const work = toExtractedGroups(content).find((group) =>
      group.name.startsWith("experience"),
    );

    expect(
      work?.fields.find((field) => field.label === "0.bullets[0]")?.value,
    ).toBe("Built a compiler for the difference engine using Rust");

    // Regression: a "5 found" summary made it impossible to verify that a
    // bullet actually survived parsing, which is the point of the scan.
    expect(work?.fields.some((field) => field.value?.endsWith("found"))).toBe(
      false,
    );
  });

  it("always emits every section group, even when empty", () => {
    const names = toExtractedGroups(content).map((group) => group.name);

    // Regression: certifications were omitted entirely, so a resume with five
    // of them showed none.
    expect(names).toContain("certifications[0]");
    expect(names).toContain("projects[0]");
    expect(names).toContain("skills[2]");
  });

  it("renders a certification as name · issuer · year", () => {
    const withCerts = ResumeContent.parse({
      ...content,
      certifications: [
        { name: "C++", issuer: "Codecademy", year: "September 2022" },
      ],
    });
    const certs = toExtractedGroups(withCerts).find((group) =>
      group.name.startsWith("certifications"),
    );

    expect(certs?.name).toBe("certifications[1]");
    expect(certs?.fields[0].value).toBe("C++ · Codecademy · September 2022");
  });

  it("keeps education dates rather than dropping them", () => {
    const withSchool = ResumeContent.parse({
      ...content,
      education: [
        {
          school: "Middlesex University UK",
          degree: "Bsc",
          field: "Business Computing",
          start: "Sept 2026",
        },
      ],
    });
    const education = toExtractedGroups(withSchool).find((group) =>
      group.name.startsWith("education"),
    );

    expect(
      education?.fields.find((field) => field.label === "0.dates")?.value,
    ).toBe("Sept 2026 → present");
  });
});
