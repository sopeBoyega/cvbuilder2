// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  ScrapeError,
  htmlToText,
  parseJobPostingHtml,
  trimJobBoilerplate,
} from "@/lib/jobs/scrape";

const LONG_DESCRIPTION_HTML = `
  <p>We are hiring a Junior Frontend Engineer to join our platform team.</p>
  <p>You will build accessible React interfaces, collaborate with design,
  and ship weekly. We value curiosity and clear written communication.</p>
  <ul>
    <li>1+ years with React &amp; TypeScript</li>
    <li>Comfort with testing (Vitest, Playwright)</li>
    <li>Familiarity with REST APIs</li>
  </ul>
  <p>Compensation is transparent and posted in the listing. Remote-friendly
  within &plusmn;3 hours of UTC. We sponsor visas where possible.</p>
`;

function jsonLdPage(payload: unknown): string {
  return `<html><head>
    <script type="application/ld+json">${JSON.stringify(payload)}</script>
  </head><body><main><p>Cookie banner. Nav. Unrelated content.</p></main></body></html>`;
}

describe("htmlToText", () => {
  it("strips tags, keeps block structure, renders list bullets", () => {
    const text = htmlToText(
      "<p>Intro</p><ul><li>First</li><li>Second</li></ul>",
    );
    expect(text).toContain("Intro");
    expect(text).toContain("• First");
    expect(text).toContain("• Second");
    expect(text).not.toContain("<");
  });

  it("decodes named, decimal, and hex entities", () => {
    expect(htmlToText("React &amp; TypeScript &#8212; senior &#x2764;")).toBe(
      "React & TypeScript — senior ❤",
    );
  });

  it("drops script/style content entirely", () => {
    const text = htmlToText(
      "<style>.a{color:red}</style><script>var x=1;</script><p>Visible</p>",
    );
    expect(text).toBe("Visible");
  });
});

describe("parseJobPostingHtml", () => {
  it("prefers JobPosting JSON-LD and extracts title + company", () => {
    const html = jsonLdPage({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "Junior Frontend Engineer",
      description: LONG_DESCRIPTION_HTML,
      hiringOrganization: { "@type": "Organization", name: "Acme Corp" },
    });

    const result = parseJobPostingHtml(html);
    expect(result.title).toBe("Junior Frontend Engineer");
    expect(result.company).toBe("Acme Corp");
    expect(result.text).toContain("React & TypeScript");
    expect(result.text).toContain("• 1+ years");
  });

  it("finds a JobPosting nested inside @graph", () => {
    const html = jsonLdPage({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", name: "Jobs Board" },
        {
          "@type": "JobPosting",
          title: "QA Engineer",
          description: LONG_DESCRIPTION_HTML,
          hiringOrganization: "Beta Inc",
        },
      ],
    });

    const result = parseJobPostingHtml(html);
    expect(result.title).toBe("QA Engineer");
    expect(result.company).toBe("Beta Inc");
  });

  it("falls back to main-region text when there is no JSON-LD", () => {
    const html = `<html><body>
      <nav>Home | Jobs | About</nav>
      <main>${LONG_DESCRIPTION_HTML}</main>
      <footer>© Acme</footer>
    </body></html>`;

    const result = parseJobPostingHtml(html);
    expect(result.title).toBeNull();
    expect(result.company).toBeNull();
    expect(result.text).toContain("Junior Frontend Engineer");
    // Fallback scoped to <main>: chrome outside it is excluded.
    expect(result.text).not.toContain("Home | Jobs | About");
  });

  it("throws a user-facing error when the page has no real content", () => {
    expect(() =>
      parseJobPostingHtml("<html><body><div id='root'></div></body></html>"),
    ).toThrow(ScrapeError);
  });

  it("cuts trailing EEO/application-form chrome from descriptions", () => {
    const html = jsonLdPage({
      "@type": "JobPosting",
      title: "Junior Frontend Engineer",
      description: `${LONG_DESCRIPTION_HTML}
        <p>We are an Equal Opportunity Employer. All employment decisions are
        made without regard to race, gender, or veteran status.</p>
        <p>Apply for this job</p><p>First Name * Last Name * Select…</p>`,
    });

    const result = parseJobPostingHtml(html);
    expect(result.text).toContain("React & TypeScript");
    expect(result.text).not.toContain("Equal Opportunity");
    expect(result.text).not.toContain("First Name");
  });

  it("survives a malformed JSON-LD block and uses the next one", () => {
    const html = `<html><head>
      <script type="application/ld+json">{not json</script>
      <script type="application/ld+json">${JSON.stringify({
        "@type": "JobPosting",
        title: "Data Analyst",
        description: LONG_DESCRIPTION_HTML,
      })}</script>
    </head><body></body></html>`;

    expect(parseJobPostingHtml(html).title).toBe("Data Analyst");
  });
});

describe("trimJobBoilerplate", () => {
  const body = "Real responsibilities and requirements. ".repeat(20);

  it("cuts from the first trailing marker onward", () => {
    const text = `${body}Equal Opportunity Employer statement. Privacy Notice: we process personal data.`;
    const trimmed = trimJobBoilerplate(text);
    expect(trimmed).not.toContain("Equal Opportunity");
    expect(trimmed).not.toContain("Privacy Notice");
    expect(trimmed).toContain("Real responsibilities");
  });

  it("ignores markers in the front half (values-led postings)", () => {
    const text = `As an equal opportunity employer we hire broadly. ${body}`;
    expect(trimJobBoilerplate(text)).toBe(text);
  });

  it("keeps the original when trimming would leave too little", () => {
    const short = "Short intro. ".repeat(8); // just over the marker floor
    const text = `${short}Apply for this job now with your details please and thank you.`;
    // Cutting here would drop below the minimum; the original survives.
    expect(trimJobBoilerplate(text)).toBe(text);
  });
});
