# CVBuilder — Progress & Handoff

> **New chat: read this file end-to-end before doing any work.** It is the
> single source of truth for where the project stands, how to work in this repo,
> and what is currently in flight. Last updated: 2026-07-13.

CVBuilder is an AI resume-tailoring + ATS app. A user pastes a job description,
picks a resume, sees an explainable ATS score, tailors it (AI-assisted), and
exports an ATS-safe PDF/DOCX. There is a detailed build roadmap/PDF the owner
shared; this doc is the running state.

**REPOSITIONING IN PROGRESS — read `docs/rebranding.md`.** The old wedge
("Beat the bots. Land the interview.") is retired as commoditized. New stance:
outcome + trust — a genuinely better, ATS-safe resume for a specific job,
without keyword-stuffing — with transparent scoring. Owner locked (2026-07-13):
**ICP = early-career / new-grad tech**; **name stays "CVBuilder"** (tagline
evolves); final promise line still pending, so landing copy is provisional.

---

## 1. Hard constraints — READ BEFORE WRITING CODE

- **Next.js 16 is NOT the Next you know.** Breaking changes vs training data.
  Middleware is `proxy.ts` (not `middleware.ts`). Read the bundled docs in
  `node_modules/next/dist/docs/` before using any Next API. (This is enforced by
  `AGENTS.md`.)
- **Ground every library API in the installed version.** Clerk 7, Zod 4
  (`z.url()`, `z.email()`, `z.uuid()` — the top-level forms), Drizzle 0.45,
  Vercel AI SDK v7, react-markdown v10. Check `node_modules` types, don't guess.
- **AI provider is Google Gemini, not Claude.** The owner has no Claude API
  credit. `gemini-2.5-flash` for generation, `gemini-embedding-001` (768 dims)
  for embeddings, via `@ai-sdk/google`. Swapping providers is a one-line change
  in `lib/ai/models.ts`.
- **Package manager: pnpm.** OS: Windows (PowerShell primary; a Bash tool exists
  for POSIX). Working dir: `c:\Users\User1\Desktop\cvbuilder2`.
- **The sandbox blocks the npm registry and some HTTPS** (Gemini/Neon/Paystack).
  Installs, `db:migrate`, and `next build` (fetches fonts) need
  `dangerouslyDisableSandbox: true`. Tests/typecheck/lint run sandboxed fine.
- **The safety classifier occasionally has outages** where shell commands are
  refused ("temporarily unavailable"). When that happens, keep writing/reading
  files and retry the shell later — don't get blocked.
- **Migrations are applied directly to Neon** during dev via `pnpm db:migrate`
  (with `dangerouslyDisableSandbox`). Migrations `0000`–`0006` are already
  applied. Always review the generated SQL before applying.
- **Contract-first (Zod everywhere).** Every boundary (form, action, route,
  AI output, env) is a Zod schema in `lib/validation/`; types are `z.infer`.
  Server actions re-verify ownership in the `WHERE` clause — never trust a
  client-supplied id.

## 2. Verify like this

```
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm test             # vitest (70 tests). Pure-logic tests use // @vitest-environment node
pnpm build            # needs dangerouslyDisableSandbox (Google Fonts fetch)
```

Note: the global vitest env is `jsdom`; ATS/logic test files opt into `node` via
a top `// @vitest-environment node` comment (jsdom made them time out).

## 3. Phase status

- **Phase 0 (Foundation): DONE.** Next 16 + TS strict, Tailwind v4 tokens,
  Clerk auth via `proxy.ts`, Neon + Drizzle, Zod env, CI. Clerk webhook mirrors
  users → `profiles` (with an OAuth re-fetch fix).
- **Phase 1 (Core loop): DONE.** Resume import (PDF/DOCX → text → **AI-structured
  `ResumeContent`**), `lib/ats/` deterministic scoring engine, tailoring wizard
  (job → resume → analysis → edit → finalize), editor with live re-score, PDF +
  DOCX export, resume library, template gallery.
- **Phase 2 (AI tailoring): DONE.** AI gap questions + "Draft an answer",
  semantic scoring (pgvector), `ai_generations` usage logging + DB-backed quota,
  stemming accuracy fix. (Inngest/Upstash deliberately skipped — quota is a DB
  counter, not Redis.)
- **Phase 3 (App layer + monetization): IN PROGRESS.**
  - DONE: application tracker (kanban, optimistic Zustand), marketing pages
    (working guest ATS checker, pricing, About), **real legal docs** (privacy/
    terms/cookies rendered from `content/legal/*.md` via react-markdown).
  - DONE: **Paystack Pro subscription — owner verified the full payment loop
    works (2026-07-13).** See §6 for the remaining pricing revert.
  - DONE (2026-07-13): **empty states + loading states** — shared `EmptyState`/
    `ErrorState` (`components/ui/`), `AiLoader` constellation loader (cycling
    status lines; keyframes in `globals.css`), route `loading.tsx` skeletons
    (dashboard, resumes, resume detail, applications, billing), `UpgradePrompt`
    paywall card (`components/billing/upgrade-prompt.tsx`) shown on AI quota
    errors (detected via `lib/ai/quota.ts::isQuotaError` — the message constant
    shared with `QuotaExceededError`), and honest coming-soon states on all stub
    pages (insights, settings/*, application detail, cover letter, interview
    prep). `AppPageHeader` restyled from leftover light-theme zinc to tokens.
  - DONE (2026-07-13): **rebrand engineering, phase 1** (per `docs/rebranding.md` §6):
    - **Landing page rebuilt** — `components/marketing/landing-page.tsx` (client)
      + thin server wrapper `app/(marketing)/page.tsx` (passes Pro price from
      the server-only pricing module). Sections: hero (provisional early-career-
      tech promise + score-ring preview + "Check your resume free" primary CTA)
      → stance → pillars → how-it-works → proof **placeholder** (no fake
      testimonials; mailto ask) → pricing strip → trust/data line (Gemini named,
      links /privacy) → final CTA. Now tokens, not hardcoded hex. The old page's
      over-claims (cover letters / interview prep / Chrome capture as "ready")
      were removed. **All copy is provisional pending the owner's messaging house.**
    - **ATS-checker email capture** — `leads` table (migration `0007`, applied),
      `lib/actions/leads.ts::captureLead` (email-only, lowercased, silent on
      duplicates), capture form on checker results → prefilled `/sign-up`.
    - **PostHog wired** — `lib/analytics.ts` (typed events: `checker_used`,
      `email_captured`, `cta_clicked`; no-ops without key) +
      `AnalyticsProvider` in the root layout. **Owner: set
      `NEXT_PUBLIC_POSTHOG_KEY` (+ optional `NEXT_PUBLIC_POSTHOG_HOST`) in
      `.env.local` and Vercel** — until then events are dropped by design.
    - `BRAND.promise` updated to the provisional §4B line (About page shows it).
  - DONE (2026-07-13): **free-tier enforcement** — the /pricing promises are now
    real code: `assertCanTailor` (3 tailored resumes/calendar month for free,
    `lib/billing/entitlements.ts`, enforced in `saveTailoredResume` with an
    `UpgradePrompt` in the editor via `lib/billing/limits.ts` matchers) and the
    DOCX route now 403s for free users (locked "DOCX · Pro" button in
    `ExportControl`, `isPro` threaded from server pages incl. the wizard).
  - DONE (2026-07-13): **cover letter generator** (Pro) — `cover_letters` table
    (migration `0008`, applied), `lib/ai/cover-letter.ts` (generateText,
    tone/length knobs, grounded-in-resume rules), actions in
    `lib/actions/cover-letters.ts` (generate/regenerate/save, Pro-gated,
    quota-logged as kind `cover_letter`), editor page `/cover-letters/[id]`
    (paper-sheet textarea + tone/length + regenerate, per the owner's Stitch
    design), entry = "Draft a cover letter" on the wizard finalize step
    (UpgradePrompt for free users).
  - DONE (2026-07-13): **interview prep** (Pro) — `interview_preps` table (one
    set per application, upsert on regenerate), `lib/ai/interview-prep.ts`
    (generateObject → `InterviewQuestions`: behavioral/technical/role +
    coaching rationale), action `generateInterviewPrep` (Pro-gated, kind
    `interview_prep`), page `/interview-prep/[applicationId]` (grouped
    expandable cards per the Stitch design), entry = prep icon on each kanban
    card. Owner's design pack: `C:\Users\User1\Downloads\
    stitch_constellation_resume_system` (application detail, deep scan,
    insights, settings etc. still unbuilt — next phase).
  - DONE (2026-07-13): **application detail hub** (`/applications/[id]`, per
    the Stitch design) — header w/ inline status select (reuses
    `moveApplication`), deterministic keyword analysis of the attached version
    vs the job (same `lib/ats` engine), expandable job description (+ original
    posting link), assets panel (resume w/ score ring, cover letters for the
    job), honest journey timeline (recorded moments only), and a notes
    scratchpad (`applications.notes`, migration `0009` applied; saves on blur
    via `updateApplicationNotes`). Kanban card titles now link to it; route
    `loading.tsx` added.
  - DONE (2026-07-13): **insights page** (`/insights`, per the Stitch design,
    honest-data version) — server-computed aggregates only: stat tiles
    (response rate, interview rate, avg ATS score across variants, apps sent
    + this month), application funnel (saved → applied → interview → offer,
    stage-to-stage %, counts derived from current board columns), latest
    tailored scores as single-hue labeled bars. Skipped the mockup's "AI
    Insight" correlation card and trend deltas — no history snapshots exist to
    compute them, and we don't fabricate. Full EmptyState when the tracker is
    empty; route `loading.tsx` added. (Stage-accent palette was run through
    the dataviz validator; identity is carried by row labels, not color.)
  - DONE (2026-07-14): **settings profile page** (per the Stitch design) —
    `profiles` columns `headline` / `target_roles` / `target_industries`
    (migration `0010`, applied), `updateProfile` action (name/email stay
    Clerk-owned and read-only), chip-editor form, and the onboarding step-2
    form now actually saves target role/industry (was fully decorative).
    Typecheck + lint verified.
  - DONE (2026-07-14): **landing page re-skinned onto the owner's
    "Professional Identity Hub" design concept** — resurrected the original
    window/mobile-frame preview components + constellation thread/nodes from
    git history (`5c0589e`) and poured the repositioned copy into them: same
    hero wording + checker-first CTAs, stance section, three FeatureSections
    retitled to the trust pillars (job-specific / ATS-safe / transparent) with
    wizard-step previews (job → upload → score ring), proof placeholder,
    pricing strip, trust line, final CTA. The concept's fabricated stats
    (50% faster / 92% success / 85%) were replaced with real product facts
    ("3 steps", "2 formats", "4 signals"). Footer newsletter is a real
    capture: `leads` source enum extended with "newsletter", wired to
    `captureLead` + PostHog `email_captured`. All CTA tracking retained.
  - DONE (2026-07-14): **settings reworked into one screen with sub-tabs**
    (per the Stitch settings designs) — shared `app/(app)/settings/layout.tsx`
    (header + `SettingsNav` tab rail: Profile / Billing / Integrations /
    Notifications; vertical on desktop, scrollable pills on mobile), each
    sub-page now content-only, `/settings` redirects to `/settings/profile`,
    loading skeletons updated to content-only. The design's "Account" tab was
    skipped (Clerk owns it) and "Targeting" lives inside Profile. Integrations
    stays an honest EmptyState naming the planned connections (LinkedIn sync,
    Drive export, Chrome capture) — the design's "Connected" states are not
    faked. Verified: typecheck, lint, 70/70 tests. `pnpm build` currently
    fails ONLY on next/font Google-font downloads over the owner's flaky
    connection (bounced 16→3 errors across retries; same build passed earlier
    today; Vercel unaffected). If it keeps biting locally, self-hosting the
    three fonts as local .woff2 would remove the build-time network dependency.
  - DONE (2026-07-14): **shell + mobile polish from owner's device testing** —
    (1) desktop sidebar collapses to logo-only (localStorage-persisted via
    `useSyncExternalStore`, same hydration pattern as the wizard store);
    (2) mobile bottom tabs now render from the SAME `APP_NAV` list as the
    sidebar (they had drifted: Home/Tailor/Vault/Profile vs the sidebar's
    Home/Resumes/Templates/Jobs/Analytics); (3) long unbroken strings no
    longer overflow: keyword chips (application detail, editor, checker,
    questions step), job-description body, and job title all use Tailwind v4
    `wrap-anywhere`; ExportControl and the resume-detail toolbar wrap on
    narrow screens; (4) raw Gemini errors ("Failed after 3 attempts.
    AI_APICallError... gemini-2.5-flash") no longer reach the UI —
    `lib/ai/error-message.ts::friendlyAiError` maps provider quota/rate-limit
    noise to one honest sentence and is applied in all AI-backed action
    catches (cover letters, interview prep, gap questions, draft answers).
    NOTE: that error revealed the GEMINI FREE TIER's 20-req/day cap on
    2.5-flash is a real production ceiling — paid Gemini tier (or a smaller
    default model) is now a launch consideration.
  - DONE (2026-07-14): **resume card actions + support page** —
    (1) the library card's dead three-dot menu now works: Rename (dialog,
    `renameResume`) and Delete (confirm dialog spelling out the cascade,
    `deleteResume`; DB cascades cover versions/analyses/letters, application
    cards survive with a nulled resume ref); (2) the hardcoded "Main master
    template" subtitle now shows the resume's actual export template name and
    follows the user's template pick; (3) `/support` page (sidebar Support
    links there): form → `support_requests` table (migration `0011`, applied;
    DB row is source of truth) + best-effort email relay to
    `BRAND.contactEmail` via Resend's REST API **gated on `RESEND_API_KEY`**
    (unset = DB-only; owner must add the key + eventually a verified sender
    domain), works signed-out, prefills the profile email, plus six honest
    FAQs. Verified: typecheck, lint, 70/70 tests.
  - DONE (2026-07-14): **claims audit** (owner adopted The Tech Resume's
    "ATS Myths Busted" stance; hard copy rules now in `docs/rebranding.md`
    §5) — removed every unsubstantiated auto-rejection/screening claim:
    structure flag ("Most ATS reject…" → recruiter framing), landing hero
    ("screened by software" → recruiter's 20-second read), checker headline
    + metadata (recruiter-search framing, "not a robot verdict"), about page
    ("quietly filters out the rest" → search/skim/parse reality), and the
    retired "Beat the bots" slogan that was STILL LIVE on the sign-up page
    (now `BRAND.promise`). Hero ring relabeled "Match score"; landing +
    support FAQ now define the score as our relevance/parseability
    diagnostic, not an ATS's number nor an interview prediction. Parsing
    claims (ATS-safe exports) deliberately retained — they're the defensible
    ones. Owner's split (2026-07-14): ALL marketing/conversion surfaces say
    "match score" (landing, pricing, checker, about); in-app labels keep
    "ATS Score" as shorthand next to the visible breakdown.
  - DONE (2026-07-14): **funnel events expanded + proof section fixed** —
    new PostHog events `checker_page_viewed` (referrer + UTM props, fired via
    `TrackPageEvent` on the checker page) and `resume_uploaded`
    (file_type/size_kb/location; checker + onboarding); `checker_used` now
    carries `duration_ms`. Owner's event plan mapped onto existing names
    where funnels already use them (`checker_used` ≈ score_generated,
    `email_captured` ≈ waitlist_email_submitted); parse_preview /
    email_confirmed / share_card events skipped — those surfaces don't exist.
    The proof section's "tell us your jump" was a mailto: link (silently dead
    without a mail client — the "testimonials not working" bug); now an
    inline form (`TestimonialCta`) writing to `support_requests` with topic
    "testimonial" (accepted by the Zod enum, not shown in the support
    dropdown) + Resend relay when configured.
  - DONE (2026-07-14): **share card (viral loop on the guest checker)** —
    results panel gets "Share my score": native share sheet on mobile,
    clipboard fallback on desktop, `share_card_clicked` event
    ({coverage, method}). The shared URL carries ONLY the three numbers
    (`/tools/ats-checker?s=72&m=9&x=4`, never resume/job text) and unfurls as
    a generated score-card PNG via `/api/og/checker` (ImageResponse; params
    clamped; graceful "?" with no params — rendered + eyeballed, on-brand).
    Checker page: `generateMetadata` sets the OG image + share title for
    shared links, and arrivals see a "someone shared a X/100" banner above
    the tool. `metadataBase` added to root layout (uses NEXT_PUBLIC_APP_URL).
    GOTCHA for future OG work: Satori requires explicit `display: flex` on
    EVERY div with >1 child; missing it surfaces only as a generic "failed to
    pipe response" — the real cause is in the [cause] of the server log.
  - DONE (2026-07-16): **about page rewritten for the stance** — states the
    anti-fear-mongering position outright ("The pitch we refuse to make":
    what recruiting software actually does, knockout questions as the real
    automation), the three commitments (job-specific / ATS-safe with
    testable parsing claims / transparent diagnostic score with explicit
    "not a number any ATS assigns, doesn't predict interviews"), names the
    early-career-tech ICP while welcoming others, and a "What we won't do"
    list (no invented numbers, no gamed scores, no data hoarding). Complies
    with rebranding.md §5 hard copy rules; links to /support (confirmed
    guest-reachable — not in proxy.ts protected prefixes).
  - DONE (2026-07-16), **ENV KEYS NEEDED BEFORE IT DOES ANYTHING**: **Discover
    feed** — a new job-matching surface, not from a Stitch design (built
    directly from the existing design system). Ranks external job listings
    against the user's base resume by semantic similarity, reusing the
    existing embeddings/cosine engine rather than adding a new one.
    - `job_listings` table (migration `0012`, applied): a *shared* cache,
      unlike the private per-user `jobs` table. Unique on (source,
      external_id) for dedup across ingestion runs.
    - `lib/jobs/jsearch.ts`: typed JSearch (RapidAPI) client — aggregates
      Google for Jobs (LinkedIn/Indeed/Glassdoor) without touching any of
      those APIs directly (Indeed's is closed to new publishers, LinkedIn has
      none). Tolerant Zod parsing since it's a third-party shape.
    - `lib/jobs/ingest.ts`: sweeps a curated 8-query set tuned to the locked
      early-career-tech ICP (see `docs/rebranding.md`), upserts, embeds only
      listings still missing one (new + previously-failed). Never throws —
      one bad query or embed is recorded in `errors` and the sweep continues.
    - `GET /api/cron/jobs`: refreshes the cache, gated on `CRON_SECRET`
      (refuses to run at all if unset — never runs open). `vercel.json` cron
      entry fires it every 6 hours (`0 */6 * * *`) — bumped from once/day
      2026-07-24 now that the project is on a **Pro trial (14 days, $20
      credit, started 2026-07-24)**; Hobby's once/day + imprecise-timing cron
      cap no longer applies while the trial is active. **Revisit before the
      trial/credit runs out**: either commit to Pro (this schedule needs it)
      or drop back to `0 4 * * *` before reverting to Hobby, or the cron
      entry will fail to deploy.
    - **FIXED (2026-07-24): the feed was empty from day one, root-caused.**
      Not an env-var problem — `JSEARCH_API_KEY`/`CRON_SECRET` were correctly
      set in Vercel the whole time (confirmed: hitting the live
      `/api/cron/jobs` unauthenticated returned our own `401`, not the
      "not configured" `503`). The real bug: the upstream JSearch API on
      RapidAPI deprecated `/search` in favor of `/search-v2` at some point
      after this was built, which also **changed the response shape**
      (`data.jobs[]` + a cursor, not `data[]` directly) and **dropped
      `job_salary_currency`** in favor of a pre-formatted `job_salary_string`.
      Every single ingestion query had been failing with a gateway-level
      `404 Endpoint '/search' does not exist` since launch — confirmed by
      running `ingestJobListings()` locally against the real API before the
      fix (0 upserted, 8 errors) and after (34 upserted on the first sweep).
      Fixed in `lib/jobs/jsearch.ts`: endpoint → `/search-v2`, Zod response
      schema updated to the nested shape, salary now uses the API's own
      formatted string. Typecheck clean. **Separately confirmed while
      debugging**: `cvbuilder2-one.vercel.app` (referenced in
      `NEXT_PUBLIC_APP_URL`, the Paystack webhook URL, and throughout this
      doc) now 307-redirects to `curriculum-v.vercel.app`, which is the
      actual live app (same Clerk-authenticated deployment) — looks like the
      Vercel project got renamed at some point. **Not yet investigated
      further**: whether Paystack's webhook sender follows that redirect for
      POST deliveries, or just silently fails against the old URL. Worth
      checking before relying on the webhook again.
    - `/discover` (new sidebar + mobile nav item, Compass icon): ranks the
      cached pool (embedded, <14 days old) against the user's most-recently-
      updated base resume's embedding (computed via the same
      `ensureVersionEmbedding` tailor.ts already uses — exported, not
      duplicated), +5 display-score boost when a title matches a
      `target_roles` entry. "Tailor my resume to this" reuses `createJob`
      verbatim (copies the listing into the user's own private `jobs` row)
      then seeds the wizard client-side and jumps to `/tailor/resume` — no
      new mutation action needed. Honest empty states: no base resume yet,
      cache still warming up (no embedded listings), nothing ranked this
      round.
    - ~~Owner action required: set `JSEARCH_API_KEY`/`CRON_SECRET`~~
      CONFIRMED 2026-07-24: both are set in Vercel and always were — the
      empty feed was the `/search-v2` bug above, not missing keys.
    - Verified: typecheck, lint, 70/70 tests. **Production build NOT verified
      this session** — `next/font` failed to resolve `fonts.googleapis.com`
      from this sandbox (DNS flake unrelated to this feature; general
      internet connectivity confirmed fine). Run `pnpm build` once to confirm
      before deploying.
  - DONE (2026-07-16): **pagination** — new `components/ui/pager.tsx`
    (Prev/Next + "Page X of Y", no page-number buttons since these lists run
    tens of pages, not hundreds). Wired into the two real unbounded lists in
    the app:
    - **Resume Library**: 6/page (2 cols × 3 rows), paginating the
      already-filtered/sorted array client-side (search still covers the
      full dataset — only the *rendering* is paginated); page resets on
      search/sort change, clamps on delete rather than needing an effect;
      "New Professional Base" tile stays outside pagination, always visible.
    - **Discover feed**: page.tsx's ranked cutoff raised from top 30 to top
      60 (a quality floor, not a page size — below a threshold, more results
      are just noise); `DiscoverFeed` paginates that array 10/page
      client-side.
    - Kanban board (`/applications`) deliberately NOT paginated — pagination
      breaks drag-and-drop across columns; skipped, not missed. Insights'
      "Latest tailored scores" and the dashboard's "recent resumes" are
      intentionally-capped preview widgets (with a "View All" escape hatch),
      not tables, so left alone.
    - Verified: typecheck, lint, 70/70 tests. Build not reverified this pass
      — same `fonts.googleapis.com` DNS flake as the Discover feature above,
      confirmed unrelated (recurs on a totally different diff); run
      `pnpm build` once before deploying.
  - DONE (2026-07-27): **domain + brand cutover, Discover unblocked, dashboard
    stats, URL scraper.**
    - **cvbuilder.digital is the production domain** (owner bought it via
      Vercel after the project rename broke `cvbuilder2-one.vercel.app` — see
      §6). Legal docs + `BRAND.contactEmail` (`support@cvbuilder.digital`)
      updated. New `cv_avatar` mark everywhere: `app/icon.svg`,
      multi-res `favicon.ico`, new `apple-icon.png`, and `components/shell/
      logo.tsx` now renders `/cv-avatar.svg` (fixed-color badge — no longer
      inherits `currentColor`).
    - **Discover was empty because the Gemini free tier was exhausted** — all
      44 cached listings had NULL embeddings (ingestion itself was fine; the
      prod cron runs). Owner enabled billing ($10). One-off healer script
      `scripts/backfill-embeddings.mjs` (same model/dims/taskType as
      `lib/ai/embeddings.ts`; run with `node --env-file=.env.local …`)
      embedded 44/44. Future cron sweeps self-heal now that the key has quota.
      Cost reality: embeddings ≈ pennies/month; generation ≈ $0.02–0.03 per
      full tailoring session.
    - **Dashboard stat cards are real** (were hardcoded "n/a"/"0", and the
      Resumes card showed the 5-capped list length): Avg ATS Score = same
      aggregate as /insights (tailored+scored variants), Active Apps =
      applied/interviewing/offer count, Resumes = true count(*).
    - **Wizard "From URL" tab now works** — `lib/jobs/scrape.ts` fetches the
      posting server-side (signed-in only; SSRF hostname guard; 10s timeout;
      browser UA), prefers **JobPosting JSON-LD** (Greenhouse/Lever/Workable/
      Ashby/career pages have it for Google for Jobs) → clean description +
      title/company prefill; falls back to main-region text. Bot-walled sites
      (LinkedIn/Indeed) fail with an honest "paste instead" message — pasting
      stays the primary path. Action: `extractJobDescriptionFromUrl`
      (tailor.ts). 8 new parser tests (`tests/jobs/scrape.test.ts`).
    - Verified: typecheck, lint, 78/78 tests. Build still not verifiable in
      this sandbox (fonts.googleapis.com DNS) — Vercel builds are unaffected.
  - DONE (2026-07-28): **keyword-coverage precision fix** — owner's live
    analysis after a From-URL import showed junk keywords ("argentina",
    "personal data", "select", "greenhouse"): page chrome (location fields,
    EEO questionnaire, application form) was landing in descriptions AND the
    extractor let any unknown word rank from one occurrence. Three-part fix:
    (1) `trimJobBoilerplate` in `lib/jobs/scrape.ts` cuts trailing form/legal
    chrome (markers only count in the back half; falls back to the original
    if trimming leaves <200 chars), applied to both JSON-LD and fallback
    paths; (2) unknown *unigrams* now need frequency ≥2 in
    `lib/ats/keywords.ts` (bigrams already did; taxonomy skills still rank
    from one mention); (3) EEO/application-form vocabulary added to
    `lib/ats/stopwords.ts` ("employment", "personal", "select", "gender",
    "veteran", …) — kills "personal data" while keeping "data". 84/84 tests.
    KNOWN REMAINING: ambiguous taxonomy terms ("go" the verb vs Go the
    language, "hiring" in EEO text when not trimmed) can still surface —
    fixing that needs case-aware or context-aware matching, deferred. Jobs
    imported BEFORE this fix keep their noisy saved descriptions;
    re-importing the job cleans them.
  - DONE (2026-07-28): **Discover is Nigeria-first** — the feed was all-US
    because JSearch's `country` param was never sent (defaults to "us").
    Owner's call: NG is the primary market, US secondary.
    - `searchJobs` now always passes `country`; `JobMarket`/
      `PRIMARY_JOB_MARKET` ("ng") exported from `lib/jobs/jsearch.ts`.
    - Query plan (`lib/jobs/ingest.ts`): 7 NG queries (local phrasing —
      "graduate trainee", not "new grad") + 5 US = **12 calls/sweep, 48/day
      at the every-6h cron** (was 32/day) — check the JSearch plan quota.
    - `job_listings.market` column (migration `0013`, applied; existing rows
      correctly default to 'us').
    - Feed ranking is tiered: tier 0 = NG listings OR remote-anywhere
      (reachable from the primary market), tier 1 = onsite abroad; semantic
      score orders within tiers. US onsite still shows, just never above
      reachable work.
    - Verified: typecheck, lint, 84/84 tests; live sweep upserted+embedded
      67 (37 NG-market rows in Neon, e.g. Tezza, Lagos). KNOWN: the NG
      remote query surfaces some aggregator spam ("reputed company…") —
      ranking buries most of it; a quality filter is future work if it
      bothers users.
  - DONE (2026-07-28): **social login parked behind a flag so Clerk can go
    to production.** Everything else is production-grade (domain, Paystack,
    Gemini billing, Discover) — the ONE blocker was Clerk still running as a
    **development instance** (confirmed: OAuth redirects went to
    `clerk.shared.lcl.dev`, Clerk's shared dev callback). A Clerk production
    instance needs your OWN Google/LinkedIn credentials, and Google Cloud
    verification was blocking the owner.
    - `lib/features.ts::SOCIAL_AUTH_ENABLED = false` hides the Google/
      LinkedIn buttons + their divider on both auth pages. Email + password
      (already built and working) needs zero Google Cloud involvement.
    - Nothing deleted: `handleOAuth`, `/sso-callback`, and the icon
      components stay wired. Flip the flag to `true` once the credentials
      are in Clerk's SSO connections.
    - **Do NOT onboard real users on the dev instance**: dev and production
      are separate user databases, so users do NOT migrate. Our `profiles`
      rows key on `clerkUserId` and `subscriptions` hang off `profileId` —
      a paying user created on dev would end up an orphaned profile with an
      unlinked Paystack subscription. Dev instances are also user-capped
      (~100).
    - FYI for when social login returns: the app only requests `openid` /
      `userinfo.email` / `userinfo.profile` — all **non-sensitive** scopes,
      which do NOT require Google's full verification review (that applies
      to sensitive/restricted scopes). If verification is blocking, check
      it's not a consent-screen branding issue instead.
    - Verified: typecheck, lint, 84/84 tests.
  - DONE (2026-07-29): **targeted motion pass + sign-up legal links fix.**
    Owner asked "animations / world-class the design?" — verdict: design
    system is solid; broad animation would hurt (low-end Android ICP), so
    only payoff moments got motion, all CSS/rAF, zero new deps, all behind
    `prefers-reduced-motion` guards:
    - **ScoreRing sweep + count-up** (`components/score-ring/index.tsx`, now
      client): one rAF-driven value animates ring + number together (no
      disagreement, no color flicker — accent keys off the real score).
      Opt-in `animated` prop, ON at the three reveal moments (wizard
      analysis 160px, guest checker 120px, editor live re-score 48px);
      list/grid cards stay static by design.
    - **`components/ui/reveal.tsx`**: fade-up-on-scroll wrapper, fail-safe
      (content starts visible; only hides after mount when genuinely below
      the fold; no-JS/reduced-motion = fully visible; animates once). Wired
      into the landing page's below-fold sections (stance, 3 FeatureSections
      via one wrap, proof, pricing, trust, final CTA). Hero deliberately
      untouched.
    - **Keyword chips stagger** on the wizard job step (tw-animate-css
      `animate-in` + per-index delay, `fill-mode-both` verified present in
      the installed package): new chips pop in as the user types; existing
      chips never re-animate (keyed by term).
    - **Kanban drop-settle**: cards remount on column change, so a 200ms
      `animate-in` on the card doubles as the drop animation.
    - **Sign-up ToS/Privacy links were dead `href="#"`** — now real Links to
      `/terms` and `/privacy`.
    - Verified: typecheck, lint, 84/84 tests. NOT visually verified in a
      browser this session — owner should eyeball: analysis reveal, checker
      result, landing scroll, job-step typing, kanban drag on their device.
  - DONE (2026-07-29): **testimonial display path** — collection existed
    (landing form → `support_requests` topic "testimonial" → inbox relay)
    but nothing could ever be displayed. Now: `content/testimonials.ts` is
    a curated, checked-in array (same pattern as content/legal — no admin
    UI, nothing unreviewed can go live). Proof section renders testimonial
    cards (quote verbatim, attribution, optional before→after score jump)
    the moment the array is non-empty; until then the honest placeholder
    stays. CTA shows in both states. **Owner workflow:** submission arrives
    → reply for explicit permission + preferred attribution → paste quote
    VERBATIM into the array (the section publicly promises "with
    permission, unedited"). Verified: typecheck, lint, 84/84 tests.
  - DONE (2026-07-29): **security hardening pass** per `docs/security-review.md`
    (checklist updated in that file — it is the source of truth). Landed: F1
    IDOR ownership join (+ prod data scan, 0 bad rows), F3 input caps
    (JD 20k, checker paste 50k, extracted text 100k, parse prompt 30k), F4
    static security headers (CSP still open), F5 `user.deleted`/`user.updated`
    webhook handling (**owner: subscribe both events in the Clerk production
    webhook**), F6 Stripe stub fails closed (501), F7 error-message
    allowlists, F8 default-deny `/api` in proxy.ts, and new F10: http(s)-only
    URL validation + `safeHttpUrl` render guard (javascript:-href XSS).
    STILL OPEN: CSP report-only rollout, CI audit/secret-scanning, F1
    regression test. Verified: typecheck, lint (whole repo), 84/84 tests.
  - DONE (2026-07-29): **F2 rate limiting — Upstash** (owner picked Upstash
    over the Postgres fallback). `lib/rate-limit/index.ts` is now real:
    `@upstash/ratelimit` sliding windows, one limiter per surface so a flood
    of one kind can't starve another — checker 5/min/IP (the only anonymous
    action), ai 10/min/profile, export 30/min/profile, scrape 10/min/profile.
    Wired at: `checkAtsMatch`, `assertWithinQuota` (so it covers EVERY metered
    AI call, Pro included — a runaway loop costs money at any tier), both
    export routes (429), and `extractJobDescriptionFromUrl`. `RateLimitError`
    is in the F7 allowlists + `friendlyAiError`, so its message reaches users
    verbatim. **Fails open** on a Redis error and no-ops entirely when the env
    vars are unset (dev/test friction-free) — which means **the owner MUST set
    `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel or prod is
    unthrottled**; a boot warning logs when they're missing.
    NOT verified against a live Redis (no Upstash creds in this sandbox) —
    owner should confirm by hammering the guest checker >5x/min after deploy.
  - DONE (2026-07-29): **ATS deep scan** (`/resumes/[id]/scan`, per the Stitch
    `ats_deep_scan_cvbuilder` mock) — the last unbuilt screen in the design
    pack. Deliberately **job-agnostic**: the wizard's analysis answers "does
    this fit THIS job?", deep scan answers "does this survive being read by a
    machine at all?". That split is why there's no keyword card here.
    - **`lib/ats/extraction.ts` is the genuinely new engine work.** It's the
      first consumer of `resume_versions.raw_text` (retained since Phase 1
      precisely for this): it diffs the source document against the structured
      `ResumeContent` to report extraction coverage + the specific source
      lines that did NOT survive parsing. That's the honest version of the
      mock's "bullet dropped" annotation — we can't detect layout/font
      problems (no original PDF), but we CAN prove what the parser lost.
      GOTCHA: it does NOT use `resumeToText`, which omits email/phone/links
      because they aren't keywords — here they matter most, so it has its own
      flattener. Coverage is a **diagnostic, never scored into the total**:
      headings and page furniture legitimately don't survive, so a scored
      version would punish normal resumes.
    - `toExtractedGroups` + `components/resumes/parse-preview.tsx`: the
      "parse preview" the content strategy names as the key differentiator —
      a terminal-style panel of what the parser extracted, toggling to the
      raw source text, with absent fields shown as a red `null` rather than
      hidden.
    - Score ring = `analyzeResume({ content })` with no job (structure +
      formatting renormalized) — reuses the existing baseline, no second
      scoring path. Structure/Formatting cards reuse the existing lints.
    - Free, not Pro-gated (nothing on /pricing promises it, and "we show our
      work" is the trust pillar). Entry: "Deep scan" button on the resume
      detail toolbar. Honest footer names what it can't check.
    - Verified: typecheck, lint, 93/93 tests (9 new).
    - **FIXED same day after the owner scanned a real resume** — two display
      bugs, both in `toExtractedGroups`/`ParsePreview`, not the parser (it had
      correctly extracted all content):
      1. **Bullets showed `"5 found"` instead of the text.** A summary makes it
         impossible to verify a bullet survived, which is the whole point. Now
         every bullet is its own verbatim row (`0.bullets[0]`, …). Guarded by a
         test asserting no field value ends in "found".
      2. **`certifications` was never emitted at all** — a resume with 5 showed
         none. Also added: work `location`, education `dates`/`degree` split,
         project `description`+bullets, and `projects`/`certifications` now
         always render (as an explicit null row when empty, per the show-absence
         principle).
      3. **Long values forced horizontal page scroll.** The structured view was
         a `<pre>`, whose `white-space: pre` blocks wrapping — a long summary
         overflowed the viewport. Now a `div` (indentation via padding, not
         literal spaces) with `flex` rows: `shrink-0` label + `min-w-0
         wrap-anywhere` value, and `overflow-x-hidden` as a guard. Panel also
         taller on desktop (`lg:max-h-[46rem]`) now that content is complete.
      97/97 tests. Still not eyeballed in a browser by the assistant.
  - DONE (2026-07-30): **real sidebar identity block, replacing the "temp"
    top-header sign-out.** Owner flagged the header's sign-out button (its own
    `title` literally said "(temp)") and asked for a proper one in the
    sidebar with an avatar + username.
    - `components/shell/user-avatar.tsx`: real uploaded photo when Clerk has
      one (`user.hasImage`); otherwise a generated initials badge, colored by
      hashing the **Clerk user id** (stable across sessions/devices, not
      re-rolled per render) into the same 4 accent hexes as `globals.css`
      (green/indigo/coral/blue). No new dependency — matters right now
      because social login is OFF (`lib/features.ts`), so nearly every user
      is an email/password sign-up with no OAuth-sourced photo; relying on
      Clerk's own `imageUrl` alone would mean most users show the same
      generic gray icon.
    - Sidebar footer (`app/(app)/layout.tsx`): avatar + `user.username` (the
      sign-up form collects one, so it's populated for every user) linking to
      `/settings/profile`, plus a real sign-out button beside it. Collapsed
      sidebar shows avatar only, centered.
    - **Deliberately did NOT remove the header's sign-out entirely** — it's
      now `md:hidden`. The sidebar is `hidden md:flex` (desktop-only); mobile
      has no sidebar, so if the header button were deleted outright, mobile
      users would have had no way to sign out at all. Header keeps it as
      mobile's only path; desktop now uses the sidebar exclusively.
    - Verified: typecheck, lint, 97/97 tests. NOT visually checked in a
      browser — worth a look at both the expanded and collapsed sidebar
      states, and on mobile width, before calling it done.
  - NOT STARTED: Job Search Pass + Lifetime purchases, final landing copy
    (messaging house), §7 privacy corrections.

## 4. Architecture map

```
app/(marketing)/   landing, pricing, about, privacy/terms/cookies, tools/ats-checker
app/(auth)/        sign-in, sign-up, reset, sso-callback  (Clerk, legacy hooks)
app/(onboarding)/  onboarding (choose start) + onboarding/profile
app/(app)/         dashboard, resumes[/id][/edit], templates, tailor/[[...step]],
                   applications, settings/(profile|billing|…), insights (stub)
app/api/webhooks/  clerk, stripe(stub), paystack
lib/ats/           deterministic engine: text, stemming, stopwords, taxonomy,
                   keywords, structure, formatting, score  (26 unit tests)
lib/ai/            models, parse-resume, gap-questions, draft-answer, embeddings, usage
lib/billing/       paystack (REST client), pricing (currency-keyed), entitlements
lib/documents/     extract-text (unpdf/mammoth), pdf/ (react-pdf templates), docx/
lib/actions/       resume, tailor, application, billing  (server actions)
lib/stores/        wizard, kanban  (Zustand, Zod-validated persist)
lib/validation/    resume, job, ats, application, entitlements, wizard  (contracts)
```

Design tokens live in `app/globals.css` (Tailwind v4 `@theme`). Use tokens
(`bg-surface`, `text-on-surface-variant`, `text-primary`, `coral-hi`, `indigo-hi`,
`destructive` — note **there is no `danger` utility**). Icons: `lucide-react`.
Brand strings: `lib/brand.ts` (`BRAND.name` = "CVBuilder").

## 5. Data model (Neon Postgres, Drizzle — `lib/db/schema.ts`)

`profiles` · `resumes` · `resume_versions` (content jsonb, raw_text, ats_score,
embedding vector(768), tailored_for_job_id) · `jobs` (embedding vector(768)) ·
`analyses` · `ai_generations` (quota/usage) · `applications` (kanban) ·
`subscriptions` (Paystack: plan/source/status/currency/codes/current_period_end).

`profiles` has **no `plan` column** — Pro is resolved from `subscriptions` via
`lib/billing/entitlements.ts::getEntitlements()`/`isPro()`.

## 6. Paystack Pro subscription — DONE (owner verified payments work, 2026-07-13)

> Kept for reference. **Still outstanding: revert the ₦1,000 test price**
> (see the bullet in the flow notes below and §7). Do not commit/push/PR
> without being asked — the owner handles version control.

**Goal:** paid Pro tier via Paystack. Currency **NGN now**, code is
**multi-currency-ready** (see `lib/billing/pricing.ts` — geo seam + per-currency
plan codes; add USD later = enable on Paystack + create Plan + add a row).
Only **Pro subscription** is being wired first (Pass/Lifetime later; the schema
already supports them via `source`/`current_period_end`).

**Flow:** `/settings/billing` → `startProCheckout()` (`lib/actions/billing.ts`)
fetches the plan (`fetchPlan`) so amount+currency come straight from Paystack
(this fixed an "invalid amount" error), initializes a transaction with the plan
code, returns the hosted `authorization_url`; client redirects. After payment the
user returns to `/settings/billing?checkout=complete`, where `ActivationPoller`
refreshes until the webhook lands. **The webhook — not the callback — grants Pro.**

**CURRENT BUG being chased:** after a successful test payment, the webhook
returns **200 but no `subscriptions` row is written** and the user never becomes
Pro. Diagnosis: events arrive + handler runs cleanly, so either the granting
event isn't among those received, or the profile match failed silently.

**Fix just applied to `app/api/webhooks/paystack/route.ts` (needs deploy + retest):**
- Grant Pro from **`charge.success` using `metadata.profileId`** (we set that at
  checkout — 100% reliable, no email guessing). Provisional 31-day period end.
- `subscription.create` still matched by email, now **case-insensitive**
  (`lower(email)`), and carries the real subscription code + next_payment_date.
- Both paths reconcile onto **one row** via `grantPro()` (by sub code, else the
  profile's latest live subscription row).
- **Added `console.log` on every event + decision** so the next test's Vercel
  logs reveal exactly which events arrive and why a write is/ isn't happening.

**What the owner must do next (they test on the LIVE Vercel deploy):**
1. **Redeploy** so the new webhook code is live.
2. Do a test upgrade (`/settings/billing` → Upgrade → pay).
3. Read **Vercel → Logs** filtered to `/api/webhooks/paystack` — the `[paystack]`
   lines show which events fired (`charge.success`, `subscription.create`, …) and
   whether a profile matched. Paste those back to diagnose further if still broken.
4. Check the `subscriptions` table in Neon for a new row.

**Environment / gotchas:**
- `.env.local` (and **Vercel env**) need: `PAYSTACK_SECRET_KEY`,
  `PAYSTACK_PLAN_PRO_NGN` (currently `PLN_a5ahcuac4elowvj` — the owner changed the
  plan code once; confirm it's current), `NEXT_PUBLIC_APP_URL` =
  `https://cvbuilder.digital`, plus the existing Clerk/DB/Gemini vars.
- Webhook URL registered in Paystack:
  `https://cvbuilder.digital/api/webhooks/paystack`.
- **2026-07-27 domain migration:** the Vercel project was renamed at some point
  after 2026-07-13, so `https://cvbuilder2-one.vercel.app` (the domain the
  webhook + `NEXT_PUBLIC_APP_URL` were pointed at) now 307-redirects to
  `https://curriculum-v.vercel.app`. Webhook senders (Paystack included, by
  strong industry convention — Stripe documents this explicitly) do **not**
  follow redirects on POST, so any webhook fired at the old URL almost
  certainly failed silently as soon as the rename took effect. Owner bought
  **`cvbuilder.digital`** as the permanent custom domain to stop chasing
  Vercel's auto-generated project aliases. Legal docs (`content/legal/*.md`)
  updated to the new domain. **Still needs owner action:** add
  `cvbuilder.digital` as the Production Domain in Vercel, update
  `NEXT_PUBLIC_APP_URL` in Vercel env, update the webhook URL in the Paystack
  dashboard, and check Clerk's allowed origins — see chat for full steps.
- **Test vs live mode:** a Paystack plan only exists in the mode its key belongs
  to. `sk_test_…` key ⇒ create the plan in **Test mode** and pay with test card
  `4084 0840 8408 4081`, any future expiry/CVV, OTP `123456`. Mode mismatch ⇒
  `fetchPlan` returns "plan not found".
- **Webhooks only reach the deployed URL**, not localhost — so full end-to-end
  (payment → Pro flips on) must be tested on Vercel (or via a tunnel).
- **TEST PRICING IS ACTIVE:** `lib/billing/pricing.ts` NGN is set to **₦1,000**
  for testing. **Revert to ₦25,000** (`amountMinor: 2_500_000`, `display: "₦25,000"`)
  and point the plan code back to the real ₦25,000 plan once the flow is verified.

Once Pro is confirmed active, `isPro()` gates the AI quota
(`lib/ai/usage.ts::assertWithinQuota` bypasses the free daily cap for Pro).

## 7. Known issues / TODO backlog

- ~~[billing] test price revert~~ DONE 2026-07-13: real ₦25,000 price + plan
  live and owner-verified.
- **AI paths never verified against the live API by the assistant** (no key in
  sandbox, can't drive a browser). `safeEmbed` logs failures (a NaN-token insert
  bug in `ai_generations` was fixed). Owner should do one real end-to-end run:
  import PDF → analysis (semantic bar shows a number) → AI questions → edit →
  export PDF+DOCX; confirm `ai_generations` rows appear.
- **Onboarding step 2 (`/onboarding/profile`) discards** target role/industry/
  experience — no columns, no action. Wire when needed.
- **"Start from scratch"** onboarding path does nothing (`emptyResumeContent()`
  exists, unused).
- **Editor** can't edit education/projects/certifications yet (preserved on save).
- **Stripe** webhook route is a stub; Stripe is named in legal docs but Paystack
  is the active processor. Contact email in docs/brand: `contact.cvbuilder@gmail.com`.
- ~~PostHog key~~ DONE 2026-07-13: key set in env + Vercel, events verified
  arriving; owner built the funnel insight in PostHog.
- ~~[pricing] unreal Pro bullets~~ RESOLVED 2026-07-13: "Priority processing"
  and "all templates" removed from /pricing at owner's direction; every
  remaining Pro bullet is enforced in code ("Cover letters & interview prep"
  built + Pro-gated same day).
- ~~cover letter / interview prep live test~~ DONE 2026-07-13: owner verified
  both flows end-to-end against the live Gemini API, and the free-tier gates
  (monthly tailor cap UpgradePrompt, locked DOCX button) behave as designed.
- **[rebrand] Privacy corrections for counsel** (`docs/rebranding.md` §7 + new
  findings): categories table all "NO", blanket "no sensitive info", AI
  providers listed as Anthropic/Google/OpenAI (reality: Gemini only), Meta
  pixel row in cookies.md, "abandoned shopping cart" boilerplate.
- **[rebrand] Final landing copy** waits on the messaging house; current hero/
  section copy is a provisional draft for the early-career-tech ICP.
- Insights/analytics, cover letters, interview prep = later Phase 3/4.

## 8. Owner working style

Decisive; wants honest trade-offs and the "act as a stakeholder" framing; dislikes
fabricated/dummy data (empty states must be real). Prefers being told exactly what
to set up (keys, dashboards) with clear steps. Verify with typecheck/lint/build/test
before declaring done, and state plainly what was NOT verified.
