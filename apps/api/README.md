# KisanSetu Python API

This FastAPI service is the active KisanSetu backend. The Next.js frontend
keeps its `/api/*` fetch paths and proxies them here.

## Run locally

From `apps/api`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The default database path is the repository's `data/kisansetu.db`, resolved
from the module location rather than the current working directory. Override it
with an absolute `KISANSETU_DB_PATH` when needed.

Check the service at <http://127.0.0.1:8000/health>.

## Lots API (Phase 4)

The Python service provides `GET /api/lots` and `POST /api/lots` with the
existing frontend contract. Legacy POST fields remain accepted unchanged.
Optional pooling fields are `variety`, `latitude`, `longitude`,
`availableFrom`, `availableUntil`, `poolingEnabled`, and `poolingRadiusKm`.
The stable browser contract is served by FastAPI through the Next.js proxy.

## Negotiation and voice APIs (Phase 5)

`POST /api/negotiate` supports the existing `buyer_bid`, `farmer_accept`, and
`farmer_counter` actions. Offer amounts, counters, and statuses are always
computed by deterministic Python rules. A qualifying offer is only marked
`Recommended Accept`; the farmer must call `farmer_accept` before a lot is
sold. The server rejects every finalization or farmer counter below the lot's
floor price.

`POST /api/voice-query` preserves the existing voice response fields. It parses
known English, Hindi, Marathi, and Hinglish crop/mandi phrases locally, using
Gemini only for ambiguous entity interpretation. `GEMINI_API_KEY` is optional:
without a valid key or usable response, both endpoints use deterministic
fallbacks. Gemini can improve negotiation wording but cannot change a numeric
result, decision, or state.

`POST /api/speech` optionally synthesizes the already-localized response with
Sarvam `bulbul:v3`. Set `SARVAM_API_KEY` in the Python process environment or
in the git-ignored `apps/api/.env` file. Process environment values take
priority; never commit the local file. The route returns `available: false`
when the key is missing or the bounded external call fails, allowing the
frontend to use the browser's `speechSynthesis` fallback without blocking the
demo.

The deterministic parser also supports the required Feature 5 intents **Show
my pool** and **Who is my best buyer?**. Their results reuse the persisted pool
and the same hard-feasibility/match-scoring rules as `/api/matches`.

## Geo-Pooling and buyer matching API

The deterministic Geo-Pooling backend provides:

- `GET /api/pools/suggestions?lotId=...`
- `GET /api/pools` and `GET /api/pools/{id}`
- `POST /api/pools` with `{ "lotId": "..." }`
- `POST /api/pools/{id}/join` with `{ "lotId": "..." }`

Suggestions require compatible crop, variety (or an unspecified variety),
grade, availability, and radius. The seeded primary onion lot discovers the
35, 26, and 25 qtl nearby lots for an exact 106 qtl potential supply.

Buyer requirements and ranked matches are available at:

- `GET /api/buyer-requirements?activeOnly=true`
- `GET /api/matches?lotId=...` or `GET /api/matches?poolId=...`

Hard feasibility runs before ranking. The seed therefore returns Shree Balaji's
100 qtl requirement in `infeasibleMatches` for the 20 qtl lot and a feasible,
explainable match for `POOL-NSK-ON-01`. A negotiated pooled settlement may
include `poolId`; it is accepted only when the selected lot belongs to that
persisted pool and then uses the pool's stored total quantity.

## Seed the demo database

From `apps/api`, after installing dependencies:

```powershell
python -m app.seed
```

The command creates the legacy tables if needed, applies additive Geo-Pooling
migrations, preserves existing rows, and seeds the original deterministic demo
dataset plus the labeled 20 + 35 + 26 + 25 = 106 qtl Nashik onion pool and
Shree Balaji's 100 qtl buyer requirement. Re-running it is safe and does not
duplicate records.

## Tests

```powershell
python -m pytest -q
```

The Python seed does not replace or delete existing SQLite rows.
