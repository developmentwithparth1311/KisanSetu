# Clean-seed judge demo

## Prepare

1. Leave `GEMINI_API_KEY`, `OPENWEATHER_API_KEY`, and `DATA_GOV_IN_API_KEY`
   unset to demonstrate deterministic fallbacks.
2. From `apps/api`, run `python -m app.seed`.
3. Start FastAPI on port 8000, then start Next.js from the repository root.
4. Open the Next.js URL. The browser still calls `/api/*`; Next proxies to
   FastAPI by default.

## Five-feature walkthrough

1. **Price and advisory** — Select Tomato/Nashik. Confirm the price chart,
   advisory, weather, and mandi comparison render from seeded fallback data.
2. **Lot creation and AI assessment** — Use the listing wizard to create a
   demo lot. The client-side AI-assessed grade remains a prototype assessment,
   not a certification.
3. **Bounded negotiation** — Choose the primary onion lot and Shree Balaji.
   Submit a bid below the floor: Python returns a protected counter. Submit
   ₹2,250/qtl: it is only a recommendation. Press farmer confirmation to
   record the simulated settlement.
4. **Voice query** — If browser speech recognition is unavailable, select the
   Hindi onion, **Show my pool**, or **Who is my best buyer?** quick chip. Each
   returns a deterministic spoken/visual answer; no microphone or external
   service is required.
5. **Geo-Pooling and buyer match** — Open **Pool & Buyers** and use the
   seeded 20 qtl onion lot. Its individual buyer match is infeasible for
   Shree Balaji's 100 qtl RFQ. Load/materialize the compatible 35 + 26 + 25
   qtl lots, producing the exact 106 qtl pool. The same RFQ becomes feasible,
   with trust, effective value, score, and reasons shown. Handoff to
   negotiation and confirm at ₹2,250/qtl: the stored demo settlement is
   ₹238,500 for 106 qtl.

## Expected offline behavior

- Market feed and weather return deterministic local values.
- Gemini is not needed for voice parsing or negotiation outcomes.
- A browser without speech recognition presents the quick-query alternative.
- No actual certification, escrow, payment, or external transaction occurs.
