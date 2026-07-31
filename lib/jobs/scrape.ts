import { z } from "zod";

import { MAX_JD_LENGTH } from "@/lib/validation/job";

/**
 * Fetch + extract a job description from a posting URL.
 *
 * Strategy, in order of trust:
 *  1. schema.org `JobPosting` JSON-LD — most public job boards (Greenhouse,
 *     Lever, Workable, Ashby, company career pages) embed it because Google
 *     for Jobs requires it. Gives us clean description + title + company.
 *  2. Visible-text fallback from `<main>`/`<article>`/`<body>` — noisier, but
 *     workable for pages without structured data.
 *
 * Sites that render the posting only client-side or sit behind auth/bot walls
 * (LinkedIn, Indeed) will fail here; the error message tells the user to paste
 * instead, which stays the primary path.
 */

const FETCH_TIMEOUT_MS = 10_000;
/** Enough for any real posting page; keeps a pathological response bounded. */
const MAX_HTML_CHARS = 2_000_000;
/** Below this the fallback almost certainly grabbed nav/cookie-banner scraps. */
const MIN_EXTRACTED_CHARS = 200;

export type ScrapedJobPosting = {
  text: string;
  title: string | null;
  company: string | null;
};

/** Thrown for every user-facing failure; message is safe to show verbatim. */
export class ScrapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScrapeError";
  }
}

const PASTE_INSTEAD = "Copy the description from the page and paste it instead.";

/* ------------------------------------------------------------------ */
/* URL guard                                                           */
/* ------------------------------------------------------------------ */

/**
 * This action makes the server fetch an arbitrary URL, so refuse anything
 * that could point at internal infrastructure. Hostname-level checks only —
 * full DNS-rebinding protection isn't worth the complexity for this feature.
 */
function assertPublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ScrapeError("That doesn't look like a valid URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ScrapeError("Only http(s) links are supported.");
  }

  const host = url.hostname.toLowerCase();
  const isPrivateIpv4 =
    /^(127|10)\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === "0.0.0.0";
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.includes(":") || // IPv6 literal
    isPrivateIpv4
  ) {
    throw new ScrapeError("That address can't be fetched.");
  }

  return url;
}

/* ------------------------------------------------------------------ */
/* HTML → text                                                         */
/* ------------------------------------------------------------------ */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  bull: "•",
  middot: "·",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(parseInt(dec, 10)),
    )
    .replace(
      /&([a-z]+);/gi,
      (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match,
    );
}

/** Strip tags while preserving the block structure a JD's formatting relies on. */
export function htmlToText(html: string): string {
  const structured = html
    .replace(/<(script|style|noscript|template|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|ul|ol|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(structured)
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ------------------------------------------------------------------ */
/* JSON-LD JobPosting                                                  */
/* ------------------------------------------------------------------ */

/** Tolerant shape — third-party structured data drifts and over-nests. */
const JobPostingLd = z.object({
  "@type": z.union([z.string(), z.array(z.string())]),
  title: z.string().optional(),
  description: z.string().optional(),
  hiringOrganization: z
    .union([z.object({ name: z.string().optional() }), z.string()])
    .optional(),
});
type JobPostingLd = z.infer<typeof JobPostingLd>;

function isJobPosting(node: unknown): node is JobPostingLd {
  const parsed = JobPostingLd.safeParse(node);
  if (!parsed.success) return false;
  const type = parsed.data["@type"];
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => t.toLowerCase() === "jobposting");
}

/** Depth-first search through JSON-LD (arrays, @graph nesting) for a JobPosting. */
function findJobPostingNode(node: unknown, depth = 0): JobPostingLd | null {
  if (depth > 4 || node === null || typeof node !== "object") return null;
  if (isJobPosting(node)) return JobPostingLd.parse(node);

  const children = Array.isArray(node)
    ? node
    : Object.values(node as Record<string, unknown>).filter(
        (value) => typeof value === "object",
      );
  for (const child of children) {
    const found = findJobPostingNode(child, depth + 1);
    if (found) return found;
  }
  return null;
}

function extractJsonLdJobPosting(html: string): JobPostingLd | null {
  const scripts = html.matchAll(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const match of scripts) {
    try {
      const found = findJobPostingNode(JSON.parse(match[1].trim()));
      if (found) return found;
    } catch {
      // Malformed block — common in the wild; keep scanning the rest.
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Boilerplate trim                                                    */
/* ------------------------------------------------------------------ */

/**
 * Section markers that reliably start the *tail* of a posting page: the
 * application form, EEO questionnaire, and legal notices. Everything from the
 * first such marker onward is chrome, not job description.
 */
const TRAILING_BOILERPLATE_MARKERS: RegExp[] = [
  /apply for this (job|position|role)/gi,
  /equal (employment )?opportunity/gi,
  /e-?verify/gi,
  /voluntary self-?identification/gi,
  /how did you hear about/gi,
  /privacy (notice|policy)/gi,
  /reasonable accommodation/gi,
  /background checks?/gi,
  /powered by\s+\w+/gi, // "Powered by Greenhouse/Lever/…"
  /autofill with resume/gi,
  /(first|last) name\s*[*✱]?\s*$/gim, // application-form field labels
];

/**
 * Drop trailing form/legal chrome. Only matches in the back half of the text
 * count as "trailing" — a JD that leads with a values/EEO statement isn't
 * gutted — and if trimming leaves too little, the original is kept (better a
 * noisy description than a destroyed one).
 */
export function trimJobBoilerplate(text: string): string {
  const floor = Math.floor(text.length / 2);
  let cut = text.length;
  for (const marker of TRAILING_BOILERPLATE_MARKERS) {
    for (const match of text.matchAll(marker)) {
      if (match.index >= floor && match.index < cut) cut = match.index;
    }
  }
  if (cut === text.length) return text;
  const trimmed = text.slice(0, cut).trim();
  return trimmed.length >= MIN_EXTRACTED_CHARS ? trimmed : text;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

/** Pure HTML → posting extraction; separated from fetching for testability. */
export function parseJobPostingHtml(html: string): ScrapedJobPosting {
  const ld = extractJsonLdJobPosting(html);
  if (ld?.description) {
    const text = htmlToText(ld.description);
    if (text.length >= MIN_EXTRACTED_CHARS) {
      const org = ld.hiringOrganization;
      return {
        // JSON-LD descriptions still carry EEO/privacy tails on most boards.
        // Capped so the result always fits JobInput's description max.
        text: trimJobBoilerplate(text).slice(0, MAX_JD_LENGTH),
        title: ld.title?.trim() || null,
        company:
          (typeof org === "string" ? org : org?.name)?.trim() || null,
      };
    }
  }

  // Fallback: the page's main readable region. No title/company — guessing
  // them from <title> tags produces junk like "Job – Board Name | Careers".
  const region =
    html.match(/<main[\s\S]*?<\/main>/i)?.[0] ??
    html.match(/<article[\s\S]*?<\/article>/i)?.[0] ??
    html.match(/<body[\s\S]*?<\/body>/i)?.[0] ??
    html;
  const text = htmlToText(region);
  if (text.length < MIN_EXTRACTED_CHARS) {
    throw new ScrapeError(
      `We couldn't find a job description on that page. It may load its content with JavaScript. ${PASTE_INSTEAD}`,
    );
  }
  return {
    text: trimJobBoilerplate(text).slice(0, MAX_JD_LENGTH),
    title: null,
    company: null,
  };
}

export async function fetchJobPostingFromUrl(
  rawUrl: string,
): Promise<ScrapedJobPosting> {
  const url = assertPublicHttpUrl(rawUrl);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        // A plain fetch UA gets instantly bounced by most job boards.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new ScrapeError(
      `We couldn't reach that page (it may be slow or blocking us). ${PASTE_INSTEAD}`,
    );
  }

  if (!response.ok) {
    // 403/999-style bot walls are the common case, not the exception.
    throw new ScrapeError(
      response.status === 404
        ? "That page wasn't found. Check the link."
        : `That site blocks automated fetching (HTTP ${response.status}). ${PASTE_INSTEAD}`,
    );
  }

  const html = (await response.text()).slice(0, MAX_HTML_CHARS);
  return parseJobPostingHtml(html);
}
