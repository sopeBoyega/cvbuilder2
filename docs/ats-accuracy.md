# ATS accuracy backlog

Known gaps between what `lib/ats/` measures today and what "Beat the bots. Land
the interview." promises. Ordered by accuracy payoff per unit of effort.

Today's engine is fully deterministic — no AI touches scoring. Signals:
`keyword` (0.35), `semantic` (0.30, **not implemented**), `formatting` (0.20),
`structure` (0.15). Absent signals renormalize so the weights always sum to 1
(`lib/ats/score.ts`).

---

## 1. No stemming or lemmatization — **highest payoff, lowest effort**

`manage`, `managing`, `managed`, `management` are four distinct tokens. A JD
asking for `management` against a resume that says `managed` reports a **false
missing keyword**. This is the single largest source of wrong output today.

- Fix: light Porter/Snowball stemmer applied identically to JD terms and the
  resume token index, before comparison.
- Careful: must not stem inside the taxonomy (`c++`, `node.js`, `ci/cd`), and
  must not collapse meaningfully different terms (`architecture` vs `architect`
  is arguably fine; `manager` vs `management` is fine; `lead` vs `leading` is
  fine).
- Keep the *display* term unstemmed — users must see "management", not "manag".

## 2. Binary presence, not prominence

A keyword in the skills list counts exactly as much as one demonstrated across
three roles and the summary. Real ATS rank by frequency and section weight.

- Fix: weight a match by where it appears (summary/work bullets > skills list)
  and how often, capped so keyword stuffing doesn't win.

## 3. Taxonomy is a hand-written starter set

`lib/ats/taxonomy.ts` holds ~150 curated skills, heavily tech/product biased.
A genuine skill outside it ranks below *every* known skill (strict tier) and can
fall out of the top 25 entirely. Nursing, law, logistics, trades: barely covered.

- Fix: import an O*NET or ESCO skills list, keep the curated set as an override.
- Until then, the strict tier is doing more harm in non-tech domains than good.

## 4. No semantic matching (the missing 30%)

"Led a team of 8" does not match `leadership`. "Shipped to 10M users" does not
match `scale`. Paraphrase is invisible to us.

- Fix: Phase 2 — embed JD and resume, cosine similarity via pgvector. The weight
  slot already exists and renormalizes in automatically.

## 5. Formatting linting can't see the layout

The ATS-hostile patterns that actually break real parsers — multi-column
layouts, tables, text in headers/footers, uncommon fonts, images carrying text —
are properties of the **source document**, and that layout is destroyed once
text is structured into `ResumeContent`.

- We now retain `resume_versions.raw_text`, so this is recoverable.
- Fix: run layout heuristics over the raw extracted text (and/or PDF text-item
  coordinates from `unpdf`'s `extractTextItems`, which exposes x/y per span —
  column detection is very doable from that).
- `lib/ats/formatting.ts` currently checks only bullet length, ALL-CAPS,
  bullet count and skill dilution. It says so in its own docblock.

## 6. Bigrams only

`machine learning` is caught; `continuous integration pipeline` and
`applicant tracking system` are not. Trigrams for known phrases only would be
cheap.

## 7. Weights are uncalibrated

`35/30/20/15` is the build doc's opening guess. Its own words: *"tune with real
data."* Nothing has been validated against actual ATS behavior. Until then the
number is *internally consistent*, not *externally accurate* — which is exactly
why the UI always shows the breakdown, never the bare score.

## 8. Keyword extraction ignores JD structure

Requirements sections, "must have" vs "nice to have", and years-of-experience
qualifiers are all flattened into one bag of words. A "nice to have" keyword
costs the same as a hard requirement.

---

## Non-goals (deliberately)

- Scoring is deterministic and must stay that way. It runs on every keystroke in
  the editor and must never consume LLM quota.
- No scraping job boards for descriptions (ToS + they block it). Paste is the
  primary path.
