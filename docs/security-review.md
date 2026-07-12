# Security review — findings and remediation plan

Full-codebase security audit (auth, server actions, API routes, webhooks, AI
pipeline, file handling, config). Written for agents picking up remediation
work: each finding has a location, an exploit scenario, a concrete fix, and a
prevention rule. Fix in severity order. Re-verify a finding against the current
code before patching — line numbers drift.

**Scope note:** several subsystems are deliberate stubs (`lib/rate-limit`,
`lib/storage`, `lib/email`, `lib/actions/index.ts`, the `/api/ai/*` and Stripe
webhook routes, Inngest — see memory: Inngest is deferred to Phase 3). Stubs
are flagged here where they become dangerous *when implemented*; don't "fix" a
stub by wiring up the feature early.

**What was checked and found clean** (don't re-flag these):

- SQL injection: all queries go through Drizzle's builder; the few `` sql`…` ``
  fragments are constants (`now()`, intervals). No string interpolation of user
  input into SQL.
- Secrets hygiene: `.env.local` is gitignored and has never been committed
  (verified across full git history); no hardcoded keys in tracked files.
- XSS: no `dangerouslySetInnerHTML` / `innerHTML` / `eval` anywhere in
  `app/`, `components/`, `lib/`.
- Export routes (`app/api/resumes/[resumeId]/pdf|docx/route.ts`): correct
  auth → profile → ownership chain, version verified to belong to the resume,
  `Cache-Control: private, no-store`, filename sanitized against header
  injection. Use these routes as the reference pattern for new routes.
- Server actions in `lib/actions/tailor.ts` and most of `application.ts`:
  every id re-checked against the caller's profile in the WHERE clause.
- Clerk webhook verifies signatures via `verifyWebhook` and fails closed.

---

## Findings

### F1 — HIGH · IDOR: `createApplication` links resume versions without an ownership check

**Where:** `lib/actions/application.ts` (~lines 68–77, the `resumeVersionId`
check inside `createApplication`).

**Problem:** every other action scopes lookups with
`eq(x.profileId, profileId)`. This one only checks the resume version *exists*:

```ts
const [owned] = await db
  .select({ id: resumeVersions.id })
  .from(resumeVersions)
  .where(eq(resumeVersions.id, resumeVersionId))   // ← no ownership scoping
  .limit(1);
```

An authenticated attacker who obtains/guesses another user's
`resume_versions.id` (UUIDs leak through logs, referrers, support screenshots)
can attach that foreign version to their own application card. The kanban
query (`app/(app)/applications/page.tsx`, `loadCards`) left-joins the linked
version and already renders its `atsScore`. Today that leaks only the score —
but the application detail page (`app/(app)/applications/[applicationId]/page.tsx`)
is a stub; the moment it renders the linked version's `content`, this becomes
a full cross-tenant resume (PII) disclosure. The bad reference is *stored*, so
the bug is latent in the data, not just in code.

**Fix:** verify ownership by joining through `resumes` to the caller's profile:

```ts
if (resumeVersionId) {
  const [owned] = await db
    .select({ id: resumeVersions.id })
    .from(resumeVersions)
    .innerJoin(resumes, eq(resumes.id, resumeVersions.resumeId))
    .where(
      and(
        eq(resumeVersions.id, resumeVersionId),
        eq(resumes.profileId, profileId),
      ),
    )
    .limit(1);
  if (!owned) return { ok: false, error: "That resume version could not be found." };
}
```

Also write a one-off check (or migration) for existing `applications` rows
whose `resume_version_id` resolves to a resume owned by a different profile;
null them out.

**Prevention:** rule for all agents — *never query a user-owned table by bare
primary key in a request path.* Every lookup must carry the profile scope in
the same WHERE (directly or via join). A regression test that creates two
users and asserts user B cannot link user A's version id would have caught
this.

### F2 — HIGH · No rate limiting; the public ATS checker is an unauthenticated CPU/upload sink

**Where:** `lib/rate-limit/index.ts` (stub: `rateLimitReady = false`);
`lib/actions/public-ats.ts` (`checkAtsMatch`, deliberately unauthenticated).

**Problem:** nothing in the app is rate limited. `checkAtsMatch` accepts a
10 MB PDF/DOCX from anonymous visitors and runs unpdf/mammoth extraction plus
keyword analysis per call. A trivial loop degrades the deployment (serverless
CPU-seconds = cost) — the file's own comment ("worst case is some CPU")
underestimates a deliberate flood. Authenticated AI actions are quota-guarded
(25/day, `lib/ai/usage.ts`) but that's a DB counter with a documented
check-then-act race, and non-AI actions (job creation, saves, exports) have no
throttle at all.

**Fix (in order of value):**

1. Implement `lib/rate-limit` (Upstash Ratelimit or equivalent Redis
   sliding-window; keyless fallback: fixed-window counter in Postgres). Key by
   IP for anonymous, by `profileId` for authenticated.
2. Apply it first to: `checkAtsMatch` (e.g. 5/min/IP), `importResume`, the
   AI-metered actions, and the PDF/DOCX export routes (e.g. 30/min/profile).
3. Keep the existing daily AI quota as the coarse cap; the rate limiter is the
   burst guard. (Note the quota race in `assertWithinQuota` is acknowledged in
   code; an atomic counter closes it — same Redis dependency.)

**Prevention:** any new unauthenticated endpoint or action must ship with a
rate limit in the same PR. Treat "it's just CPU" as a cost bug, not a free pass.

### F3 — MEDIUM · Unbounded text inputs: DB bloat, CPU abuse, and unbounded LLM token spend

**Where:**

- `lib/validation/job.ts` — `JobInput.description` has `min(80)` but **no
  max**; `title` has no max.
- `lib/actions/public-ats.ts` — pasted `resumeText` and `jobDescription` have
  no max length.
- `lib/ai/parse-resume.ts` — `structureResume(rawText)` sends the *entire*
  extracted text to Gemini. A 10 MB DOCX can decompress to tens of MB of text
  (mammoth unzips; the 10 MB cap is on the compressed file). The daily quota
  counts *calls*, not tokens, so one call can be arbitrarily expensive.

**Problem:** multi-megabyte descriptions get stored per row, run through
keyword extraction/scoring on every analysis, and (for imports) become one
giant paid LLM call. `safeEmbed` already truncates at 20k chars
(`MAX_EMBED_CHARS` in `lib/ai/embeddings.ts`) — the same discipline is missing
everywhere else.

**Fix:**

- Add `max` bounds in Zod: `title.max(200)`, `company` already `max(120)`,
  `description.max(20_000)`, and cap pasted text in `checkAtsMatch`
  (e.g. 50k chars, reject or truncate with a notice).
- In `extractTextFromFile` (`lib/documents/extract-text.ts`), cap the
  *extracted* text length (e.g. 100k chars → throw or truncate), independent of
  the input file size.
- In `structureResume`, slice `rawText` (e.g. 30k chars) before the prompt —
  mirror the `MAX_EMBED_CHARS` pattern and name the constant.

**Prevention:** every `z.string()` that reaches the DB or an LLM gets a `max`.
Every byte cap on an upload gets a matching cap on the *decoded/extracted*
output (decompression bombs).

### F4 — MEDIUM · No security headers (CSP, frame-ancestors, HSTS, nosniff)

**Where:** `next.config.ts` (no `headers()`), `proxy.ts` (no header injection).

**Problem:** no Content-Security-Policy, `X-Frame-Options`/`frame-ancestors`
(clickjacking on the signed-in dashboard), `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, or `Strict-Transport-Security`. There's no XSS sink in the
code today, so CSP is defense-in-depth — but this app renders LLM output and
user-imported text, so the day someone adds markdown-with-HTML rendering, CSP
is the difference between a bug and an account-takeover.

**Fix:** this is Next.js **16** — middleware is `proxy.ts` (see
`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` and
`02-guides/content-security-policy.md`; read them before coding, per
AGENTS.md). Two options:

- Static headers via `headers()` in `next.config.ts` for
  HSTS/nosniff/referrer/frame-ancestors, **plus**
- Nonce-based CSP set in `proxy.ts` per the CSP guide, if/when adopting a
  strict CSP (requires dynamic rendering on pages that use the nonce). A
  reasonable interim CSP: `default-src 'self'` with the documented Next.js
  script/style allowances plus `posthog` and `vercel-analytics`/`clerk`
  endpoints in `connect-src`/`script-src` — enumerate from the browser console
  before enforcing; ship as `Content-Security-Policy-Report-Only` first.

**Prevention:** headers belong in config, reviewed whenever a third-party
script (analytics, Clerk, etc.) is added.

### F5 — MEDIUM · No `user.deleted` handling: orphaned PII after account deletion

**Where:** `app/api/webhooks/clerk/route.ts` (handles `user.created` only);
schema stores heavy PII (`resume_versions.content`, `raw_text`, embeddings,
`profiles.email/name`).

**Problem:** when a user deletes their Clerk account, every resume, raw
extracted text, embedding, job, and application stays in Postgres forever,
keyed to a dead `clerk_user_id`. That's a data-retention/GDPR problem and a
breach-blast-radius problem, invisible until someone files a deletion request.

**Fix:** handle `user.deleted` in the webhook: look up the profile by
`clerkUserId` and delete it, relying on FK cascades (verify the drizzle schema
sets `onDelete: 'cascade'` from profiles → resumes/jobs/applications/
ai_generations → resume_versions/analyses; add cascades if missing — check
`lib/db/schema.ts` and generate a migration). Also handle `user.updated` to
keep `profiles.email` in sync. Subscribe the endpoint to those event types in
the Clerk dashboard, or the events never arrive.

**Prevention:** any table storing PII must have a deletion path traceable to
account deletion. New PII columns (like `raw_text`) get a retention answer in
the PR description.

### F6 — LOW (latent) · Stripe webhook stub has no signature verification

**Where:** `app/api/webhooks/stripe/route.ts` — returns `{ received: true }`
unconditionally.

**Problem:** harmless today (no side effects), but it's a loaded footgun: the
first agent who adds billing logic to the existing handler inherits an
unauthenticated endpoint. Anyone could POST a fake `checkout.session.completed`
and grant themselves a paid plan.

**Fix now (cheap):** make the stub fail closed — verify
`stripe-signature` against `STRIPE_WEBHOOK_SECRET` (add to `lib/env.ts` as
optional, assert at point of use, same pattern as the Google key) and return
400 when absent/invalid, *before* any billing logic exists. Alternatively add
a loud comment + return 501 until billing ships.

**Prevention:** webhook handlers must verify signatures in the same commit
that creates the route. The Clerk handler is the in-repo reference.

### F7 — LOW · Raw `error.message` returned to clients

**Where:** `lib/actions/resume.ts` (`importResume` catch), `lib/actions/tailor.ts`
(several catches), `lib/actions/public-ats.ts`.

**Problem:** catches return `error.message` verbatim for *any* thrown error.
Domain errors (`QuotaExceededError`, `UnsupportedFileError`,
`EmptyDocumentError`) are user-friendly by design, but a Gemini SDK failure,
Neon/Postgres error, or Zod internals can surface provider/internal detail
(model ids, table names, request ids) to the browser.

**Fix:** allowlist, don't passthrough — return `error.message` only for the
known error classes; otherwise log server-side and return a generic message:

```ts
const KNOWN = [QuotaExceededError, UnsupportedFileError, EmptyDocumentError];
const msg = KNOWN.some((k) => error instanceof k)
  ? (error as Error).message
  : "Something went wrong. Try again.";
```

**Prevention:** `catch` blocks in actions/routes never forward messages from
errors they didn't define.

### F8 — LOW · API routes are not covered by the auth proxy (per-route auth only)

**Where:** `proxy.ts` — `protectedPrefixes` covers pages only; `/api/*` relies
on each route calling `auth()` itself.

**Problem:** the implemented routes do it correctly, but the pattern is
one-forgotten-line away from an open endpoint — the `/api/ai/*` stubs
currently have **no** auth (harmless static JSON now; not harmless when
implemented).

**Fix:** defense in depth in `proxy.ts` — default-protect `/api` and allowlist
the genuinely public paths:

```ts
const isPublicApi = createRouteMatcher([
  "/api/webhooks(.*)",            // signature-verified, must stay public
  "/api/templates(.*)",           // sample-data preview, deliberately public
  "/api/inngest(.*)",             // Inngest signing covers this when wired (Phase 3)
]);
// in the handler: if (path starts with /api && !isPublicApi) await auth.protect();
```

Keep the in-route `auth()` calls — the proxy is the net, not the ownership
check (the Next.js docs are explicit that proxy is an optimistic layer, not
the authorization system).

**Prevention:** new API routes start from the pdf/docx route as a template
(auth → profile → ownership → scoped query), and the proxy allowlist is the
only place a route becomes public.

### F9 — INFO · Prompt injection surface in the AI pipeline (currently well-contained)

**Where:** `lib/ai/parse-resume.ts`, `lib/ai/draft-answer.ts`,
`lib/ai/gap-questions.ts` — user-controlled resume text / job descriptions are
interpolated into prompts.

**Assessment:** contained today because (a) `generateObject` constrains output
to the `ResumeContent` Zod schema, (b) generated text is rendered as plain
text (no HTML sinks), (c) prompts contain only the *caller's own* data — an
injected instruction can only corrupt the attacker's own output, and (d) the
model has no tools. Keep it that way.

**Prevention rules that keep this INFO and not HIGH:**

- Never put another user's data, secrets, or system context into these prompts.
- If LLM output ever gains a rich-text/markdown-HTML rendering path, sanitize
  it and land F4's CSP first.
- If tools/function-calling are added to any of these calls, treat the resume
  text as hostile input and re-review.

---

## Hardening checklist (the "what to put in place" list)

Work through in order; check off in this file as landed.

- [ ] **F1** Ownership join for `resumeVersionId` in `createApplication` + data
      cleanup + two-user regression test.
- [ ] **F2** Real rate limiter in `lib/rate-limit`; applied to public ATS
      checker, imports, AI actions, exports.
- [ ] **F3** `max` bounds on all user-supplied strings; cap extracted text and
      LLM prompt input length.
- [ ] **F4** Security headers in `next.config.ts`; report-only CSP via
      `proxy.ts`, then enforce.
- [ ] **F5** `user.deleted` (+ `user.updated`) webhook handling; verify FK
      cascades in `lib/db/schema.ts`.
- [ ] **F6** Stripe webhook fails closed until billing ships.
- [ ] **F7** Error-message allowlist in all action catch blocks.
- [ ] **F8** Default-deny `/api` in `proxy.ts` with an explicit public allowlist.
- [ ] CI: `pnpm audit` (or Dependabot/Renovate) so vulnerable transitive deps
      surface automatically; this audit did not evaluate dependency CVEs.
- [ ] CI: secret scanning (gitleaks or GitHub secret scanning) — history is
      clean today; keep it that way mechanically.

## Standing rules for agents working in this repo

1. **Every user-owned row is fetched with its profile scope** — id + profileId
   in one WHERE (or a join that enforces it). No bare-PK lookups in request
   paths. The pdf/docx export routes are the canonical pattern.
2. **Every string that persists or hits an LLM has a max length.** Every
   upload cap has a matching post-extraction cap.
3. **Webhooks verify signatures before any logic** — in the same commit the
   route is created.
4. **New public endpoints ship with a rate limit** in the same PR.
5. **Catch blocks return only messages from error classes we defined.**
6. **PII needs a deletion path** — if you add a column holding user content,
   say how it dies when the account does.
7. **This is Next.js 16** — middleware is `proxy.ts`; read
   `node_modules/next/dist/docs/` before touching auth/headers/routing
   (per AGENTS.md).
