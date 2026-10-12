# TasteProof

**A taste QA layer for AI agents.**

TasteProof tests whether recommendations from an external AI agent fit the taste context it was given. It uses Qloo to resolve entities and provide a live cultural-intelligence ranking, then shows a deterministic verdict and its evidence.

TasteProof is not a recommendation generator. It tests recommendations an agent already produced.

## Product flow

1. Enter two to five taste anchors and choose a Qloo category for each.
2. Paste two to ten recommendations from the agent being tested.
3. TasteProof resolves the anchors and candidate places using Qloo.
4. TasteProof requests an Insights ranking for the candidates under the taste and location context.
5. It assigns PASS, REVIEW, FAIL or UNRESOLVED using a published relative-ranking rule.
6. Change one anchor, run a second test and compare the actual results.

No result is preloaded or labelled as live evidence. If Qloo is not configured or returns insufficient evidence, TasteProof explains the blocker instead of manufacturing a result.

## Agent-tool interface

TasteProof exposes POST /api/test (also available as POST /api/evaluate), described by public/openapi.json. An agent can call this endpoint after generating recommendations to receive candidate resolutions, ranks, verdicts and evidence. The endpoint does not require an LLM provider key; Qloo is the only external API credential required for the core flow.

## Setup

Requirements: Node.js 20.9 or newer and npm.

1. Join the Qloo Agentic Hackathon.
2. Follow the API-key steps in the official Qloo hackathon developer guide.
3. Copy .env.example to .env.local.
4. Add your key to .env.local as QLOO_API_KEY=your_key. Never commit this file.
5. Leave QLOO_BASE_URL set to https://hackathon.api.qloo.com for a hackathon-issued key unless Qloo's credential instructions state otherwise.
6. Install dependencies and run npm run dev.

Open http://localhost:3000. The Qloo key is used only by server routes; it is never sent to the browser.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| QLOO_API_KEY | Yes for live evaluation | Server-side hackathon API credential. |
| QLOO_BASE_URL | No | Qloo API origin; defaults to the hackathon host. |

Do not create a NEXT_PUBLIC_QLOO_API_KEY variable. Do not put credentials in URLs, frontend constants, screenshots, fixtures, tests or commits.

## Cloud checks

GitHub Actions runs TypeScript checks, unit tests and the production build on hosted runners, avoiding heavy local builds. These checks do not need the Qloo secret.

For live verification, add the repository Action secret QLOO_API_KEY and then use Actions → TasteProof live verification → Run workflow. Supply three candidate names that came from an actual agent output. The workflow runs Qloo twice, changing the third taste anchor for the second run. No dramatic change is assumed or forced.

## Endpoints

- GET /api/health reports whether a key is configured; it does not validate that key.
- POST /api/test runs a live Qloo-backed evaluation; POST /api/evaluate is a compatibility alias.
- POST /api/qloo/search resolves a submitted name into Qloo entity IDs.
- POST /api/qloo/insights ranks resolved candidates under the supplied taste and location context.
- /openapi.json documents the agent-callable evaluation tool.

The Qloo lookup routes use a best-effort per-process rate limit. This helps against casual bursts but is not a distributed quota service.

## Technical honesty and limitations

The verdict is comparative: the top third of ranked candidates receives PASS, the middle third REVIEW, and the bottom third FAIL. If fewer than two candidates have usable evidence, TasteProof returns UNRESOLVED. These are not probabilities, psychological claims or guarantees that a person will like an item. The project never invents numeric affinity scores.

Candidate matching depends on Qloo resolving submitted place names and returning them in the constrained Insights response. A successful website build alone does not prove the live Qloo workflow works; the live verification run is a separate gate.

## License

MIT. This license covers this repository's authored code and documentation, not Qloo data, API, trademarks or third-party content.

## Official references

- https://qloo.devpost.com/
- https://docs.qloo.com/reference/api-overview
- https://docs.qloo.com/reference/api-onboarding
- https://docs.qloo.com/reference/basic-insights-use-case
- https://docs.qloo.com/reference/get-search
