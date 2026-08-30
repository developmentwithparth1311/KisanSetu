# Current Repository Audit

Audit date: 2026-08-30  
Scope: Phase 0 of `KisanSetu_Repo_Migration_Python_GeoPooling_Codex_Plan.md`. This is an inspection-only baseline; no application code was changed.

## Executive summary

The running prototype is the root Next.js application. It contains the complete first-four-feature flow, root Next route handlers, and a runtime-created SQLite database. The directories under `apps/`, `services/`, and `infra/` describe a future multi-service layout but are not active implementations: their source/configuration files are empty. The migration should therefore converge on `apps/api` as the one FastAPI service, while preserving the root React/TSX UI and its existing relative `/api/*` calls.

The repository does not currently contain `data/kisansetu.db`; importing `lib/db.ts` creates it and its schema, and `npm run seed` populates it. No seeded database was generated during this audit.

## Active implementation

| Area | Evidence | Status |
| --- | --- | --- |
| Root Next.js app | Root `package.json` defines `dev`, `build`, `start`, and `seed`; `next.config.js` is configured for Next 14.2.5. | Active |
| Root UI | `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, and all seven root `components/*.tsx` files contain implementation. | Active |
| Root API | `app/api/{prices,weather,lots,negotiate,voice-query}/route.ts` contain the only implemented HTTP handlers. | Active |
| Root business/data layer | `lib/db.ts`, `seed.ts`, `seeded-random.ts`, `advisory-engine.ts`, `market-data.ts`, `weather.ts`, `gemini.ts`, and `negotiation-agent.ts` contain implementation and are imported by the routes. | Active |
| Seed inputs | `data/seed/crops-mandis.json` and `data/seed/buyers.json` are populated and are read by `lib/seed.ts`. | Active |

### User-facing feature flow today

`app/page.tsx` manages three client-side views: `price`, `lots`, and `negotiation`.

1. `PriceDashboard` displays prices and advisory data.
2. `LotCreationWizard` performs a client-side simulated quality scan and creates a lot.
3. Successful lot creation immediately selects the `negotiation` view.
4. `NegotiationSection` loads lots/buyers and simulates bids and farmer acceptance.
5. `VoiceAssistantModal` uses browser speech recognition/synthesis and sends the transcript to the API.

No Geo-Pooling or buyer-matching implementation exists yet.

## Frontend API-consumer map

All current consumers use same-origin relative paths. Preserve these paths and the listed fields through API-parity phases.

| Consumer | Request | Request body / query | Response fields used by the UI |
| --- | --- | --- | --- |
| `components/PriceDashboard.tsx` | `GET /api/prices` | `crop`, `mandi`, `days` query parameters | `crops`, `mandis`, `selectedCrop`, `selectedMandi`, `priceHistory` (`date`, `modal_price`, `min_price`, `max_price`, `arrival_volume`), `advisory`, `weather`, `isLiveAgmarknet` |
| `components/LotCreationWizard.tsx` | `POST /api/lots` | `farmerName`, `farmerPhone`, `cropId`, `mandiId`, `quantity`, `unit`, `photoUrl`, `aiGrade`, `aiConfidence`, `aiDefects`, `floorPrice`, `targetPrice` | `success`, `lotId` |
| `components/NegotiationSection.tsx` | `GET /api/lots` | none | `lots`, `buyers`; used lot fields include `id`, `floor_price`, `target_price`, `quantity`, `unit`, `status`, `negotiationEvents`, crop/mandi display fields; buyer `id`, `name`, and display/trust fields are rendered |
| `components/NegotiationSection.tsx` | `POST /api/negotiate` | Bid: `lotId`, `action: "buyer_bid"`, `buyerId`, `buyerName`, `offerAmount`, `customMessage`; acceptance: `lotId`, `action: "farmer_accept"` | Bid: `success`, optional `isGeminiPowered` (then lots are reloaded); acceptance: `success` (then lots are reloaded) |
| `components/VoiceAssistantModal.tsx` | `POST /api/voice-query` | `transcript` | `spokenResponse` or `spokenResponseHi` is passed to browser speech synthesis; returned result is also rendered, including crop/mandi/price/advisory data |

`/api/weather?mandi=<id>` has an implemented handler, but no root TSX component directly calls it; `GET /api/prices` already embeds `weather`.

## Implemented API contracts and responsibilities

| Route | Current implementation |
| --- | --- |
| `GET /api/prices` | Reads crops, mandis, and price history from SQLite; computes advisory; obtains weather; tries Data.gov.in/Agmarknet; returns deterministic/local fallbacks where those integrations are unavailable. |
| `GET /api/weather` | Returns `fetchMandiWeather(mandiId)`. |
| `GET /api/lots` | Returns all lots enriched with crop, mandi, parsed defects, and negotiation events; returns buyers with parsed `cropsWanted`. |
| `POST /api/lots` | Validates required listing fields, inserts a lot, creates an initial negotiation event, and returns `{ success, lotId }`. |
| `POST /api/negotiate` | Supports `buyer_bid` and `farmer_accept`. It stores events, invokes deterministic negotiation logic, optionally asks Gemini for wording, updates the lot, and returns updated negotiation state. The declared `farmer_counter` action is not implemented. |
| `POST /api/voice-query` | Parses a transcript with Gemini when configured or deterministic multilingual keyword matching otherwise; reads crop/mandi history, computes advisory, and returns spoken English/Hindi text and data. |

## Current SQLite schema

Source of truth: idempotent `CREATE TABLE IF NOT EXISTS` statements in `lib/db.ts`. The file opens `data/kisansetu.db` relative to the process working directory and sets `PRAGMA journal_mode = WAL`. No foreign-key pragma or migrations are currently present.

| Table | Columns |
| --- | --- |
| `crops` | `id` PK, `name`, `icon`, `unit`, `unit_short`, `perishability`, `base_price`, `volatility`, `description`, `grades_json` |
| `mandis` | `id` PK, `name`, `state`, `distance_km`, `badge` |
| `price_points` | `id` integer PK autoincrement, `crop_id`, `mandi_id`, `date`, `min_price`, `max_price`, `modal_price`, `arrival_volume`; unique on `(crop_id, mandi_id, date)` |
| `buyers` | `id` PK, `name`, `type`, `location`, `trust_score`, `rating`, `completed_trades`, `payment_speed`, `crops_wanted`, `avatar` |
| `lots` | `id` PK, `farmer_name`, `farmer_phone`, `crop_id`, `mandi_id`, `quantity`, `unit`, `photo_url`, `ai_grade`, `ai_confidence`, `ai_defects`, `floor_price`, `target_price`, `current_offer`, `highest_bidder_id`, `highest_bidder_name`, `status` (default `Active`), `escrow_amount`, `escrow_status`, `created_at` |
| `negotiation_events` | `id` integer PK autoincrement, `lot_id`, `sender_type`, `sender_name`, `amount`, `message`, `action_type`, `created_at` |

`lib/seed.ts` deterministically generates 91 dated price points for each crop/mandi combination (offsets 90 through 0), seeds crops and buyers from JSON, and creates demonstration lots/events. It exits early if any crop already exists; it is not a reset command.

## TypeScript-to-Python migration surface

The following are server-side or server-business-logic code and are the Phase 2–5 migration source. They should not be removed until FastAPI contract parity has been tested.

| TypeScript source | Target responsibility |
| --- | --- |
| `app/api/prices/route.ts` | FastAPI prices router |
| `app/api/weather/route.ts` | FastAPI weather router |
| `app/api/lots/route.ts` | FastAPI lots router |
| `app/api/negotiate/route.ts` | FastAPI negotiation router |
| `app/api/voice-query/route.ts` | FastAPI voice router |
| `lib/db.ts` | `apps/api/app/db.py`: connection, schema initialization, additive migrations |
| `lib/seed.ts`, `lib/seeded-random.ts` | Python seed module and deterministic RNG service |
| `lib/advisory-engine.ts` | advisory service |
| `lib/market-data.ts` | market-data service with bounded HTTP timeout and null fallback |
| `lib/weather.ts` | weather service with deterministic fallback |
| `lib/gemini.ts` | Gemini wording/entity-parsing service with deterministic fallback |
| `lib/negotiation-agent.ts` | deterministic negotiation service; preserve hard floor invariant |

The following remain browser/frontend code: `app/page.tsx`, `app/layout.tsx`, all root `components/*.tsx`, and `app/globals.css`. The browser speech APIs and client-side simulated grading remain in React. Frontend changes are out of Phase 0 scope.

## Scaffolding and inactive areas

| Location | Audit result |
| --- | --- |
| `apps/api/` | `package.json` describes an intended TypeScript API, but `src/server.ts`, DB client, all middleware, and every module are zero-byte files. This is the approved target location for the future FastAPI service. |
| `apps/web/` | Intended duplicate Next app; package manifest exists but `next.config.js`, app files, PWA manifest, API client, auth/i18n, and voice components are zero-byte. |
| `apps/voice-gateway/` | Package manifest exists but server, telephony, pipeline, intent, and scheduler files are zero-byte. |
| `services/ai-engine/` | `requirements.txt`, Dockerfile, `main.py`, Python modules, and model placeholder are zero-byte. It is not an implemented FastAPI service. |
| `packages/` | `config`, `constants`, and `types` contain tiny package/config declarations and trivial exports; root `package.json` does not define workspaces and the root app does not import them. Currently unreferenced scaffolding. |
| `infra/` | Dockerfiles and GitHub Actions files exist but are zero-byte. `docker-compose.yml` is also zero-byte. |
| `docs/` | Existing `api-spec.yaml`, architecture, compliance, and voice-flow documents are zero-byte placeholders. |
| `data/seed/buyers-simulated.json`, `logistics-providers.json`, `mandi-prices-historical.csv` | Zero-byte and unused. |

`turbo.json` defines generic tasks but root `package.json` has no workspaces/turbo scripts. It does not currently orchestrate the active app.

## Environment variables and external integrations

`.env.example` declares:

- `PORT` and `NODE_ENV`
- `GEMINI_API_KEY` — Gemini negotiation wording and voice entity extraction; deterministic fallbacks exist.
- `OPENWEATHER_API_KEY` — weather lookup; deterministic mandi defaults exist.
- `DATA_GOV_IN_API_KEY` — Data.gov.in/Agmarknet lookup; route continues with SQLite data when absent or failing.

`lib/market-data.ts` also recognizes `AGMARKNET_API_KEY` as an alias. No Python-specific variables are present yet.

## Migration risks and safeguards

1. **Relative routing collision:** current local Next handlers own `/api/*`. Do not introduce a rewrite/proxy or remove these handlers until FastAPI parity tests succeed.
2. **Contract drift:** components use both snake_case database-shaped fields and camelCase enriched fields. Search the consumers before renaming anything.
3. **Database path:** the current database path uses `process.cwd()`, which is fragile outside root. Python must resolve the repository data path explicitly and keep WAL mode; migrations must be additive and idempotent.
4. **No checked-in database:** Phase 1 must tolerate an absent `data/kisansetu.db`; it must not assume the old seed has already run.
5. **Fallback parity:** missing keys/network failures are normal demo paths, not errors. Keep all three deterministic fallbacks.
6. **Negotiation semantics:** current deterministic engine can return `Accept` before the farmer’s explicit action, and the route sets escrow-like state. The Python port must distinguish recommendation from farmer finalization and never accept below floor.
7. **Prototype claims:** existing UI/server strings include “AI Certified” and real-escrow language. The specified wording cleanup belongs to later migration/UI phases, not this audit.
8. **Scaffolding ambiguity:** do not activate, delete, or rely on the empty `apps/web`, voice gateway, AI engine, Docker, or CI skeletons during the parity migration.

## Phase 0 conclusion

The correct baseline is one active root Next.js prototype plus one empty future-backend target at `apps/api`. Phase 1 should add only the FastAPI skeleton and health/database connectivity there, leaving every root `app/api` route and frontend call untouched.
