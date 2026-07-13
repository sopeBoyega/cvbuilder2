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
  - NOT STARTED: insights/analytics, Job Search Pass + Lifetime purchases,
    final landing copy (messaging house), §7 privacy corrections, remaining
    Stitch designs (ATS deep scan, settings profile, integrations, billing).

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
  `https://cvbuilder2-one.vercel.app`, plus the existing Clerk/DB/Gemini vars.
- Webhook URL registered in Paystack:
  `https://cvbuilder2-one.vercel.app/api/webhooks/paystack`.
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
