
# KisanSetu: A Web-Based, Voice-Enabled Market Intelligence & Farmer–Buyer Linkage Platform



---

## 0. Executive Summary

KisanSetu is a **responsive web platform (PWA)** — no native app required — that gives farmers real-time, multi-market price visibility, AI-driven advice on *when* to sell, verified-buyer matching, AI-assisted price negotiation within farmer-set bounds, and secure payment tracking — all made accessible to low-literacy, low-smartphone-access farmers through an integrated **voice agent powered by Sarvam AI** (in-browser + phone-call based). Identity (Aadhaar/PAN/KCC) is captured for government scheme linkage using **compliant, tokenized, encrypted storage** — not raw document storage — so the platform is both government-integrable and legally sound.

---

## 1. Problem Statement Alignment

| PS Requirement | KisanSetu Module |
|---|---|
| Price visibility across mandis, processors, institutional buyers, digital channels | Price Intelligence Engine (M1) |
| Fragmented quality/demand/logistics/storage/payment/buyer-credential info | Buyer Trust Registry (M2) + Lot Passport (M5) |
| Distress selling due to liquidity/storage constraints | AI Sale-Window Advisory (M3) |
| Weak bargaining power of smallholders | FPO Pooling (M4) + AI Negotiation Agent (M6b) |
| Buyers struggle to aggregate volume & verify quality | Digital Lot Creation + AI Grading (M5) |
| Reliable farm-gate-to-buyer linkage | Matching Engine + Digital Offers (M6) |
| Logistics coordination | Logistics & Storage Marketplace (M7) |
| Payment tracking | Escrow Payment Tracker (M8) |
| Dispute/grievance process | Grievance Redressal (M9) |
| Transparent transaction records | Immutable Transaction Ledger (M10) |

---

## 2. Why Web (PWA), Not Native App

- Built as a **Progressive Web App**: installable to homescreen, offline caching of prices/lots, push notifications — all standard web-stack capability (React/Next.js + service workers), matching the team's actual skillset.
- No app-store distribution overhead — instant demo via shareable link, faster iteration.
- Voice + SMS/IVR channel (Section 5) already covers the non-smartphone user segment, so app-vs-web is a non-issue for that group.

---

## 3. Complete Website Structure (Pages & Features)

### A. Public / Pre-Login
| Page | Contents |
|---|---|
| Landing Page | Value proposition, language selector (10+ Indian languages), "Login/Register" and "Call Us to Register" CTA |
| About / How It Works | Simple explainer (illustrated, low-text) for how a farmer sells via the platform |
| Help / FAQ | Common questions, contact support, link to voice-assistant callback |

### B. Authentication
| Page | Contents |
|---|---|
| Register/Login | Mobile number entry → OTP verification (see Section 6) |
| Role Selection | Farmer / FPO Representative / Buyer / Government Official |
| eKYC & Identity Verification | One-time Aadhaar/PAN/KCC capture flow (tokenized, see Section 6) |
| Consent & Data Management | What data is collected, why, who can access it (govt schemes), option to view/download/request deletion per DPDP Act rights |

### C. Farmer Portal
| Page | Contents |
|---|---|
| Dashboard | Live price ticker for their crops, active lots, pending offers, sale-window alert banner, notifications |
| Price Explorer | Search any crop/mandi, view price trend charts (7/30/90-day), compare nearby mandis |
| Sale-Window Advisory | "Sell now / Wait X days / Store" recommendation with plain-language reasoning |
| Create Lot | Upload photos → AI grading result shown → enter quantity, harvest date, set price floor/target (for negotiation agent) |
| My Lots | Status of each listing: Active / Under Negotiation / Sold / Delivered |
| Offers & Negotiation | Live view of buyer offers, AI negotiation agent's counter-offer log, accept/reject/manual override |
| Logistics & Storage | Book shared transport, view/reserve nearby cold storage or warehouse slots |
| Payments | Escrow status per transaction (Held / Released), payment history |
| Warehouse Loan (extension) | If produce is stored, view eligibility to borrow against warehouse receipt |
| Grievance Center | File a dispute (voice or text), track resolution status |
| FPO Membership | Join/view FPO, see pooled-lot contributions |
| Profile & KYC | Masked Aadhaar/PAN/KCC display, verification status, edit bank details |
| Voice Assistant | Persistent mic icon + "Call me instead" option on every page |

### D. FPO Portal (extends Farmer Portal)
| Page | Contents |
|---|---|
| FPO Dashboard | Total members, aggregate volume, average price realised, active pooled lots |
| Member Management | Add/verify farmer members, view individual contribution to pooled lots |
| Pooled Lot Creation | Combine multiple farmers' produce into one large lot for institutional-scale deals |
| Payment Distribution | Auto-split incoming payment proportionally to contributing farmers |

### E. Buyer Portal
| Page | Contents |
|---|---|
| Buyer Dashboard | Browse available lots — filter by crop, grade, quantity, location, price |
| Buyer KYC/Registration | GST, mandi license/APMC registration upload, verification status |
| Post Requirement | Specify crop, quantity, quality spec, price band, delivery timeline |
| Lot Details & Offer | View lot passport (photos, AI grade, harvest date), submit offer, negotiate via AI agent |
| Demand Forecast Dashboard | Predicted arrival volumes by region/crop (from UPAg + historical data) |
| Transaction History | Past purchases, dispute record, trust score |
| Logistics Coordination | Track pickup/delivery status |
| Grievance Center | Buyer-side dispute filing |

### F. Government / Admin Portal (separate secure login)
| Page | Contents |
|---|---|
| Aggregated Analytics | Region-wise price trends, arrival volumes, scheme-relevant aggregated stats (anonymised by default) |
| Verified Farmer Registry Access | Audited, purpose-logged access to specific farmer records for scheme delivery (KCC-linked benefits, PM-KISAN cross-verification etc.) — **not** open browsing |
| Dispute Oversight | Escalated grievances requiring regulatory attention |
| Platform Health Metrics | Usage, transaction volume, adoption stats by district |

### G. Shared / Cross-Cutting
- Multilingual toggle (persists across all pages)
- Voice Assistant widget (in-browser mic + "request a call" option) available platform-wide
- Terms of Service, Privacy Policy
- Notification center (SMS/WhatsApp/in-app synced)

---

## 4. Voice Agent Integration — Exact Touchpoints (Powered by Sarvam AI)

| Touchpoint | What It Does | Sarvam AI Component Used |
|---|---|---|
| In-browser voice query | Farmer speaks a price/advisory question on the web app; browser-based ASR + backend NLU answers via TTS | **Saaras** (ASR) + **Sarvam-105B** (conversational AI) + **Bulbul** (TTS) |
| Phone call-in (IVR-style, but conversational) | Farmer without reliable internet calls a toll-free number, converses naturally in their language for prices/advisory | **Saaras** (ASR) + **Sarvam-105B** (dialogue management) + **Bulbul** (TTS) via Twilio/Gupshup telephony |
| Voice-guided lot creation | Describes produce verbally while uploading photos — structures into the digital lot listing | **Saaras** (ASR) + **Sarvam-105B** (entity extraction for crop type, quantity, quality) |
| Outbound proactive calls | Platform calls farmer when: sale-window advisory flags urgency, an offer arrives, storage slot is expiring | **Bulbul** (TTS) for message delivery + **Saaras** (ASR) for farmer response |
| Voice-guided OTP/login | Agent walks farmer through OTP entry conversationally (voice is the *experience* layer, OTP remains the *security* mechanism — see Section 6) | **Bulbul** (TTS) for reading OTP prompts + **Saaras** (ASR) for voice input |
| Voice grievance filing | Farmer describes a complaint verbally; auto-transcribed and structured into a ticket | **Saaras** (ASR) + **Sarvam-105B** (complaint categorization & structuring) |
| Voice negotiation outcome updates | "You've received a final offer of ₹22/kg from a verified buyer — accept?" — spoken, confirmed by voice or keypress | **Bulbul** (TTS) + **Saaras** (ASR) for confirmation |

### Sarvam AI Stack Details:

**1. Saaras (Automatic Speech Recognition)**
- Purpose: Converts farmer's spoken input (Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia) into text
- Integration: Real-time streaming ASR via Sarvam AI REST API
- Optimized for: Indian accents, agricultural terminology, noisy field conditions

**2. Sarvam-105B (Large Language Model)**
- Purpose: Conversational AI backbone for understanding farmer intent, extracting structured data (crop names, quantities, dates), generating natural responses
- Integration: API-based calls for:
  - Intent classification ("What's the tomato price?" → price_query intent)
  - Entity extraction ("500 kg onions harvested yesterday" → quantity=500, unit=kg, crop=onion, harvest_date=yesterday)
  - Dialogue management (multi-turn conversations, clarification questions)
  - Response generation in farmer's language
- Fine-tuned for: Agricultural domain, Indian languages, farmer query patterns

**3. Bulbul (Text-to-Speech)**
- Purpose: Converts platform responses into natural-sounding speech in 10+ Indian languages
- Integration: Sarvam AI TTS API
- Features: Natural prosody, gender/voice customization, emotional tone control for urgent vs. informational messages

**Telephony Integration:**
- **Twilio/Gupshup** provides the call infrastructure (SIP trunking, phone number provisioning, call routing)
- **Sarvam AI** handles all the language intelligence (what was said, what to say back)
- Architecture: Incoming call → Twilio/Gupshup → WebSocket stream to Sarvam Saaras → text to backend logic → response text to Sarvam Bulbul → audio stream back to call

**Why Sarvam AI specifically:**
- Purpose-built for Indian languages with domain-specific models (agriculture, finance, healthcare)
- Single vendor for end-to-end voice pipeline (ASR + LLM + TTS) = simpler integration, consistent quality
- Government-backed (part of India AI Mission), making it suitable for public-good/government-linkable projects
- Handles code-mixing naturally (farmers often mix Hindi/English or Tamil/English)
- Compliance-friendly (data residency in India, aligned with DPDP Act requirements)

**Fallback/Hybrid Strategy:**
- For very basic keyword-based IVR flows (press 1 for prices, press 2 for help), use **Web Speech API** (in-browser) or **Twilio's built-in speech recognition** as a lightweight backup
- For full conversational AI (complex queries, multi-turn dialogue), **Sarvam AI** is the primary engine
- **Bhashini** can serve as a secondary/backup option for translation/transliteration if needed (government-provided, free tier available)

---

## 5. Authentication & Identity — Designed Correctly, Not Just Simply

### 5.1 Login (day-to-day use)
- **Mobile number + OTP** (via Twilio Verify / MSG91 / Firebase Phone Auth) — no password to remember, leak, or overhear. This is the same standard used by UPI, PM-KISAN, and e-NAM.
- For feature-phone users: **IVR-based OTP** — the voice agent (powered by **Sarvam Bulbul** for reading OTP + **Saaras** for capturing spoken input) calls back and reads/collects the OTP, keeping the experience voice-first without making voice itself the credential (spoken passwords are insecure — easily overheard/recorded in shared-phone, public-mandi settings).
- **Assisted login role** for FPO field staff to help farmers transact on shared/family phones, under their own separate audited credentials.

### 5.2 One-Time Identity Verification (Aadhaar / PAN / KCC) — Compliant Design

This is the part most student projects get wrong, so it's worth being precise:

- **Aadhaar is never stored as a raw number.** Under UIDAI regulations, only licensed AUA/KUA entities (or their bank/NBFC/government partners) can perform Aadhaar-based eKYC, and any Aadhaar data held must sit in a UIDAI-compliant **Aadhaar Data Vault** with masking and tokenization.
- **Design:** eKYC verification is performed through an existing licensed partner (a partnering bank/NBFC, or routed through an existing government scheme's KYC infrastructure such as PM-KISAN/e-NAM's verification layer) rather than the platform independently obtaining UIDAI access. The platform receives back a **verification status + tokenized reference ID**, and stores only the **last 4 digits (masked)** for display purposes — the full number never touches the application database.
- **PAN and KCC details** are stored **AES-256 encrypted at rest**, access-restricted by role, with every access attempt **audit-logged** (who accessed what, when, why) — critical for the "so govt can access the data" requirement, since government access must be a controlled, auditable API call, not open database access.
- **Consent-first:** Farmer explicitly consents at registration to which government bodies/schemes can access their verified data, viewable/revocable anytime from the Consent & Data Management page — aligned with the **DPDP Act 2023** purpose-limitation principle.
- **Government access model:** a scoped, authenticated API/dashboard (Section 3F) that government officials use to query *specific, purpose-justified* records (e.g., KCC-linked subsidy delivery) — every query logged, not a bulk data dump.

**For your hackathon build:** simulate the UIDAI/bank eKYC call (mock response), but keep the **tokenization + masking + audit-log** architecture real — that's the part that shows judges you understand the compliance reality, not just the happy path.

---

## 6. Data Sources — Real vs. Simulated

### Real, live-integrable government/open data
| Source | What It Provides | Access |
|---|---|---|
| data.gov.in — "Current Daily Price of Various Commodities" (AGMARKNET-sourced) | Daily wholesale max/min/modal prices, updated regularly | Public Catalog API, free API key |
| e-NAM (enam.gov.in) | Real-time trading data, price dashboard, registered mandi info | Public dashboard + registration-based data access |
| UPAg (Unified Portal for Agricultural Statistics) | Crop profiles, production/arrival statistics | Public portal |
| data.gov.in — IMD weather datasets | Weather data for the sale-window/spoilage-risk model | Same API key as above |
| AIKosh (India AI dataset repository) | Backup mirror of the same AGMARKNET price dataset | Public, Open Government License |

### Real historical data for demo pre-seeding
- Kaggle: "Indian Agricultural Mandi Prices (2023–2025)" — onion, tomato, potato, wheat, rice
- Kaggle: "Daily Wholesale Commodity Prices – India Mandis"
*(Both are real government-sourced data, pre-downloaded for demo reliability, with a live API "refresh" call shown on top to prove the real integration works.)*

### Simulated for prototype (no public dataset exists — be explicit about this to judges)
- Buyer KYC/credential profiles, trust scores (8–10 realistic seeded profiles)
- Logistics/transporter listings and rates
- Payment/escrow transactions — use a **payment gateway sandbox (e.g., Razorpay Test Mode)** to realistically simulate escrow hold/release rather than fully mocking it
- AI grading training images — small labeled dataset (Kaggle crop-quality/defect sets) rather than real farmer submissions
- Aadhaar/PAN/KCC eKYC responses — mocked verification service call, real storage/security architecture

---

## 7. AI/ML Components (feasible for a web-focused team)

| Component | Approach | Why Feasible |
|---|---|---|
| Price forecasting (Sale-Window Advisory) | Facebook Prophet (time-series), served via a small Python FastAPI microservice | Prophet needs minimal ML expertise, quick to stand up, called via simple REST endpoint from the web app |
| Quality grading (image-based) | Train via **Google Teachable Machine** (no-code image classifier) → export as TensorFlow.js model → run **directly in-browser** | No deep ML background needed; runs client-side, no separate inference server required |
| Conversational AI (Voice Agent) | **Sarvam-105B LLM** via API for intent understanding, entity extraction, dialogue management | API-based integration, no model training/hosting required — just prompt engineering and API calls |
| Buyer trust scoring | Simple weighted rule-based score (payment punctuality %, dispute count, rating average) — no ML needed, just a formula | Fully within standard backend logic |
| Demand forecasting (buyer dashboard) | Basic moving-average/statistical model on historical arrival data | Lightweight, doesn't require deep ML |

This keeps every AI component either **no-code-trainable**, **API-based (Sarvam AI)**, or a **thin, well-documented Python microservice** callable via REST — realistic given the team's web-dev background.

---

## 8. AI Negotiation Agent (M6b) — Recap

- Farmer sets a **price floor** (minimum acceptable) and **target price** (suggested by the Sale-Window Advisory) when creating a lot.
- Incoming buyer offers are met with automated counter-offers within that bound, factoring in: competing buyer interest, perishability, time-to-sale-window, buyer trust score.
- Final offer within bounds is either auto-accepted (if farmer opts in) or presented for one-tap/voice confirmation (using **Sarvam Bulbul** to read out the offer and **Saaras** to capture spoken acceptance).
- Every counter-offer logged transparently in the Transaction Ledger (M10) — no black-box negotiation.
- Safeguard: slight randomized margin in agent responses so buyers can't easily probe/reverse-engineer the floor price.

---

## 9. Full Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React), Tailwind CSS, PWA support (next-pwa) |
| Backend API | Node.js + Express (or NestJS) |
| Database | PostgreSQL (transactional + TimescaleDB extension for price time-series) |
| Caching | Redis (Upstash) |
| File/Image Storage | Supabase Storage or AWS S3 (lot photos, certification docs) |
| AI Microservice | Python FastAPI (Prophet forecasting), TensorFlow.js (in-browser grading) |
| Authentication | Twilio Verify / MSG91 / Firebase Phone Auth (OTP) |
| **Voice & Language AI** | **Sarvam AI (Saaras ASR, Sarvam-105B LLM, Bulbul TTS)** + Twilio/Gupshup (telephony infrastructure) + Web Speech API (in-browser fallback) |
| Payments/Escrow | Razorpay (test mode for prototype) |
| Ledger | Hash-chained PostgreSQL transaction log (Hyperledger Fabric noted as production roadmap) |
| Security | AES-256 encryption at rest, TLS in transit, RBAC, audit logging |

---

## 10. Deployment Plan (Exact)

1. **Frontend:** Deployed on **Vercel** (Next.js-native hosting, free tier sufficient for hackathon demo, auto-HTTPS, custom domain support).
2. **Backend API:** Deployed on **Render** or **Railway** (Node.js service, auto-deploy from GitHub on push).
3. **AI Microservice:** Separate Python FastAPI service, also on Render, exposed via internal REST endpoint the backend calls.
4. **Database:** **Supabase** (managed PostgreSQL) — also provides built-in auth helpers and storage, speeding up hackathon build time.
5. **Voice/Telephony:** Twilio or Gupshup account (sandbox/trial tier sufficient for demo) integrated with **Sarvam AI APIs** (Saaras, Sarvam-105B, Bulbul) for complete voice intelligence pipeline.
6. **CI/CD:** GitHub Actions — push to `main` triggers auto-deploy to Vercel (frontend) and Render (backend/AI service).
7. **Environment separation:** `dev` (local), `staging` (Render/Vercel preview deployments per PR), `production` (main branch).
8. **Domain & SSL:** Custom domain via Vercel with automatic Let's Encrypt SSL.
9. **Monitoring:** Basic uptime + error logging via Render/Vercel built-in dashboards (Sentry optional add-on for error tracking).

This entire stack is achievable by a web-dev team without native mobile or deep MLOps experience — every "AI" piece is either no-code-trained, API-based (Sarvam AI), or a small, isolated Python service called over REST.

---

## 11. Security & Compliance Checklist

- DPDP Act 2023-aligned consent capture and data subject rights (view/download/delete requests)
- Aadhaar handled via tokenization + masking, never raw storage (see Section 6)
- PAN/KCC encrypted at rest (AES-256), access role-restricted
- All government data access is API-based, purpose-logged, and audited — never a raw database handover
- TLS everywhere; no sensitive data in URL params or client-side logs
- Rate-limiting and OTP throttling to prevent auth abuse
- **Voice data privacy:** Audio recordings processed by Sarvam AI are not stored permanently unless explicitly consented for quality improvement; transcripts stored encrypted with same access controls as text data
- **Data residency:** Sarvam AI infrastructure hosted in India, compliant with data localization requirements

---

## 12. Onboarding & Adoption Strategy (Recap)

- FPO-first onboarding (bulk registration via FPO secretary/field staff), not individual self-signup
- Partnerships with KVKs, APMC offices, NABARD-linked FPO networks for trusted distribution
- On-ground registration camps at mandis on market days
- Voice/SMS/missed-call as a low-friction entry point alongside the web app (powered by **Sarvam AI's conversational capabilities**)
- First-transaction fee waiver as an adoption incentive
- **Language-first approach:** Platform available in farmer's native language from first interaction (Sarvam AI supports 10+ Indian languages natively)

---

## 13. Risks & Mitigations (Condensed)

| Risk | Mitigation |
|---|---|
| Two-sided cold start | FPO-first rollout using FPOs' existing buyer relationships |
| AI grading accuracy limits | Human-in-the-loop override at FPO collection points; start with 2–3 well-studied crops |
| Grading fraud (bait-and-switch) | Mandatory re-grading at collection/pickup before escrow release |
| Government data gaps/delays | Multi-source cross-validation with confidence flagging |
| Sparse historical data for new regions/crops | Show trend-only (no forecast) until sufficient data accumulates |
| Debt-bonded selling behaviour | Acknowledged as structural constraint; warehouse-loan feature as partial counter |
| Regulatory variation (APMC Act by state) | Phased state-by-state rollout, starting where deregulation/e-NAM integration is strongest |
| Voice ASR errors in noisy field conditions | **Sarvam Saaras** optimized for Indian accents + agricultural terminology; graceful re-ask fallback; option to switch to DTMF keypad input |
| Data privacy exposure (Aadhaar/PAN/KCC) | Tokenization, encryption, RBAC, audit logging (Section 6, 11) |
| **Sarvam AI API costs** | Free tier sufficient for prototype; production cost modeled into per-transaction fee structure; fallback to simpler keyword-based IVR for basic queries |
| **Internet dependency for voice features** | Hybrid approach: conversational AI requires internet, but basic IVR menu (DTMF-based) works on any phone |

---

## 14. Roadmap / Future Extensions (Not Built at Hackathon Stage)

- Full Hyperledger-based immutable ledger (replacing hash-chained Postgres log)
- Direct-to-consumer channel for FPO premium produce
- Carbon-credit/sustainability tracking linkage
- Farmer-to-farmer community/knowledge-sharing forum
- Gamified recognition for high-performing FPOs
- **Offline voice capability:** On-device ASR/TTS models for areas with poor connectivity (using lightweight models from AI4Bharat/Bhashini as fallback)
- **WhatsApp Business API integration:** Voice notes + text conversations via WhatsApp (very high farmer adoption in India)

---

## 15. Expected Outcomes (Mapped to PS)

- **Improved price realisation** — sale-window advisory + AI-negotiated competitive offers
- **Reduced information asymmetry** — unified price + buyer credential visibility
- **Lower transaction cost** — pooled logistics, reduced middlemen dependency
- **Stronger FPO aggregation** — native pooled-lot and payment-distribution features
- **Reduced post-harvest loss** — advisory + storage booking + faster logistics matching
- **Reliable buyer sourcing** — verified, trust-scored buyer registry
- **Transparent, government-usable records** — compliant identity data + auditable transaction ledger, enabling scheme delivery (KCC-linked benefits) without compromising farmer privacy
- **True digital inclusion** — voice-first design powered by **Sarvam AI** enables participation regardless of literacy, smartphone ownership, or tech-savviness

---

## 16. One-Line Pitch for Judges

*"KisanSetu turns fragmented, post-harvest, low-bargaining-power selling into pre-planned, price-transparent, AI-negotiated transactions — accessible to any farmer with just a phone call through Sarvam AI's conversational intelligence, and built entirely on a web-first stack our team can actually ship in hackathon timeframes."*

---
# 17. Sarvam AI Implementation Details (Technical Appendix)

## API Integration Architecture:
```
┌─────────────────────────────────────────────────────────────┐
│ Voice Call Flow │
└─────────────────────────────────────────────────────────────┘
Farmer Call → Twilio/Gupshup → WebSocket Stream↓

┌──────────────┐
│ Sarvam Saaras│
│ (Real-time ASR)│
│ (Hindi/10+ │
│ languages) │
└──────┬───────┘↓ (transcribed text)

┌──────────────┐
│ KisanSetu │
│ (NestJS) │
└──────┬───────┘↓ (intent/query)

┌──────────────┐
│ Sarvam-105B │ 
│ (Conversational AI)│ 
│ LLM API │ 
└──────┬───────┘↓ (structured response)

├──────────────┤
│KisanSetu DB/ │ 
│ Business Logic │ 
├──────┬───────┘↓ (response text)

├──────────────┐
│Sarvam Bulbul │ 	
│ (TTS) │ 	
│ (Natural speech out) │ 	
├──────╮ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓╯ 	
├──────╯ ↓(audio stream)
twilio/gupshup → Farmer hears response text
```
