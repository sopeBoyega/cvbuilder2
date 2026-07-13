# CVBuilder — Rebrand & Repositioning Handoff Note

> **STATUS (2026-07-13, cross-checked against `docs/PROGRESS.md`):**
> - **§4 locked by owner:** ICP = **early-career / new-grad tech** (overrides
>   the career-switchers recommendation); **name stays "CVBuilder"**; promise
>   line **not final** (drafts are provisional); Pass/Lifetime prices TBD.
> - **Already shipped since this note was written:** the free ATS checker
>   (`/tools/ats-checker`, guest SSG) minus email capture; Terms of Use +
>   Cookie Notice (§7's "still missing" is stale — `content/legal/*.md`);
>   pricing page showing Free/Pro/Pass(+Lifetime "at launch"); Pro billing
>   live via Paystack (owner-verified).
> - **In flight:** ATS-checker email capture, PostHog funnel events, landing
>   skeleton rebuild (§6).
> - **Still open:** §7 privacy corrections (categories table all "NO",
>   sensitive-info claim, boilerplate; ALSO: privacy.md §6 names
>   Anthropic/Google/OpenAI as AI providers — reality is Google Gemini only,
>   and cookies.md lists a Meta pixel that isn't run) — owner/counsel to
>   review; final landing copy after the messaging house (§5) is written.

*Companion to `CVBuilder-Project-Handoff` and `CVBuilder-Build-Roadmap`. Self-contained: everything below is enough to resume in a new chat. Written after the post-Phase-2 strategic assessment, which concluded the current positioning is commoditized and a repositioning is required before public launch.*

---

## 1. Why this note exists (the trigger)

The original project handoff locked in a decision: *"the existing landing page stays untouched — it was used only as the source for the visual theme."* That held while the product's promise was generic. It no longer holds.

The strategic assessment found that the current wedge — *"beat the bots / see your ATS score"* — is the baseline every competitor (Jobscan, Teal, Rezi, Resume Worded, and others) already leads with, and that free ChatGPT covers most of the core loop. To be a business rather than a feature, CVBuilder has to reposition around an **outcome + a trust stance, aimed at one ICP**. The moment you do that, the landing page becomes the front door to a promise it currently doesn't make. So the landing page moves from *out-of-scope* to *in-scope*, and this note defines what's changing and how.

**Important:** this is a repositioning and messaging rebrand, **not** a visual teardown. The constellation identity, color system, and typography are genuine assets and stay. What changes is the promise, the audience, the words, and the front door.

---

## 2. What is actually changing — three layers

1. **Positioning (the strategic promise):** from "a resume builder that shows an ATS score" to "the fastest way to a genuinely better, ATS-safe resume for a specific job — without keyword-stuffing yourself into rejection," for a chosen niche.
2. **Marketing (what we say and to whom):** from feature-led and audience-wide to outcome-led, trust-led, and ICP-specific; free ATS checker as the top-of-funnel hero.
3. **Product expectation (what we promise users receive):** the landing promise must match what Phases 0–2 actually deliver — no over-claiming (no "guaranteed interviews," no "deep LinkedIn import"). Promise what's real, then over-deliver.

---

## 3. Old vs. new — the before/after

|
|
 Before (current) 
|
 After (repositioned) 
|
|
---
|
---
|
---
|
|
**
Who it's for
**
|
 Everyone job-hunting 
|
 One ICP (see §4) 
|
|
**
What we sell
**
|
 A resume builder + ATS score 
|
 An outcome: a better, ATS-safe, job-specific resume, fast 
|
|
**
The wedge
**
|
 "Beat the bots" (commodity) 
|
 Outcome + trust ("we won't game you into a worse resume") 
|
|
**
The enemy
**
|
 The ATS 
|
 ATS fear-mongering 
**
and
**
 generic AI output 
|
|
**
Landing page
**
|
 Untouched, theme source only 
|
 In-scope conversion asset; free tool is the hero 
|
|
**
Pricing story
**
|
 Implicit / TBD 
|
 Generous free tier + Pro + one-time "Job Search Pass" 
|
|
**
Proof
**
|
 None 
|
 Score-jump stories + transparent scoring 
|

---

## 4. Decisions the founder must lock BEFORE the rebrand executes

The rebrand can't be written until these are chosen. Recommendations are proposals to confirm or override.

**A. The ICP (pick one to win first).**
- *Recommended — Career switchers / "pivoters."* High anxiety, high willingness to pay, and their core problem — translating experience from one field into another field's language — is exactly what your semantic/embeddings matching is *best* at. It's underserved and it justifies the trust angle ("we make the case for your transferable skills, honestly").
- *Fast-traction alternative — Early-career / new-grad tech.* High application volume, ATS-heavy employers, tool-comfortable, easy to reach in communities. Downside: crowded and sensitive to tech-hiring cycles.
- *Geographic beachhead option — Emerging-market professionals applying to global/remote roles.* Fits your Paystack setup and founder context; underserved by US-centric tools. Riskier as a *primary* wedge but a strong secondary.

**B. The one-line promise.** Draft to confirm: *"A tailored, ATS-ready resume for every job — in under a minute, without gaming yourself into rejection."* Tighten once the ICP is set (the line should name the ICP's real pain).

**C. Pricing model** (from the assessment): generous free tier as the funnel + Pro (~$15–19/mo) + a one-time **Job Search Pass** (~$29–49 for 30–90 days) to capture the subscription-averse job seeker. Optional launch lifetime deal for early cash and reviews.

**D. The name.** Open question, not a forced change. "CVBuilder" says *builder*, but the repositioned value is *tailor + optimize + trust*, and you're explicitly not competing as a from-scratch builder. Renaming pre-launch is costly and risky, so the recommendation is **keep the name, evolve the tagline** — but flag it for a deliberate decision rather than drift.

---

## 5. The new brand narrative (messaging house)

Fill the brackets once §4 is locked; structure holds regardless.

- **Promise (one line):** [the confirmed §4B line].
- **The problem we name:** Job seekers are told an invisible robot rejects them, then sold tools that "fix their score" by stuffing in keywords — which can make the resume *worse* to a human. And generic AI (ChatGPT) spits out bland, samey bullets.
- **Our stance (the wedge):** We make your resume genuinely stronger for a specific job *and* safe to parse — with a transparent score you can see the reasoning behind. We won't trick you into a worse resume to chase a number.
- **Three pillars (proof points):**
  1. *Job-specific, not generic* — tailored to the actual JD, semantic + keyword, live re-scoring.
  2. *Actually ATS-safe* — real selectable-text PDF/DOCX that parsers can read (the thing screenshot-to-PDF and ChatGPT can't reliably do).
  3. *Transparent & honest* — you see the score breakdown; we optimize for a better resume, not a gamed one.
- **Tone:** confident, calm, anti-hype. The category shouts fear ("88% rejected!"). You win by being the trustworthy adult in the room.
- **Visual identity:** unchanged — constellation thread, star-map score ring, green/coral/indigo accents, Space Grotesk / Inter / JetBrains Mono. The score-ring animation is your single most demo-able asset; make it the hero visual.

---

## 6. The landing page — from out-of-scope to in-scope

**Why "untouched" no longer works:** the landing page is where a stranger first meets the promise. A page that still frames CVBuilder as a generic builder will (a) convert poorly against the new funnel, and (b) set the wrong expectation, so even users who sign up feel a mismatch. The front door and the promise must be the same sentence.

**New landing page requirements (for engineering + design):**
- **Hero:** the confirmed promise line + the score-ring visual + a single primary CTA — *"Check your resume free"* (the free ATS checker), not "Sign up."
- **Free ATS checker as the hero funnel:** the public SSG tool (`/tools/ats-checker`) is the top of the page and the top of the funnel; email capture on results.
- **How it works:** 3 steps (paste job → upload resume → get a better, ATS-safe resume), each tied to a real Phase 0–2 capability.
- **Proof:** space for score-jump testimonials (e.g. "54 → 89") and, later, logos/numbers. Ship with placeholders wired, not fake data.
- **Pricing clarity:** show free / Pro / one-time pass plainly; job seekers punish hidden or subscription-only pricing.
- **Trust signals:** a plain-language "what happens to your resume" line (what's sent to AI providers, retention, deletion) linking to the Privacy Policy — because trust is now a pillar (see §7).
- **ICP-specific language:** headline and examples should speak to the chosen ICP, not "everyone."

**What engineers can do now vs. after copy is ready:**
- *Now (no copy needed):* build the free ATS-checker route (SSG) with email capture; stand up the new landing skeleton and section components; wire analytics events (checker-used, email-captured, CTA-clicked).
- *After marketing delivers the messaging house (§5):* drop in hero copy, pillars, and proof; finalize the page.

---

## 7. Trust is now a brand pillar — so the privacy layer has to back it

You've already generated a Privacy Policy (good — that was a launch-blocker). But because you're now *selling trust*, the privacy layer has to be genuinely accurate, or the brand promise collapses on contact. A few things to review with counsel before launch (not legal advice — flags to check):

- **The US "categories collected" table marks everything "NO"**, including *Identifiers* and *Professional/employment-related information* — yet you collect names, emails, and resume content (which is largely employment and education data). This is inaccurate and should be corrected to reflect what you actually process.
- **"We do not process sensitive information"** deserves scrutiny: resumes can contain data that's sensitive in some jurisdictions (nationality, health/disability disclosures, etc.). At minimum, review whether that blanket statement is safe for a resume product.
- **Social-login section references Facebook/X**, but the actual auth stack is Clerk with Google + LinkedIn. Align the copy to reality.
- **Placeholder blanks remain** (e.g. the postal address shows `__________`), and there's leftover generator boilerplate (e.g. "abandoned shopping cart reminders") that doesn't apply.
- **Payment processors** (Stripe + Paystack) are correctly named — Paystack is a smart local/African payment path; keep it.
- **Still missing:** Terms of Use and a Cookie Notice (the policy references a Cookie Notice that may not exist yet). Both should exist before public launch.

The point isn't legal box-ticking — it's coherence. A brand that says "we're the honest, transparent option" cannot ship a privacy page that misstates what it collects.

---

## 8. What stays vs. what evolves (so nobody over-corrects)

- **Stays:** constellation visual system, color/type tokens, the score-ring, the app's core flows, the tech stack, the product name (recommended).
- **Evolves:** the promise, the target audience, all outward-facing copy, the landing page, the pricing story, and the proof/trust surfaces.
- **Do not:** rip up the design system, rename the product in a panic, or add new features as part of the rebrand. This is a positioning and front-door change, not a product rebuild.

---

## 9. Sequencing & ownership (next steps)

1. **Founder/PM:** lock §4 (ICP, promise line, pricing model, name decision). Everything else waits on this.
2. **Founder/PM + marketing:** write the messaging house (§5) from the locked decisions.
3. **Engineering (in parallel, now):** ship the free ATS-checker route + email capture; build the landing skeleton + analytics events.
4. **Design:** adapt hero + score-ring for the landing page within the existing identity; prep the testimonial/proof module.
5. **Engineering (after copy):** assemble the final landing page; add the trust/privacy line.
6. **Founder/PM + counsel:** correct the Privacy Policy inaccuracies; add Terms of Use + Cookie Notice.
7. **Then:** the launch sequence from the strategic assessment (waitlist → beta → Product Hunt) runs on the new positioning.

---

## 10. Open items to confirm in the next chat

- ICP confirmed? (recommended: career switchers)
- Final one-line promise?
- Pricing tiers + the one-time pass price?
- Keep the name "CVBuilder," or explore a rename?
- Who owns landing-page copy — founder, or a hired writer?
- Privacy Policy corrections + Terms of Use + Cookie Notice: who drafts, who reviews?

