# KisanSetu architecture

## Runtime path

```
React/Next.js browser UI
        |
        | same-origin /api/*
        v
Next.js rewrite (PYTHON_API_URL, default 127.0.0.1:8000)
        |
        v
FastAPI routers -> deterministic services -> SQLite (data/kisansetu.db)
```

The React/TSX application remains the presentation layer. `next.config.js`
preserves its existing relative `/api/*` calls and proxies them to the Python
service. FastAPI is the only active API/business backend.

## Backend responsibilities

| Layer | Responsibility |
| --- | --- |
| `app/routers` | Stable HTTP contracts for health, prices, weather, lots, negotiation, voice, pools, RFQs, and matches. |
| `app/services` | Deterministic advisory, market fallback, weather fallback, negotiation, voice parsing, Geo-Pooling, and buyer ranking rules. |
| `app/db.py` | SQLite connections, legacy-schema initialization, and additive/idempotent Geo-Pooling/RFQ migrations. |
| `app/seed.py` | Re-runnable deterministic demo dataset, including the 106 qtl Nashik onion pool and 100 qtl Shree Balaji RFQ. |

## Safety and fallback boundaries

- Python rules alone determine prices, counters, floors, match feasibility,
  rank, and settlement amount.
- Gemini is optional and may only improve negotiation wording or interpret an
  otherwise ambiguous voice request; it cannot alter numeric/state outcomes.
- Missing Gemini, OpenWeatherMap, Data.gov.in/Agmarknet, or browser speech
  recognition does not block the demo. Deterministic data/rules and quick voice
  query chips remain available.
- A recommended price is not a sale. Only `farmer_accept` finalizes, and final
  settlement rejects a value below the farmer floor.
- A pooled settlement accepts `poolId` only if the negotiated anchor lot is a
  persisted pool member; its quantity then comes from the persisted pool.

## Geo-Pooling and buyer matching flow

```
Lot -> compatibility/radius checks -> persisted pool -> RFQ hard filters
    -> weighted, explainable match -> bounded negotiation -> farmer confirmation
```

The seeded 20 qtl lot cannot satisfy Shree Balaji's 100 qtl RFQ directly.
Its compatible 35, 26, and 25 qtl neighbors make the exact 106 qtl pool,
which does satisfy the requirement.
