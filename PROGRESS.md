# KisanSetu Migration Progress

## Current Phase

Phase 10 — complete (clean-seed judge validation and documentation).

## Existing Features

- [x] Price Dashboard
- [x] Digital Lot Creation
- [x] Negotiation UI/logic
- [x] Voice UI/query flow
- [x] Geo-Pooling
- [x] Verified Buyer Matching

## Python Migration

- [x] FastAPI scaffold
- [x] SQLite layer (connection/pragmas plus additive Geo-Pooling migration; legacy schema/seed parity remains pending)
- [x] Seed (legacy demo parity plus deterministic Geo-Pool/RFQ data)
- [x] Advisory
- [x] Market data
- [x] Weather
- [x] Lots
- [x] Gemini (optional wording/ambiguous-language assistance only)
- [x] Negotiation
- [x] Voice query
- [x] Geo-Pooling backend
- [x] Next proxy cutover
- [x] TypeScript backend removed

## Feature 5

- [x] Schema (idempotent Geo-Pooling and Buyer-Requirement additions only)
- [x] Haversine
- [x] Compatibility
- [x] Pool suggestions
- [x] Pool join
- [x] Buyer RFQs
- [x] Buyer feasibility
- [x] Buyer matching
- [x] Pooling UI
- [x] Negotiation handoff

## Tests

- [x] Backend unit tests (health, migrations, seed, advisory, negotiation/Gemini boundaries, voice parsing, pooling, matching, and pooled settlement: 42 passed)
- [x] API parity tests (prices/weather/lots contract coverage)
- [x] Next production build
- [x] Full judge walkthrough (clean seed and external fallbacks)

## Phase 0 findings

- The root Next.js application is the only active implementation.
- Root `app/api/*` plus root `lib/*.ts` implement the active server/data/business layer.
- `apps/api`, `apps/web`, `apps/voice-gateway`, `services/ai-engine`, Docker/CI files, and most related seed artifacts are empty scaffolding.
- No `data/kisansetu.db` exists in the checkout; `lib/db.ts` creates it at runtime and `npm run seed` populates it.
- `docs/CURRENT_REPO_AUDIT.md` records frontend API dependencies, existing contracts, schema, migration sources, scaffolding, and risks.

## Phase 1 completed

- Added `apps/api/app/` package with environment configuration, stable repository-local DB path resolution, SQLite connection helpers, health schema, and FastAPI entry point.
- Added `apps/api/tests/test_health.py`; both health response and SQLite WAL/foreign-key smoke tests pass.
- Added `apps/api/requirements.txt` and `apps/api/README.md` with setup/run/test commands.
- Verified a live Uvicorn process at `127.0.0.1:8123` returned the required health response.
- No root Next.js route, React component, existing TypeScript business logic, schema definition, or Feature 5 code was changed.

## Phase 2 schema/migration portion completed

- Added `run_geo_pooling_migrations()` in `apps/api/app/db.py`.
- The migration safely requires the existing legacy `lots` and `buyers` tables, then adds only the specified Geo-Pooling and buyer-trust columns when missing.
- Added the `buyer_requirements`, `geo_pools`, and `geo_pool_members` tables with the specified SQLite schema and foreign-key relationships.
- The migration never drops, recreates, or resets existing tables/data, and can be run repeatedly.
- Added migration tests against a temporary database containing the current legacy `lots`/`buyers` schema and representative legacy records; both the first and second migration run preserve those records.
- No seed data, API route, React UI, Next.js route, or pooling/matching algorithm was added.

## Phase 2 seed portion completed

- Added `apps/api/app/services/seeded_random.py`, matching the TypeScript Park–Miller generator and verified against reference values.
- Added `apps/api/app/seed.py`, preserving the five crops, four mandis, buyers, 91 points per crop/mandi, two legacy demo lots, and three negotiation events from `lib/seed.ts`.
- Python uses JavaScript-compatible positive rounding and preserves deterministic seeded price generation; timestamps retain the legacy seed's current-time behavior.
- Added four explicitly labeled Nashik onion demo lots with quantities 20, 35, 26, and 25 qtl, totaling exactly 106 qtl.
- Added persisted pool `POOL-NSK-ON-01` with four members and Shree Balaji requirement `REQ-B1-ONION-100` for 100 qtl, Grade A Red Onion at ₹2,030/qtl.
- Seed is safe to rerun and adds missing Feature 5 demo records without overwriting existing non-null buyer location/trust metadata.
- FastAPI startup now initializes the legacy schema and applies additive migrations; it does not seed data automatically.
- Added seed/count/idempotency tests; all 7 backend tests pass.

## Phase 3 completed

- Added `apps/api/app/services/advisory.py`, porting sale-window calculations, rounding, thresholds, labels, bilingual reasons, and empty-history fallback.
- Added `apps/api/app/services/market_data.py`, porting Data.gov.in/Agmarknet normalization, API-key aliases, bounded HTTP timeout, and `None` fallback behavior.
- Added `apps/api/app/services/weather.py`, porting all mandi coordinates, OpenWeatherMap mapping, spoilage logic, and deterministic telemetry fallback.
- Added FastAPI `GET /api/prices` and `GET /api/weather` routers and registered them without removing the original Next.js handlers.
- `/api/prices` preserves the fields consumed by `PriceDashboard` and `AdvisoryCard`, including history, comparisons, advisory, weather, and live-feed flag.
- Added advisory branch/fallback, weather fallback, route contract, and unknown-resource tests. Full Python suite passes with 16 tests.
- No React/UI redesign, proxy cutover, Next.js route removal, lots migration, negotiation migration, or Geo-Pooling algorithm was performed.

## Phase 4 completed

- Added `apps/api/app/routers/lots.py` with FastAPI `GET /api/lots` and `POST /api/lots`.
- Preserved the existing GET response shape: enriched lots, parsed `aiDefects` and `negotiationEvents`, buyers, and parsed `cropsWanted`.
- Preserved legacy POST fields/defaults and the `{ success, lotId }` success response.
- Added optional `variety`, `latitude`, `longitude`, `availableFrom`, `availableUntil`, `poolingEnabled`, and `poolingRadiusKm` request fields; old requests receive deterministic pooling defaults.
- Kept lot creation and initial ledger insertion transactional and parameterized.
- New Python server-generated listing text uses “AI-Assessed” wording; the original Next.js route remains untouched for parity.
- Added lots API tests covering seeded GET data, legacy POST requests, extended geo/pooling POST requests, and required-field validation. Full suite passes with 20 tests.
- No UI changes, Next.js route deletion, proxy cutover, negotiation migration, or pooling/matching algorithm was performed.

## Phase 5 completed

- Added Python `POST /api/negotiate` and `POST /api/voice-query` routes while keeping their original Next.js counterparts untouched for the later cutover.
- Ported the TypeScript offer thresholds and JavaScript-compatible rounding into `apps/api/app/services/negotiation.py`; Python exclusively determines action, amount, and status.
- A qualifying bid now creates `RecommendAccept` / `Recommended Accept`, which is explicitly not a sale and does not record a simulated settlement amount. Only `farmer_accept` transitions a lot to `Sold`.
- Finalization rejects any current price below `floor_price`; farmer counters are also rejected below that floor.
- Added bounded Gemini REST integration in `apps/api/app/services/gemini.py`. It may improve negotiation wording or resolve an otherwise ambiguous voice query, but may not change price/action/state and safely falls back when no usable key or response is present.
- Added deterministic English/Hindi/Marathi/Hinglish voice parsing before Gemini, preserving the frontend's existing voice response fields and advisory fallback.
- New generated copy uses “AI-Assessed” and “Simulated settlement”; no real-escrow or certification claim is introduced.
- Added unit and endpoint tests for floor protection, no auto-sale, explicit farmer confirmation, counter validation, Gemini numeric immutability, valid Gemini entity constraints, multilingual parsing, voice contract fields, and empty transcripts. Full Python suite passes with 32 tests.
- No React/UI changes, Next.js route deletion, proxy cutover, Geo-Pooling implementation, or buyer matching was performed.

## Phase 6 completed

- Captured representative legacy response shapes for prices, weather, lots, negotiation, and voice-query before cutover. All frontend-consumed fields have Python equivalents; the intentional negotiation improvement remains that `Recommended Accept` is not a sale.
- Added a configurable `beforeFiles` rewrite in `next.config.js`: browser calls to `/api/*` now proxy to `${PYTHON_API_URL:-http://127.0.0.1:8000}/api/*` without changing any fetch path in the React UI.
- Added `PYTHON_API_URL`, `KISANSETU_DB_PATH`, and demo-mode examples to `.env.example`; updated root `npm run seed` to invoke the Python seed and documented the two-process local run in `README.md`.
- Preserved the two interfaces the frontend needs in `lib/client-types.ts`; `AdvisoryCard` imports only those client types. No React component was converted to Python.
- After proxy validation, removed all five root Next API handlers and the migrated server-only TypeScript modules (`db`, seed/RNG, advisory, market data, weather, Gemini, and negotiation), plus the obsolete `better-sqlite3` frontend dependencies. FastAPI in `apps/api` is now the sole active server/business backend.
- Corrected the deterministic Hindi voice fallback for the exact UI quick-chip spelling `प्याज`.
- Verified the complete first-four-feature API flow through the post-removal Next proxy: price/advisory/weather, lot creation, below-floor counter, recommendation, explicit farmer finalization, and Hindi voice lookup (`onion/nashik`). Uvicorn logged every proxied request.
- Ran the full Python suite (32 passed; one existing TestClient deprecation warning) and `npm run build` successfully. No Geo-Pooling or buyer-matching implementation was added.

## Phase 7 completed

- Added `apps/api/app/services/pooling.py` with a pure Haversine calculation, grade mapping, crop/variety checks, availability-window compatibility (two-day configurable hand-off gap), radius filtering, deterministic ordering, and explainable rejection reasons.
- Added `apps/api/app/routers/pools.py` and registered `GET /api/pools/suggestions`, `GET/POST /api/pools`, `GET /api/pools/{id}`, and `POST /api/pools/{id}/join`.
- Suggestions are generated directly from active, pooling-enabled lots; a materialized pool has a deterministic ID and idempotent persistence. Joining a pool revalidates the anchor compatibility and records farmer acceptance transactionally.
- The seeded `LOT-GEO-PRIMARY` (20 qtl) now deterministically discovers `LOT-GEO-B` (35), `LOT-GEO-C` (26), and `LOT-GEO-D` (25): 86 nearby qtl and exactly 106 qtl total. Live API verification reported a 4.37 km maximum member distance.
- Added Geo-Pooling pytest coverage for identical/nearby Haversine values, crop/variety/grade/time/radius rejection, exact seeded quantity, explainable exclusions, fresh materialization, persisted detail, and join acceptance. Full Python suite passes with 36 tests.
- No buyer feasibility/scoring, buyer matching, Geo-Pooling React UI, or frontend flow change was implemented.

## Phase 8 completed

- Added deterministic RFQ endpoints: `GET /api/buyer-requirements` and `GET /api/matches?lotId=...` or `?poolId=...`.
- Implemented hard feasibility filtering before ranking: verified buyer, active requirement, crop, variety, minimum grade across every pooled member, quantity, unit, and delivery-window checks. Infeasible RFQs are returned only in `infeasibleMatches`, never as recommendations.
- Added backward-compatible trust scoring (the seeded verified buyer retains its deterministic 94/100 profile score) and an explainable fallback formula for future buyers without a stored score.
- Added normalized weighted ranking for feasible matches: quantity, quality, delivery distance, effective economic value, and trust. Effective value visibly deducts a capped demo transport estimate and demo handling cost from the buyer offer.
- The direct 20-qtl primary lot fails Shree Balaji's active 100-qtl requirement; `POOL-NSK-ON-01` with 106 qtl satisfies it and returns an explainable feasible match.
- Added matching/RFQ tests; the full Python suite passes with 40 tests. No frontend or workflow change was made in this phase.

## Phase 9 completed

- Added `GeoPoolingSection.tsx`, `PoolCard.tsx`, and `BuyerMatchCard.tsx`, following the existing green/amber cards, typography, buttons, and responsive layout.
- Added a Pool & Buyers navigation tab. The workflow is now Price → Lot → Geo-Pooling / Buyer Matching → Negotiation; newly published lots enter the pooling view instead of jumping directly to bargaining.
- The pooling view loads suggestions, materializes/joins the selected pool, retrieves only feasible buyer matches, displays explanation/effective-value details, and includes an explicit 106-qtl seeded demo fallback when a newly listed lot lacks Geo-Pooling metadata.
- “Negotiate with Buyer” reuses the existing `NegotiationSection`, preselects the buyer and anchor lot, and displays the selected 106-qtl pooled context without altering original-lot ownership.
- No negotiation pricing rule, buyer ranking rule, API contract, or unrelated screen was redesigned. `npm run build` passes after the UI change.

## Phase 10 completed

- Recreated the local SQLite demo database from a clean deterministic seed and exercised all five prototype features through the Next.js `/api/*` proxy with Gemini, OpenWeatherMap, and Data.gov.in/Agmarknet credentials unset.
- Verified deterministic price/weather fallbacks, an absent-Gemini negotiation result, the protected below-floor counter, explicit farmer-only finalization, Hindi voice parsing, the direct 20-qtl RFQ failure, and the 106-qtl pool's feasible Shree Balaji match.
- Verified a browser without `SpeechRecognition`/`webkitSpeechRecognition`; the UI continues to offer the deterministic quick voice-query chips without requiring a microphone.
- Closed the material pooled-handoff gap: `POST /api/negotiate` now accepts optional `poolId` only for a persisted pool containing the anchor lot, and farmer confirmation uses its stored 106-qtl quantity. Added tests for the 106-qtl ₹238,500 demo settlement and invalid pool context.
- Reworded visible prototype claims to use AI-assessed quality and simulated settlement terminology; no regulated certification, escrow, payment, or external transaction is claimed.
- Completed `README.md`, `docs/architecture.md`, `docs/api-spec.yaml`, and `docs/demo-script.md` with the current proxy architecture, API contract, fallback boundaries, and judge script.
- Full Python validation passes (`42 passed`, one TestClient deprecation warning) and `npm run build` passes.

## Stage 13 hygiene review completed

- Reviewed the working diff on `feature/python-backend-geopooling`; it contains the intended FastAPI cutover, deterministic Geo-Pooling/RFQ work, UI integration, and documentation. No architecture changes were introduced during review.
- Removed generated local SQLite data, Python bytecode/test caches, and the Next.js build directory. No committed secrets, temporary databases, or debug logs were found.
- Extended `.gitignore` for Python bytecode, pytest caches, and the local API virtual environment. Removed unused icon imports from the negotiation component.
- Re-ran the documented API test command from `apps/api` (`42 passed`, one upstream TestClient deprecation warning) and `npm run build` successfully. No push or pull request was created.

## Final blueprint audit completed

- Re-read the complete 3,003-line authoritative plan and audited the active frontend consumers, proxy, Python routers/services, SQLite migration/seed, deterministic algorithms, fallbacks, tests, and zero-byte architecture scaffolding.
- Fixed a High negotiation-state defect: `farmer_accept` now requires an actual buyer offer in `Recommended Accept` state. An untouched lot or an AI counter can no longer be finalized, while the independent floor check remains enforced. The UI exposes confirmation only in that valid state.
- Fixed a High judge-flow defect: deterministic `FIND_POOL` and `BEST_BUYER` voice intents now read the persisted 106-qtl pool and the hard-feasible Shree Balaji match. Quick chips keep both demonstrable without browser speech recognition or Gemini.
- Ran the complete judge scenario against a new isolated clean-seed database through the Next `/api/*` proxy with external keys absent: all five features, 20-qtl rejection, 106-qtl match, below-floor counter, premature-accept rejection, explicit farmer confirmation, ₹238,500 pooled demo settlement, and price/pool/buyer voice responses passed.
- Final validation passes with `44 passed` (one upstream TestClient deprecation warning) and a successful Next production build/type check.

## Operational notes

## UI language and voice accessibility foundation completed

- Kept the existing Next.js, TypeScript, Tailwind, and browser Web Speech stack; no dependency or backend architecture was added.
- Added a persistent navbar language selector with English, Hindi, and Marathi choices. The selected language is stored in `localStorage`, applied to the document language, and is available to the active React UI through one shared provider.
- Localized the persistent product chrome: desktop/mobile navigation, role label, live-status strip, voice entry point, and footer now change with the selected language.
- Updated the voice assistant controls, status states, errors, and action labels for all three languages. Browser speech output now requests `en-IN`, `hi-IN`, or `mr-IN`, selects a matching installed system voice when present, and safely falls back when a device does not offer that voice.
- Hindi uses the existing deterministic Hindi response where available. Marathi has a deterministic local market-rate spoken fallback so it can still announce a price without a third-party translation service.
- Ran `npm run build` successfully after the frontend changes. The only output was the existing non-fatal Webpack cache snapshot warning.

## Farmer-first landing and multilingual UI overhaul completed

- Replaced the former crop-filter-first landing screen with a farmer-oriented home page that explains the complete journey: check price, create a lot, join a nearby pool/find buyers, then negotiate and explicitly approve the sale.
- Added direct start actions, a four-step journey panel, expanded instructional cards, and plain-language safety assurances for the protected minimum price and farmer-only final approval.
- Rebuilt the navbar as a wider, simpler single-row desktop header using the available screen width (`1440px` shell, `1280px` content), shorter destinations, a dedicated Home entry, compact language/voice controls, and an independently scrollable mobile navigation row.
- Extended English/Hindi/Marathi UI switching across the landing page and the main static content in price/advisory, lot creation, Geo-Pooling, buyer matching, negotiation, and floating voice controls. Known demo crop, unit, grade, variety, status, match-reason, and negotiation-event labels are localized rather than leaking English into translated cards.
- Preserved user/buyer names, mandi names, numeric values, API identifiers, and standard abbreviations where translation would alter data identity.
- Visually verified the styled English and Marathi desktop landing pages, a 390×844 Marathi mobile layout, and Hindi/Marathi card content through the running app. Re-ran `npm run build`; compilation, static generation, and TypeScript validation pass with only the existing non-fatal Webpack cache warning.

## Harvest visual and multilingual speech correction completed

- Generated a project-owned transparent Indian harvest arrangement containing onions, tomatoes, chillies, okra, brinjal, cauliflower, coriander, and a woven basket. Added it as a low-opacity decorative layer behind the right-side journey cards with a green readability overlay; no new UI/runtime library was introduced.
- Fixed the actual cause of English speech after switching languages: the Python Geo-Pool/best-buyer endpoint previously returned English content in `spokenResponseHi`. Voice responses now contain deterministic English, Hindi, and Marathi wording for price, pool, buyer-match, unavailable-pool, and missing-rate outcomes.
- The voice request now includes the selected UI language, and browser speech explicitly requests an exact `en-IN`, `hi-IN`, or `mr-IN` system voice before using a same-language fallback voice.
- Added API assertions for Hindi and Marathi crop speech plus localized best-buyer speech. Focused voice tests pass (`4 passed`), the production frontend build passes, and the updated harvest hero was visually verified in the running app.

## Harvest layer readability adjustment completed

- Reduced the hero’s green wash so the transparent vegetable arrangement remains clearly visible: the image is now shown at higher opacity with only a light green readability overlay behind the journey cards.
- Confirmed the updated Marathi hero visually in the running app; cards remain readable while tomatoes, onions, chillies, okra, brinjal, cauliflower, coriander, and the harvest basket are visible.

## Farm hero and optional Sarvam speech completed

- Replaced the decorative harvest arrangement with a transparent, natural Indian farm landscape: vegetable rows, red-earth path, distant hills, farmhouse, water tank, and a small harvest basket. The farm scene remains readable behind the journey cards without the previous heavy green wash.
- Added an optional Python `/api/speech` adapter for Sarvam Bulbul text-to-speech. It reads `SARVAM_API_KEY` only from the backend environment, requests Hindi/Marathi (or English) WAV audio, and falls back to browser Web Speech when the key is absent or the provider is unavailable.
- The key supplied during development was not written to the repository, logs, or client bundle. Rotate it before enabling live requests because it was exposed in chat.
- Added mocked no-key coverage for the speech endpoint. Full Python tests and the Next production build pass after the integration.

## Voice Help Hindi/Marathi Sarvam activation completed

- Added automatic loading of the git-ignored `apps/api/.env` file at Python API startup while preserving real process environment variables as the higher-priority configuration source.
- Activated Sarvam only for the Voice Help spoken-response path; the secret remains backend-only and never enters the Next.js client bundle or API response.
- Localized all six Voice Help quick-query labels and transcripts for English, Hindi, and Marathi, and extended deterministic Marathi intent parsing for Geo-Pool and best-buyer questions.
- Verified live Sarvam synthesis through the Python adapter for both `hi-IN` and `mr-IN`. Browser Web Speech remains the bounded fallback when Sarvam is unavailable.
- Added local-env precedence and successful localized-audio endpoint tests. Full backend tests and the Next production build pass.

## Fresh blue-sky farm hero completed

- Edited the existing Indian farm hero in place to replace the dark/green-looking upper area with a natural blue morning sky and soft white clouds while preserving the vegetable rows, path, hills, farmhouse, water tank, and harvest basket.
- Increased the farm artwork opacity and reduced the green readability wash so the sky stays visibly blue behind the journey panel while the dark translucent cards remain legible.
- Corrected the journey-panel image fit from bottom-anchored `object-contain` to full-panel `object-cover`, removing the horizontal green seam and extending the blue sky cleanly to the rounded top edge.

- The Next frontend requires FastAPI to be running at `PYTHON_API_URL` (default `http://127.0.0.1:8000`) for `/api/*` calls.
- The checkout does not retain a checked-in `data/kisansetu.db` file; run `python -m app.seed` from `apps/api` to create/populate the local demo database.

## Exact recommended Phase 1 file plan

Create only the following under `apps/api`, leaving root `app/api/*`, root `lib/*.ts`, and React files untouched:

```text
apps/api/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app and GET /health only
│   ├── config.py               # environment settings and stable repository DB-path resolution
│   ├── db.py                   # sqlite3 connection helper; WAL, foreign keys, safe initialization
│   ├── schemas.py              # minimal health/database models only
│   ├── routers/
│   │   └── __init__.py         # package marker; no migrated API routes yet
│   └── services/
│       └── __init__.py         # package marker; no business logic yet
├── tests/
│   └── test_health.py          # health response and database-connection smoke test
├── requirements.txt            # FastAPI/Uvicorn/Pydantic/settings/test dependencies
└── README.md                   # exact local setup and run instructions for the Python API
```

Phase 1 acceptance criteria:

1. `GET /health` returns `{ "ok": true, "service": "kisansetu-python-api" }`.
2. The service can connect to `data/kisansetu.db` even when the file is initially absent, without destroying data if it exists.
3. The Python connection enables WAL and foreign keys.
4. The FastAPI test passes.
5. No Next.js route, React component, existing database schema, or Feature 5 logic is changed.

## Next Task

Stage 13: review the branch diff, remove only generated/temporary/debug artifacts, verify ignore rules, and rerun validation without pushing or creating a PR.
