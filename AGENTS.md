# KisanSetu Coding Agent Rules

1. Preserve the existing working Next.js UI.
2. “TypeScript to Python” means server/API/business logic, never browser React/TSX.
3. `apps/api` is the sole target Python FastAPI backend.
4. Do not keep parallel TypeScript and Python backends after the tested parity cutover.
5. Port behavior first; refactor afterward.
6. Before changing an API field, search every frontend consumer.
7. Deterministic code owns hard decisions; Gemini may only help with language and ambiguous interpretation.
8. Never accept a negotiation below the farmer floor.
9. A recommendation to accept is not a final sale; explicit farmer action is required.
10. Geo-Pooling must use deterministic location and compatibility logic, not LLM clustering.
11. Buyer hard constraints run before match scoring.
12. Keep seeded demo behavior deterministic.
13. Every external integration needs a bounded-time fallback.
14. Do not describe AI quality output as certified.
15. Do not present simulated settlement as regulated real escrow.
16. Run relevant tests after each migration or feature phase.
17. Update `PROGRESS.md` after each meaningful task.
18. Avoid unrelated platform complexity: no Kafka, Kubernetes, blockchain, or microservice sprawl.
19. Do not delete existing API routes or server TypeScript until documented FastAPI parity tests pass.
20. Treat `apps/web`, `apps/voice-gateway`, `services/ai-engine`, and infra files as scaffolding unless a fresh audit proves otherwise.
