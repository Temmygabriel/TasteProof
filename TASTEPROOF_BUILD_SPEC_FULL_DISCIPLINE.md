# TASTEPROOF — FULL HACKATHON BUILD SPECIFICATION
## Qloo Agentic Hackathon 2026

**Status:** BUILD SPEC — DESIGN + PRODUCT + ENGINEERING LOCK  
**Product:** TasteProof  
**Hackathon:** Qloo Agentic Hackathon 2026  
**Primary goal:** Build a real, judgeable product that uses Qloo as a load-bearing cultural-intelligence layer, not as a decorative API integration.

---

# 00. EXECUTIVE LOCK

## Product contract

> **TasteProof is a QA tool for AI agents that tests whether their recommendations actually match a supplied taste context, using Qloo as an external cultural-intelligence signal.**

Short positioning:

> **A taste QA layer for AI agents.**

Core mechanism:

```text
AGENT RECOMMENDATION
        ↓
TASTE CONTEXT
        ↓
QLOO ENTITY RESOLUTION
        ↓
QLOO-DERIVED TASTE SIGNAL
        ↓
DETERMINISTIC EVALUATION
        ↓
PASS / REVIEW / FAIL
        ↓
EVIDENCE
```

Signature interaction:

```text
CHANGE ONE TASTE ANCHOR
        ↓
RERUN THE TEST
        ↓
COMPARE THE NEW RESULT WITH THE PREVIOUS RESULT
```

The product is **not**:

- a generic recommendation chatbot;
- a hotel recommender;
- a Qloo demo;
- an LLM wrapper;
- a generic AI evaluation dashboard;
- a fake “taste score” generator;
- a blockchain/Web3 application;
- a product that claims Qloo proves what a person will like.

The product **is**:

> A visible testing instrument for checking whether an AI recommendation is culturally/taste-consistent with the context supplied to it.

---

# 01. HACKATHON FORENSICS — VERIFIED BASELINE

## Current official event facts

The official Qloo Agentic Hackathon rules currently state:

- Submission deadline: **October 30, 2026 at 11:45 PM EDT**.
- The event is online.
- The hackathon requires a working software application integrating the Qloo API.
- The project must either:
  - function as an agentic tool;
  - be built using an agent framework; or
  - integrate Qloo into an existing agent.
- A functional external demo is required.
- A public source repository is required.
- The public repository must contain an open-source license.
- The project must be available free of charge for judging/testing.
- The official judging criteria are:
  1. Technological Implementation
  2. Design
  3. Potential Impact
  4. Quality of the Idea
- Current listed prizes are:
  - 1st: $15,000
  - 2nd: $6,000
  - 3rd: $4,000
- A demo video is not required by the current official rules; judges need access to the working project.

**Source authority:** official Qloo Agentic Hackathon Devpost rules and current event page.

## Important implementation verification rule

The hackathon rules confirm that Qloo API access is supplied through the official developer-key process.

However:

> **Do not treat this build spec as authoritative for exact Qloo endpoint names, request parameters, response fields, authentication headers, or current API versions.**

Before writing the Qloo client, the coding agent MUST verify the current official Qloo documentation and the hackathon developer guide.

If the current API differs from this specification:

1. use the official documentation as the technical source of truth;
2. do not guess endpoint parameters;
3. do not fabricate fields;
4. adapt the implementation while preserving the product mechanism;
5. document any limitation that affects the product.

---

# 02. WHY THIS IDEA WAS SELECTED

## Strategic target

The winning strategy is not:

> Find an uncrowded category.

The strategy is:

> Find a recognizable product category where the sponsor technology creates a capability that would be materially weaker or impossible without it.

TasteProof was selected because it creates a direct relationship between:

```text
AI agents
+
recommendations
+
cultural taste
+
Qloo's cultural intelligence
+
a visible evaluation workflow
```

The product is understandable without knowing Qloo.

That is important.

A judge should first understand:

> “This checks whether an AI recommendation actually fits the taste it was supposed to understand.”

Then the judge discovers:

> “The taste evaluation is grounded in Qloo.”

Then:

> “The result is not just a chatbot opinion; there is a visible evidence path.”

---

# 03. IDEA-SELECTION SCORECARD

The internal 100-point selection model is:

| Dimension | Weight |
|---|---:|
| Problem / value clarity | 15 |
| Product recognizability | 10 |
| Sponsor-native wedge | 15 |
| Novel capability | 15 |
| Demo state transition | 15 |
| Technical feasibility | 10 |
| Evidence / provability | 10 |
| Saturation advantage | 5 |
| UX potential | 5 |
| **Total** | **100** |

TasteProof must be treated as an attack candidate only if it continues to clear this bar after technical/API verification.

### Current strategic assessment

| Dimension | Assessment |
|---|---:|
| Problem / value clarity | 14/15 |
| Product recognizability | 9/10 |
| Sponsor-native wedge | 14/15 |
| Novel capability | 13/15 |
| Demo state transition | 15/15 |
| Technical feasibility | 8/10 |
| Evidence / provability | 9/10 |
| Saturation advantage | 4/5 |
| UX potential | 5/5 |
| **Total** | **91/100** |

### Why not 100/100?

The main uncertainty is not the product concept.

It is:

> How much useful, stable, judge-visible evaluation signal can the currently available Qloo API return for the exact taste anchors and recommendation categories used in the demo?

That must be proven during the first engineering gate.

If the live Qloo API cannot support a credible evaluation path, do not fake it.

Instead:

1. adapt the evaluated category;
2. adapt the canonical fixture;
3. reduce the claim;
4. or, if necessary, kill the concept before substantial UI work.

---

# 04. ADVERSARIAL IDEA ATTACK

TasteProof must survive these attacks before it is considered locked.

## Attack 1 — “Isn't this just a recommendation app?”

Risk:

A judge sees three recommendations and a Qloo result and assumes the product is simply recommending things.

Defense:

TasteProof does not primarily generate the recommendations.

It **tests the recommendation**.

The central object is therefore:

> Recommendation under test.

The product flow must visually make this distinction obvious.

---

## Attack 2 — “Why not just ask Qloo for recommendations?”

Risk:

If TasteProof simply asks Qloo for recommendations, it loses its identity.

Defense:

The product starts with an **external agent output**.

Example:

```text
AGENT SAYS:

1. Hotel A
2. Hotel B
3. Hotel C
```

TasteProof asks:

> Do these recommendations actually fit the taste context?

This makes Qloo a judging/evaluation signal rather than merely another recommendation endpoint.

---

## Attack 3 — “Is the PASS/FAIL made up?”

This is the biggest technical credibility risk.

Defense:

Every verdict must be traceable to:

```text
input
→ resolved entity
→ actual Qloo response
→ deterministic evaluation rule
→ verdict
```

The UI must expose enough evidence to show this.

Never show:

> PASS — 87%

unless the underlying score and normalization are real, documented, and honestly labelled.

---

## Attack 4 — “Is this pretending to be scientific?”

Do not claim:

- psychological certainty;
- future behavior prediction;
- guaranteed preference;
- objective truth;
- a probability of liking;
- personal profiling;
- medical or legal certainty.

Preferred language:

- “Qloo-derived affinity signal”
- “taste-fit evaluation”
- “evidence”
- “resolved entity”
- “observed Qloo signal”
- “TasteProof evaluation”

---

## Attack 5 — “Would this work without Qloo?”

Ask:

> If Qloo is removed, does the core product become materially weaker?

The answer must be yes.

Without Qloo, TasteProof loses the external cultural signal that grounds the evaluation.

If the final implementation can produce the same result with hardcoded rules or an LLM alone, the implementation has failed the sponsor-fit test.

---

## Attack 6 — “Is this just a dashboard?”

Defense:

The UI must be built around the **test instrument**, not analytics.

The main visual object is:

> A TASTE TEST CARD.

The result is:

> A test outcome.

Evidence is:

> Test evidence.

The anchor swap is:

> A controlled experiment.

This creates a coherent product world.

---

# 05. PRODUCT FORENSICS — REQUIRED BEFORE UI CODING

This section is mandatory.

The coding agent must read it before creating visual components.

## 5.1 Product

TasteProof.

## 5.2 Primary user

A developer, AI-agent builder, product team, or technically curious user who wants to check whether an AI agent's recommendations actually fit a supplied taste context.

## 5.3 Highest-value action

Run a recommendation through a real Qloo-backed taste evaluation and inspect the evidence.

## 5.4 Problem without TasteProof

AI agents can produce recommendations that sound plausible but may not actually reflect the user's stated cultural/taste context.

The user often has no simple way to inspect:

- what taste context was interpreted;
- whether recommendation candidates match that context;
- what external cultural signal supports the result;
- whether changing the taste context changes the evaluation.

## 5.5 Why Qloo

Qloo provides cultural-intelligence/taste signals across entities and categories.

The product therefore uses Qloo as the external signal against which recommendation candidates are evaluated.

## 5.6 What Qloo does

Qloo supplies the actual API-derived data used by the evaluation pipeline.

## 5.7 What TasteProof does

TasteProof:

1. accepts taste anchors;
2. resolves them;
3. accepts recommendation candidates;
4. resolves them where supported;
5. requests the verified Qloo signal;
6. transforms the returned data through a deterministic, documented evaluation rule;
7. assigns a verdict only when evidence is sufficient;
8. presents the evidence to the user;
9. allows one taste anchor to be changed;
10. reruns the test and compares the resulting state.

## 5.8 What the smart/agentic layer does

The MVP does not need a large autonomous agent.

The important agentic relationship is:

> TasteProof evaluates the output of an AI recommendation workflow.

If an agent framework is required to satisfy the hackathon interpretation, implement the smallest legitimate agent/tool workflow that can be demonstrated honestly.

Do not add an unnecessary autonomous agent merely for marketing.

## 5.9 State changes

The product must visibly move through:

```text
NO TEST
→ TEST CONFIGURED
→ RESOLVING TASTE
→ TASTE READY
→ EVALUATING
→ EVALUATED
→ PASS / REVIEW / FAIL
```

Then:

```text
ANCHOR CHANGED
→ RE-EVALUATING
→ NEW RESULT
→ BEFORE / AFTER COMPARISON
```

## 5.10 Independently verifiable proof

The product should expose:

- resolved Qloo entities;
- actual returned signal fields;
- candidate resolution status;
- evaluation inputs;
- deterministic rule used;
- verdict;
- request/test timestamp where useful;
- error state if Qloo failed;
- before/after test identifiers if implemented.

The UI must never claim evidence exists when it does not.

## 5.11 Product magic moment

The magic moment is:

> The user changes one taste anchor and sees the evaluation actually change.

This is much stronger than simply showing a score.

---

# 06. PRODUCT STORY

## Product sentence

> TasteProof lets you test whether an AI recommendation actually fits the taste context it was given.

## Human explanation

Imagine an AI recommends three hotels because you told it:

- you like Tyler, the Creator;
- you like Aesop;
- you like Dune.

The AI may sound convincing.

TasteProof asks:

> “Okay. Show me whether these recommendations actually fit that taste.”

It uses Qloo to provide the external cultural signal, evaluates the candidates, and shows the evidence.

Then change one taste anchor.

Run it again.

Now you can see whether the recommendation evaluation responds to the changed taste context.

That is the product.

---

# 07. VISUAL WORLD

## Chosen product world

# THE TEST LAB

TasteProof should feel like a modern editorial testing instrument.

Not:

- a futuristic spaceship;
- a crypto terminal;
- an AI chatbot;
- a generic SaaS dashboard;
- a neon Web3 site.

Think:

> A high-quality cultural research lab where a recommendation is placed under examination.

Physical/visual references may include:

- test cards;
- specimen labels;
- editorial research sheets;
- lab notebooks;
- calibrated instruments;
- marked-up evidence;
- controlled experiment panels;
- reference samples.

These are metaphors for the product mechanism.

They are not decorative props.

---

# 08. VISUAL THESIS

The exact thesis is:

> **TasteProof should feel like a cultural testing laboratory because it turns an invisible question — “does this recommendation actually fit?” — into a controlled, inspectable test.**

Three-to-five visual adjectives:

- editorial
- precise
- investigative
- tactile
- restrained

Secondary qualities:

- intelligent
- calm
- credible
- slightly experimental
- information-rich without feeling like a dashboard

---

# 09. VISUAL IDENTITY RULE

If the logo and explanatory marketing copy disappeared, the interface should still be recognizable as:

> a recommendation being tested against taste evidence.

This means the identity comes from:

1. test-card composition;
2. specimen/evidence language;
3. before/after experimental interaction;
4. deliberate typography and annotation;
5. stateful result presentation.

Not merely from colors.

---

# 10. DESIGN GRAMMAR

This section is mandatory.

## 10.1 Typography

Use a free/open font system.

Preferred direction:

- primary UI/editorial sans: **IBM Plex Sans**
- technical/evidence metadata: **IBM Plex Mono**

If adding external font packages creates unnecessary build weight or network dependence, use a reliable system fallback stack.

Suggested hierarchy:

```text
Display:
44–64px desktop
34–44px mobile
tight line-height

Section:
28–36px

Product object heading:
20–28px

Body:
15–17px

Secondary:
13–14px

Evidence metadata:
11–13px monospace
```

Typography must create hierarchy without oversized marketing text everywhere.

---

## 10.2 Color system

The palette must communicate test states semantically.

Base:

- warm/off-white or very light neutral background;
- near-black text;
- muted gray secondary text;
- restrained border color.

Semantic states:

- neutral = unresolved/inactive;
- active = test in progress;
- positive = PASS;
- caution = REVIEW;
- negative = FAIL;
- error = system/API failure.

Do not use:

- purple AI gradients;
- rainbow gradients;
- glowing borders;
- neon green crypto styling;
- blue/purple “Web3” defaults.

Color must explain state.

---

## 10.3 Geometry

Use mostly:

- square or mildly rounded corners;
- clear borders;
- strong alignment;
- consistent inset spacing;
- occasional paper/test-card framing.

Avoid:

- huge pill-shaped containers;
- every section inside a rounded rectangle;
- floating glass panels;
- excessive 24–40px corner radii.

The test card should feel like an object being inspected.

---

## 10.4 Spacing

Use a predictable scale.

Suggested base:

```text
4
8
12
16
24
32
48
64
96
```

Do not randomly tune margins per component.

---

## 10.5 Density

TasteProof should feel information-rich but not cramped.

The result screen should resemble:

> a professional test report

rather than:

> a financial dashboard.

---

## 10.6 Motion

Motion is functional.

Use:

- step transitions;
- subtle progress movement;
- evidence reveal;
- anchor replacement transition;
- before/after comparison.

Do not use:

- perpetual floating objects;
- decorative blobs;
- excessive parallax;
- attention-grabbing animations;
- spinning AI orbs.

Reduced-motion support is required.

---

# 11. NEGATIVE DESIGN RULES

The coding agent is explicitly prohibited from defaulting to:

- generic SaaS hero;
- purple/blue AI gradient;
- glassmorphism;
- giant rounded cards;
- glowing borders;
- gradient text;
- floating 3D AI object;
- generic chatbot UI;
- generic sidebar dashboard;
- bento-grid feature wall;
- fake analytics charts;
- unnecessary line graphs;
- fake percentages;
- blockchain visual decoration;
- wallet/connect buttons;
- token language;
- “powered by AI” badges everywhere;
- stock illustrations;
- generic robot illustrations;
- excessive pills;
- fake testimonials;
- “10x” marketing metrics;
- meaningless counters;
- generic feature-card grids.

If an element does not help explain the test mechanism, remove it.

---

# 12. PRODUCT OBJECT VOCABULARY

Do not build the interface around generic component names such as:

- Card
- FeatureCard
- GlassCard
- DashboardCard
- InfoBox

Use product-specific concepts.

Required vocabulary:

- `TasteTestCard`
- `TasteAnchor`
- `TasteAnchorStrip`
- `AgentRecommendationList`
- `TestProgress`
- `ResolutionRow`
- `EvaluationRow`
- `VerdictBadge`
- `EvidenceDrawer`
- `EvidenceLine`
- `TestReceipt`
- `BeforeAfterTest`
- `AnchorSwap`
- `TestState`
- `FailureNotice`

These names should reflect actual product concepts.

---

# 13. SIGNATURE INTERACTION

## Name

# THE ANCHOR SWAP

## Trigger

User changes exactly one taste anchor.

Example:

```text
TYLER, THE CREATOR
AESOP
DUNE
```

becomes:

```text
TYLER, THE CREATOR
AESOP
THE BEAR
```

## Before

Show:

```text
TEST #001
3 CANDIDATES
2 PASS
1 REVIEW
```

## Transition

A new test begins.

The UI should make it clear:

> One variable changed.

Do not make the user wonder whether the entire test was replaced.

## After

Show:

```text
TEST #002
ANCHOR CHANGED:
DUNE → THE BEAR

RESULT CHANGED:
2 PASS / 1 REVIEW
→
1 PASS / 2 REVIEW
```

The exact result must come from the real API-backed evaluation.

Do not hardcode the expected change.

## What the user learns

> Taste context affects the evaluation.

That is the core product concept.

---

# 14. INFORMATION ARCHITECTURE

The product journey:

```text
LAND
 ↓
UNDERSTAND
 ↓
CONFIGURE TEST
 ↓
RUN
 ↓
WATCH TEST STATES
 ↓
INSPECT RESULT
 ↓
INSPECT EVIDENCE
 ↓
CHANGE ONE VARIABLE
 ↓
RERUN
 ↓
COMPARE
```

---

# 15. SCREEN ARCHITECTURE

## SCREEN 1 — TEST LAB / HOME

### Goal

Explain the product in approximately five seconds and let the user begin.

### Primary action

`RUN A TASTE TEST`

### Required information

- what TasteProof is;
- what is being tested;
- taste anchors;
- recommendation task;
- agent output.

### Hidden until needed

- raw API details;
- technical implementation;
- deep evidence;
- API errors.

### State

Configured/idle.

### Success

The test can be run.

### Failure

Invalid or incomplete test input is explained locally.

---

## SCREEN 2 — TEST RUN

### Goal

Make the process itself understandable.

Show stages:

```text
01 RESOLVE TASTE
02 RESOLVE CANDIDATES
03 EVALUATE
04 GENERATE TEST RESULT
```

Each stage must have:

- pending;
- active;
- complete;
- failed.

### Important

Do not create fake progress.

If the API takes two seconds, show a real loading state.

If a step is not actually happening, do not animate it as though it is.

---

## SCREEN 3 — TEST RESULT

### Goal

Answer:

> Did the recommendation fit?

Primary hierarchy:

```text
TASTE TEST COMPLETE

REVIEW

2 PASS
1 REVIEW
0 FAIL
```

Then candidate rows:

```text
AGENT RANK
1

TASTEPROOF
PASS

CANDIDATE
Hotel A

EVIDENCE
Qloo-derived signal available
```

The result must be understandable without opening evidence.

---

## SCREEN 4 — EVIDENCE

### Goal

Prove how the result was reached.

For each candidate:

```text
INPUT
Hotel A

RESOLVED ENTITY
Qloo entity

TASTE ANCHORS
Tyler, the Creator
Aesop
Dune

QLOO SIGNAL
[actual returned fields]

EVALUATION RULE
[deterministic rule]

VERDICT
PASS
```

Raw JSON can be available as an optional technical expansion.

Do not force judges to inspect raw JSON to understand the product.

---

## SCREEN 5 — BEFORE / AFTER

### Goal

Make the anchor-swap mechanism obvious.

Show:

```text
TEST #001
DUNE
↓
TEST #002
THE BEAR
```

Then:

```text
CANDIDATE     BEFORE      AFTER
Hotel A       PASS        REVIEW
Hotel B       REVIEW      PASS
Hotel C       PASS        PASS
```

Only display actual observed changes.

If nothing changed:

> No observed change in this run.

That is valid evidence.

Do not fake a dramatic result.

---

# 16. HOME PAGE NARRATIVE

Do not use:

```text
Hero
→ Features
→ Testimonials
→ CTA
```

Use:

## 01 — PROMISE

> **TEST WHETHER YOUR AI ACTUALLY HAS TASTE.**

Subtext:

> Put an AI recommendation under a real taste test.

Primary action:

`RUN A TASTE TEST`

---

## 02 — CORE PRODUCT OBJECT

Show the Taste Test Card immediately.

The visitor should see:

```text
TASTE CONTEXT

TYLER, THE CREATOR
AESOP
DUNE

TASK

RECOMMEND A HOTEL IN COPENHAGEN

AGENT OUTPUT

3 RECOMMENDATIONS

[RUN TASTE TEST]
```

---

## 03 — MECHANISM

Explain visually:

```text
AGENT OUTPUT
      ↓
QLOO SIGNAL
      ↓
TASTE EVALUATION
      ↓
VERDICT
```

Do not make this a generic four-card feature grid.

---

## 04 — LIVE PRODUCT STATE

Show a real or clearly labelled demo fixture.

Never pretend static content is a live API result.

---

## 05 — PROOF

Show evidence structure:

```text
ENTITY RESOLVED
QLOO SIGNAL RECEIVED
EVALUATION COMPLETED
VERDICT GENERATED
```

---

## 06 — ACTION

Return to:

`RUN A TASTE TEST`

---

# 17. STATE MACHINE

Required state model:

```text
IDLE
 ↓
CONFIGURED
 ↓
RESOLVING_TASTE
 ↓
TASTE_READY
 ↓
EVALUATING
 ↓
EVALUATED
 ↓
PASS / REVIEW / FAIL
```

Failure branches:

```text
INPUT_INVALID
QLOO_UNAVAILABLE
ENTITY_NOT_FOUND
UNSUPPORTED_CATEGORY
RATE_LIMITED
PARTIAL_RESULT
UNRESOLVED
```

---

# 18. STATE VISUAL RULES

Every state must have:

1. visual treatment;
2. copy;
3. available action;
4. evidence status.

## IDLE

Copy:

> Add taste anchors and recommendation candidates.

Action:

`Configure test`

---

## CONFIGURED

Copy:

> Test ready.

Action:

`Run taste test`

---

## RESOLVING_TASTE

Copy:

> Resolving taste anchors…

Do not show “AI thinking…”

---

## TASTE_READY

Copy:

> Taste context resolved.

Show resolved anchors.

---

## EVALUATING

Copy:

> Evaluating recommendations…

Show candidate progress only if the system actually evaluates candidates separately.

---

## PASS

Meaning:

> Evidence met the configured deterministic PASS rule.

Do not say:

> “This recommendation is objectively good.”

---

## REVIEW

Meaning:

> Evidence exists, but it does not satisfy the PASS rule strongly enough to call PASS.

---

## FAIL

Meaning:

> Available evidence did not satisfy the configured threshold/rule.

Do not imply universal dislike.

---

## UNRESOLVED

Meaning:

> TasteProof could not obtain enough evidence to make the evaluation.

This is not FAIL.

---

## QLOO_UNAVAILABLE

Copy:

> Qloo could not be reached. No taste verdict was generated.

Action:

`Retry`

---

# 19. TECHNICAL TRUTH MODEL

Every UI claim must satisfy:

```text
UI CLAIM
↓
ACTUAL IMPLEMENTATION
↓
EVIDENCE
```

Examples:

### Claim

> Candidate resolved.

Must correspond to actual Qloo resolution.

### Claim

> Qloo signal received.

Must correspond to actual API response.

### Claim

> PASS.

Must correspond to a deterministic rule applied to actual evidence.

### Claim

> Result changed after anchor swap.

Must correspond to two actual test runs.

---

# 20. SCORE / VERDICT RULE

This is a critical engineering area.

Do not invent a fake score.

The coding agent must first inspect the current Qloo API response fields.

Then define the smallest defensible evaluation model.

Possible structure:

```text
Qloo raw signal
        ↓
validated extraction
        ↓
deterministic transformation
        ↓
TasteProof evaluation value
        ↓
PASS / REVIEW / FAIL
```

If a numeric Qloo score is directly available and documented, use it appropriately.

If Qloo returns another kind of signal, use that signal directly or construct a clearly documented deterministic rule.

Every transformation must be named.

Example:

> “TasteProof evaluation score”

is safer than:

> “Probability user will like this.”

If normalization is used:

```text
raw Qloo value
→ documented normalization
→ TasteProof normalized value
```

Document the transformation in code and UI evidence.

---

# 21. DATA MODEL

## TasteAnchor

```ts
type TasteAnchor = {
  input: string;
  entityId: string | null;
  name: string | null;
  type: string | null;
  resolutionStatus:
    | "resolved"
    | "unresolved"
    | "error";
};
```

## Candidate

```ts
type Candidate = {
  input: string;
  entityId: string | null;
  name: string | null;
  category: string | null;
  location: string | null;
  resolutionStatus:
    | "resolved"
    | "unresolved"
    | "error";
};
```

## TasteEvidence

```ts
type TasteEvidence = {
  anchorIds: string[];
  candidateId: string;
  rawQlooData: unknown;
  extractedSignal: unknown;
  evaluationRule: string;
};
```

## EvaluationResult

```ts
type EvaluationResult = {
  candidate: Candidate;
  evaluationValue: number | null;
  verdict:
    | "PASS"
    | "REVIEW"
    | "FAIL"
    | "UNRESOLVED";
  evidence: TasteEvidence[];
};
```

---

# 22. API ARCHITECTURE

```text
Browser
   ↓
Next.js server
   ↓
Qloo client
   ↓
Qloo API
   ↓
validated response
   ↓
evaluation engine
   ↓
result/evidence
   ↓
browser
```

The Qloo API key must never reach the browser.

Never use:

```text
NEXT_PUBLIC_QLOO_API_KEY
```

Use:

```text
QLOO_API_KEY
```

server-side only.

---

# 23. API ROUTES

Required internal routes:

```text
POST /api/qloo/search
POST /api/qloo/insights
POST /api/test
```

The exact Qloo endpoints behind these routes must be verified against current official documentation.

Do not hardcode undocumented request parameters.

---

# 24. QLOO CLIENT RULES

Create:

```text
lib/qloo/client.ts
lib/qloo/search.ts
lib/qloo/insights.ts
```

Responsibilities:

### client.ts

- authentication;
- base URL;
- timeout;
- common headers;
- error handling;
- response validation.

### search.ts

- entity resolution;
- category/type handling;
- response normalization.

### insights.ts

- verified Qloo insight request;
- response normalization;
- no fake fallback values.

---

# 25. VALIDATION

Use Zod.

Validate:

- taste anchor input;
- candidate input;
- API responses where practical;
- evaluation input;
- evaluation output.

Invalid data must not silently become:

```text
PASS
```

---

# 26. EVIDENCE-FIRST ENGINEERING

The evidence model is a first-class feature.

Each result should answer:

1. What did the user enter?
2. What entity did the system resolve?
3. What did Qloo return?
4. What part of that response was used?
5. What deterministic rule was applied?
6. What verdict resulted?

---

# 27. DEMO VERIFIER

Create:

```text
scripts/verify-demo.ts
```

It must:

1. load the canonical fixture;
2. execute the real test flow;
3. validate required fields;
4. confirm Qloo evidence exists for evaluated results;
5. confirm no fake score is inserted;
6. confirm unresolved candidates are not falsely marked PASS;
7. confirm deterministic evaluation output;
8. print a human-readable report;
9. emit machine-readable output.

Example conceptual output:

```text
TASTEPROOF DEMO VERIFICATION

Taste anchors: 3
Resolved anchors: 3

Candidates: 3
Resolved candidates: 3

Qloo evaluations: 3
Evidence complete: YES

Verdicts:
PASS: 2
REVIEW: 1
FAIL: 0
UNRESOLVED: 0

ANCHOR SWAP:
Previous: DUNE
New: THE BEAR

Second run: VERIFIED

RESULT: PASS
```

The exact numbers must come from the real run.

---

# 28. CANONICAL DEMO FIXTURE

Initial taste anchors:

```text
Tyler, the Creator
Aesop
Dune
```

Task:

```text
Recommend a hotel in Copenhagen.
```

Agent output:

```text
Candidate A
Candidate B
Candidate C
```

The actual candidates must be chosen only after verifying that the current Qloo API can resolve/evaluate them reliably.

Do not lock candidate names into code merely because they look good in the story.

The fixture must be adapted to the API's real capabilities.

---

# 29. AGENT OUTPUT MODEL

TasteProof must make it clear that the recommendations came from an agent/user input.

The MVP can support pasted output:

```text
Agent recommendation 1
Agent recommendation 2
Agent recommendation 3
```

This is acceptable as the simplest reliable MVP if the hackathon requirements are still satisfied by the implemented agentic workflow.

If an actual agent framework is needed, add the smallest legitimate agent/tool flow rather than building an unnecessarily complex autonomous system.

---

# 30. REPOSITORY STRUCTURE

```text
tasteproof/
├── app/
│   ├── page.tsx
│   ├── test/
│   │   └── page.tsx
│   ├── results/
│   │   └── page.tsx
│   └── api/
│       ├── qloo/
│       │   ├── search/
│       │   │   └── route.ts
│       │   └── insights/
│       │       └── route.ts
│       └── test/
│           └── route.ts
│
├── components/
│   ├── TasteTestCard.tsx
│   ├── TasteAnchor.tsx
│   ├── TasteAnchorStrip.tsx
│   ├── AgentRecommendationList.tsx
│   ├── TestProgress.tsx
│   ├── ResolutionRow.tsx
│   ├── EvaluationRow.tsx
│   ├── VerdictBadge.tsx
│   ├── EvidenceDrawer.tsx
│   ├── EvidenceLine.tsx
│   ├── TestReceipt.tsx
│   ├── BeforeAfterTest.tsx
│   ├── AnchorSwap.tsx
│   ├── TestState.tsx
│   └── FailureNotice.tsx
│
├── lib/
│   ├── qloo/
│   │   ├── client.ts
│   │   ├── search.ts
│   │   └── insights.ts
│   ├── evaluation/
│   │   ├── score.ts
│   │   ├── verdict.ts
│   │   └── evidence.ts
│   └── validation/
│       └── schemas.ts
│
├── types/
│   └── index.ts
│
├── tests/
│   ├── evaluation.test.ts
│   ├── validation.test.ts
│   ├── state-machine.test.ts
│   └── fixtures/
│       └── demo.json
│
├── scripts/
│   └── verify-demo.ts
│
├── public/
│
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── package.json
├── tsconfig.json
└── ...
```

---

# 31. HARD CONSTRAINTS

## Budget

$0 upfront.

Do not introduce:

- paid API;
- paid hosting;
- paid database;
- paid analytics;
- paid font;
- paid image service;
- paid LLM.

Use free services only.

## Hardware

User has approximately 8 GB RAM.

Therefore:

- avoid heavyweight local builds where possible;
- do not add unnecessary dependencies;
- do not run local models;
- use GitHub/Vercel where appropriate;
- keep the application architecture simple.

## Security

Never:

- commit `.env`;
- expose Qloo key;
- put Qloo key in client code;
- print the key in logs;
- use public environment variables for secrets.

---

# 32. IMPLEMENTATION ORDER — MANDATORY

This is the most important correction to the previous build spec.

The coding agent must NOT jump directly from idea to navbar/hero/components.

Follow exactly:

```text
01 PRODUCT FORENSICS
        ↓
02 VISUAL THESIS
        ↓
03 USER JOURNEY + STATE MACHINE
        ↓
04 DESIGN GRAMMAR
        ↓
05 SIGNATURE INTERACTION
        ↓
06 SCREEN ARCHITECTURE
        ↓
07 TECHNICAL SKELETON
        ↓
08 SMALLEST REAL QLOO FLOW
        ↓
09 EVALUATION ENGINE
        ↓
10 FIRST PRODUCT IMPLEMENTATION
        ↓
11 COMPLETE PRODUCT STATES
        ↓
12 RESPONSIVE IMPLEMENTATION
        ↓
13 VISUAL QA
        ↓
14 ANTI-AI AUDIT
        ↓
15 JUDGE WALKTHROUGH
        ↓
16 PRODUCTION HARDENING
```

Do not reorder this merely because a generic frontend workflow would be faster.

---

# 33. PHASE 0 — ENVIRONMENT + SECURITY

Before application work:

- create project;
- initialize Git;
- create `.gitignore`;
- create `.env.example`;
- create license;
- confirm Vercel deployment path;
- confirm Node/Next versions;
- confirm Qloo API key is server-only.

Gate:

> Project skeleton exists and no secret is exposed.

---

# 34. PHASE 1 — VERIFY QLOO

Before UI implementation:

1. Read current official Qloo developer documentation.
2. Read current hackathon developer guide.
3. Verify authentication.
4. Verify base URL.
5. Verify entity search.
6. Verify relevant insight/evaluation endpoint.
7. Verify required parameters.
8. Verify response fields.
9. Verify supported categories.
10. Test one real request.

Record:

```text
QLOO API VERIFIED
DATE:
ENDPOINT:
AUTH:
SEARCH RESPONSE:
INSIGHT RESPONSE:
SUPPORTED CATEGORY:
NOTES:
```

Gate:

> One real Qloo request succeeds.

---

# 35. PHASE 2 — SMALLEST REAL END-TO-END FLOW

Before polishing:

```text
one taste anchor
→ resolve
→ one candidate
→ Qloo signal
→ deterministic evaluation
→ verdict
```

No dashboard.

No marketing page.

No animation.

No fake data.

Gate:

> One real candidate can produce a real evidence-backed result.

---

# 36. PHASE 3 — EVALUATION ENGINE

Implement:

- deterministic extraction;
- documented transformation;
- verdict thresholds;
- unresolved handling;
- API failure handling.

Tests must run.

Gate:

> Evaluation logic is deterministic and independently testable.

---

# 37. PHASE 4 — PRODUCT UI

Now build the Test Lab.

Start from:

> Taste Test Card.

Do not start from navbar.

First visual object:

```text
TASTE CONTEXT
↓
TASK
↓
AGENT OUTPUT
↓
RUN TASTE TEST
```

Then result.

Then evidence.

Then before/after.

---

# 38. PHASE 5 — SIGNATURE INTERACTION

Implement:

```text
CHANGE ONE ANCHOR
→ RERUN
→ COMPARE
```

Requirements:

- previous run remains visible;
- changed anchor is clearly marked;
- second run is independently executed;
- result comparison is based on actual returned data;
- no expected result is hardcoded.

Gate:

> The judge can see the product mechanism in under one minute.

---

# 39. PHASE 6 — EVIDENCE + VERIFIER

Implement:

- evidence drawer;
- resolution status;
- Qloo signal display;
- evaluation rule;
- verifier script;
- machine-readable verification output.

Gate:

> A skeptical judge can inspect why the product produced the verdict.

---

# 40. PHASE 7 — COMPLETE PRODUCT STATES

Implement and visually test:

- idle;
- configured;
- loading;
- resolving;
- evaluating;
- pass;
- review;
- fail;
- unresolved;
- API failure;
- rate limit;
- invalid input;
- partial result;
- disconnected state if relevant.

No state should look accidentally broken.

---

# 41. PHASE 8 — RESPONSIVE

Mobile is not an afterthought.

Required:

- 360px-ish mobile width;
- tablet;
- desktop.

On mobile:

- preserve test-card hierarchy;
- make evidence readable;
- avoid horizontal overflow;
- keep primary action accessible;
- allow candidate rows to stack.

---

# 42. VISUAL QUALITY GATE

Score every criterion from 0–2.

| Criterion | Score |
|---|---:|
| Product clarity | 0–2 |
| Distinctiveness | 0–2 |
| Product-mechanism expression | 0–2 |
| Information hierarchy | 0–2 |
| Typography | 0–2 |
| Spacing / density | 0–2 |
| Interaction quality | 0–2 |
| State coverage | 0–2 |
| Motion | 0–2 |
| Mobile quality | 0–2 |
| Technical honesty | 0–2 |
| Judge proof | 0–2 |
| **Total** | **/24** |

Minimum:

> **20/24**

Automatic redesign if any of these score 0:

- Product clarity
- Distinctiveness
- Product-mechanism expression
- Technical honesty

---

# 43. 5-SECOND TEST

At five seconds, a stranger must understand:

> This is a tool that tests AI recommendations against taste.

If they only see:

> “cool AI website”

the design has failed.

---

# 44. 10-SECOND TEST

At ten seconds, they should understand:

- what goes in;
- what comes out.

Example:

```text
TASTE
+
AGENT RECOMMENDATION
↓
TEST RESULT
```

---

# 45. 20-SECOND TEST

At twenty seconds, the stranger should understand:

> Qloo supplies an external cultural signal used to evaluate the recommendation.

---

# 46. 30-SECOND TEST

At thirty seconds, they should understand:

1. what TasteProof is;
2. who it is for;
3. what it tests;
4. why Qloo matters;
5. what evidence the user gets.

---

# 47. JUDGE MODE

The product must visually answer:

### What is this?

A taste QA tool for AI recommendations.

### Who is it for?

AI-agent builders and users who care whether recommendations actually fit cultural/taste context.

### What happens?

Agent recommendation → Qloo-backed evaluation → evidence → verdict.

### Why Qloo?

Qloo provides the cultural-intelligence signal.

### What is technically special?

The product turns that external taste signal into an inspectable evaluation workflow rather than merely using Qloo to generate another recommendation.

### Does it actually work?

Real Qloo calls and visible evidence.

### Can I verify it?

Yes, through the evidence panel and verifier.

---

# 48. ANTI-AI VISUAL AUDIT

Ask:

> Could this interface have been generated by asking an AI: “Make a premium Web3 AI dashboard”?

If yes:

> FAIL.

Ask:

> If the logo disappeared, would the test-card/evidence/anchor-swap interaction still identify the product?

If no:

> FAIL.

Ask:

> Does the visual language explain the mechanism?

If no:

> FAIL.

Ask:

> Are there decorative elements that do not contribute to the product story?

If yes:

> Remove them.

---

# 49. TECHNICAL HONESTY AUDIT

Before submission, search the repository and UI for claims involving:

- first;
- only;
- guaranteed;
- prediction;
- probability;
- scientifically proven;
- understands you;
- knows your taste;
- 100% accurate;
- future behavior;
- personalized certainty.

Remove or qualify unsupported claims.

Also search for:

- fake API data;
- hardcoded scores;
- fake loading;
- fake evidence;
- placeholder Qloo responses;
- exposed secrets.

---

# 50. TESTING REQUIREMENTS

Minimum tests:

## Validation

- empty input;
- malformed input;
- duplicate anchors;
- invalid candidate.

## Resolution

- successful anchor;
- unresolved anchor;
- successful candidate;
- unresolved candidate.

## Evaluation

- valid Qloo signal;
- missing signal;
- deterministic result;
- threshold boundaries.

## Failure

- Qloo unavailable;
- rate limited;
- partial result;
- invalid API response.

## State machine

- correct state transitions;
- illegal transitions rejected;
- failed state recoverable where appropriate.

## Canonical flow

Run:

```text
3 anchors
→ 3 candidates
→ real Qloo calls
→ results
→ evidence
→ anchor swap
→ second real run
→ comparison
```

---

# 51. DEMO FLOW

Target:

> 60–90 seconds.

## 0–5 sec

Show:

> TEST WHETHER YOUR AI ACTUALLY HAS TASTE.

## 5–15 sec

Show taste context:

```text
Tyler, the Creator
Aesop
Dune
```

## 15–25 sec

Show task:

> Recommend a hotel in Copenhagen.

Show agent recommendations.

## 25–40 sec

Run test.

Show real progress states.

## 40–55 sec

Show:

```text
TASTE TEST COMPLETE

PASS
REVIEW
FAIL
```

Then show candidate evaluations.

## 55–65 sec

Open evidence.

Show:

```text
ENTITY RESOLVED
QLOO SIGNAL
EVALUATION RULE
VERDICT
```

## 65–80 sec

Replace:

```text
Dune
```

with another verified anchor.

Run again.

## 80–90 sec

Show before/after.

End with:

> **Your agent answered. TasteProof tests whether the answer actually fits the taste.**

---

# 52. DEMO RULES

Do not:

- narrate technical details for 60 seconds;
- start with code;
- start with API documentation;
- spend half the demo on configuration;
- fake an API response;
- force a result change;
- hide an error;
- claim an unsupported Qloo capability.

The demo must prove:

```text
INPUT
→ REAL TEST
→ RESULT
→ EVIDENCE
→ CONTROLLED CHANGE
→ NEW RESULT
```

---

# 53. README REQUIREMENTS

README must include:

1. product description;
2. screenshot;
3. why the problem matters;
4. why Qloo;
5. architecture;
6. setup;
7. environment variables;
8. test instructions;
9. demo fixture;
10. evidence model;
11. limitations;
12. license.

Include a clear warning:

> Qloo-derived signals are used as cultural/taste evidence; TasteProof does not claim to predict or guarantee an individual's future preferences.

---

# 54. SECURITY CHECKLIST

Before push:

```text
[ ] .env ignored
[ ] no QLOO_API_KEY in source
[ ] no QLOO_API_KEY in screenshots
[ ] no secret in README
[ ] no secret in test fixtures
[ ] no secret in Vercel client bundle
[ ] no secret in logs
```

---

# 55. GIT / PUBLIC REPO RULES

Public repository must contain:

- source;
- assets required to run;
- instructions;
- license.

Do not commit:

- `.env`;
- credentials;
- local caches;
- node_modules;
- build artifacts;
- irrelevant video files;
- private notes;
- unrelated hackathon files.

---

# 56. VERCEL DEPLOYMENT

Deployment target:

> Vercel free tier.

Production environment:

```text
QLOO_API_KEY
```

must be configured as a server-side environment variable.

After deployment:

1. open production URL;
2. run canonical test;
3. run anchor swap;
4. inspect evidence;
5. test failure behavior;
6. inspect browser network requests;
7. confirm secret is not exposed;
8. confirm mobile rendering.

---

# 57. FINAL PRODUCTION AUDIT

## Product

```text
[ ] stranger understands product in 30 sec
[ ] recommendation is visibly under test
[ ] Qloo is visibly load-bearing
[ ] evidence is visible
[ ] anchor swap works
```

## Technical

```text
[ ] real Qloo calls
[ ] no fake scores
[ ] no fake evidence
[ ] deterministic evaluation
[ ] unresolved state exists
[ ] API errors handled
[ ] tests pass
[ ] verifier passes
```

## Design

```text
[ ] Test Lab world is coherent
[ ] Taste Test Card is central
[ ] no generic Web3 aesthetic
[ ] no giant rounded-card dashboard
[ ] typography is deliberate
[ ] state colors are semantic
[ ] mobile works
[ ] reduced motion works
```

## Submission

```text
[ ] functional demo URL
[ ] public GitHub repository
[ ] open-source license visible
[ ] English submission materials
[ ] text description
[ ] project is free to test
[ ] no private dependency required for judge
```

---

# 58. P0 / P1 / P2 SCOPE

## P0 — MUST SHIP

- real Qloo connection;
- entity resolution;
- canonical taste fixture;
- candidate evaluation;
- deterministic evaluation;
- PASS / REVIEW / FAIL / UNRESOLVED;
- evidence;
- Test Lab UI;
- signature anchor swap;
- before/after comparison;
- canonical demo;
- tests;
- verifier;
- Vercel deployment;
- responsive design;
- README;
- license;
- security audit.

## P1 — ONLY AFTER P0 IS STABLE

Possible:

- MCP tool;
- more recommendation categories;
- JSON export;
- test history;
- additional fixture templates.

## P2 — ONLY IF EVERYTHING ELSE IS DONE

Possible:

- CI;
- public API;
- team accounts;
- persistent database;
- integrations.

Never sacrifice P0 to add P1/P2.

---

# 59. WHAT NOT TO BUILD

Do not build:

### A generic chatbot

User:

> “What should I do in Copenhagen?”

AI:

> “Here are some options…”

That is not TasteProof.

### A generic recommendation engine

User:

> “I like Dune.”

System:

> “Here are 10 hotels.”

That is not TasteProof.

### A fake evaluation dashboard

Large cards:

```text
87%
92%
94%
```

with no real evidence.

That is not TasteProof.

### A crypto UI

No wallet.

No token.

No chain.

No blockchain decoration.

### A giant AI animation

No floating orb.

No animated brain.

No glowing neural network.

---

# 60. PRODUCT VISUALIZATION — TARGET END STATE

A stranger opens the site.

They see a restrained editorial interface.

At the center is a large object that looks like a test sheet:

```text
────────────────────────────────────────

TASTE TEST 001

TASTE CONTEXT
────────────────────────────────────────

TYLER, THE CREATOR
AESOP
DUNE


TASK
────────────────────────────────────────

RECOMMEND A HOTEL IN COPENHAGEN


AGENT OUTPUT
────────────────────────────────────────

01  HOTEL A
02  HOTEL B
03  HOTEL C


                         [ RUN TEST ]

────────────────────────────────────────
```

After running:

```text
────────────────────────────────────────

TASTE TEST COMPLETE

REVIEW

2 PASS     1 REVIEW     0 FAIL

────────────────────────────────────────

01  HOTEL A

    AGENT RANK       #1
    TASTEPROOF       PASS

    QLOO SIGNAL      AVAILABLE
    EVIDENCE         3 ITEMS

────────────────────────────────────────

02  HOTEL B

    AGENT RANK       #2
    TASTEPROOF       REVIEW

    QLOO SIGNAL      AVAILABLE
    EVIDENCE         2 ITEMS

────────────────────────────────────────

03  HOTEL C

    AGENT RANK       #3
    TASTEPROOF       PASS

────────────────────────────────────────

[ INSPECT EVIDENCE ]

────────────────────────────────────────
```

Then the user changes:

```text
DUNE
↓
THE BEAR
```

The interface visibly marks:

```text
CONTROLLED CHANGE

1 TASTE ANCHOR CHANGED

TEST 001 → TEST 002
```

The second result appears.

The user can see what changed.

That is the visual/product identity.

---

# 61. THE CORE JUDGE MOMENT

The strongest moment is not:

> “Look, we called Qloo.”

It is:

> “Watch what happens when I change one thing.”

The judge sees:

```text
TEST 001
taste context A
→ result A

TEST 002
taste context B
→ result B
```

Then:

> “And here is the Qloo evidence behind the evaluation.”

This demonstrates:

- product understanding;
- Qloo integration;
- state change;
- interaction;
- evidence;
- impact;
- design.

---

# 62. FINAL PRODUCT CONTRACT

The coding agent must be able to say:

> **TasteProof tests whether an AI recommendation actually fits the taste context it was given. It uses Qloo as an external cultural-intelligence signal, turns the returned signal into a deterministic evaluation, shows the evidence behind the result, and lets the user change one taste variable and rerun the test.**

If the implemented product cannot honestly do this:

> It is not finished.

---

# 63. CODING AGENT INSTRUCTIONS

You are the implementation agent.

Before writing UI code, read this entire specification.

## FIRST

1. Verify the current official Qloo API documentation.
2. Verify authentication.
3. Verify current hackathon endpoint/base URL.
4. Verify entity search.
5. Verify relevant Insights API capability.
6. Verify response fields.
7. Create a minimal real Qloo request.
8. Record the verified API behavior.

## SECOND

Build:

```text
real Qloo call
→ entity resolution
→ candidate evaluation
→ evidence
→ deterministic verdict
```

## THIRD

Build the Test Lab product.

Follow:

```text
Product Forensics
→ Visual Thesis
→ State Machine
→ Design Grammar
→ Signature Interaction
→ Screen Architecture
→ UI
```

Do not skip directly to a generic landing page.

## FOURTH

Implement:

```text
ANCHOR SWAP
→ REAL SECOND RUN
→ BEFORE/AFTER
```

## FIFTH

Add:

- all states;
- evidence;
- tests;
- verifier;
- responsive behavior;
- production deployment.

## SIXTH

Perform:

- technical truth audit;
- anti-AI visual audit;
- 5/10/20/30-second comprehension test;
- 20/24 visual quality gate;
- security audit;
- judge walkthrough.

---

# 64. ABSOLUTE NON-NEGOTIABLES

1. No fake Qloo responses.
2. No fake scores.
3. No fake evidence.
4. No exposed secrets.
5. No unsupported Qloo claims.
6. No generic recommendation app.
7. No generic chatbot.
8. No blockchain features.
9. No paid dependencies.
10. No giant generic dashboard.
11. No generic AI/Web3 visual language.
12. No PASS/FAIL without sufficient evidence.
13. No hardcoded expected anchor-swap result.
14. No pretending static fixtures are live data.
15. No “AI magic” copy that hides the actual mechanism.
16. Do not invent Qloo API parameters.
17. Do not replace Qloo evidence with an LLM opinion.
18. Do not stop at a beautiful landing page.
19. Do not build P1/P2 before P0 works.
20. If the real Qloo API contradicts this specification, verify and adapt rather than guessing.

---

# 65. FINAL GO / NO-GO GATE

The project is **GO** only if all are true:

```text
[ ] Real Qloo API verified
[ ] Real Qloo request works
[ ] Taste anchors resolve
[ ] Candidate resolution works
[ ] Evaluation uses actual Qloo data
[ ] Verdict is deterministic
[ ] Evidence is inspectable
[ ] Anchor swap performs a second real test
[ ] Before/after comparison is real
[ ] Test Lab visual identity is coherent
[ ] 30-second explanation works
[ ] 20/24 visual gate passed
[ ] Anti-AI audit passed
[ ] Tests pass
[ ] Demo verifier passes
[ ] Production deployment works
[ ] Mobile works
[ ] Secret audit passes
[ ] Public repo has license
[ ] Submission requirements are satisfied
```

If any critical item fails:

> STOP and fix it before submission.

---

# 66. ONE-SENTENCE FINAL POSITIONING

> **TasteProof is the test bench for AI recommendations: give it the taste context and the agent's answer, and it uses Qloo-backed cultural evidence to show whether the recommendation actually fits.**

---

# 67. SOURCE / VERIFICATION NOTE

This build specification is based on:

- the project's internal hackathon-winning methodology;
- the project's premium product art-direction/UI/UX system;
- the selected TasteProof product strategy;
- current official Qloo Agentic Hackathon rules/event information.

The official hackathon rules are the authority for submission requirements and judging.

Current Qloo API documentation is the authority for exact implementation details.

**Do not treat any undocumented API example in this specification as a substitute for the current official Qloo developer documentation.**
