# 🌾 KisanSetu (किसान सेतु) — SIH Hackathon Prototype

> **Smart India Hackathon (SIH26132)**  
> *Agriculture, FoodTech & Rural Development — Strengthening market linkages and price discovery for smallholder farmers.*

KisanSetu is an accessible, web-based Progressive Web App (PWA) for price intelligence, deterministic sale-window advice, AI-assessed lot quality, bounded negotiation, Geo-Pooling/buyer matching, and multilingual voice queries. Optional integrations enrich the demo; every prototype feature has a deterministic local fallback.

---

## 🚀 The 5 Core Prototype Features

### 1. 📈 Price Dashboard + AI Sale-Window Advisory
- **Live Mandi Intelligence**: Switch between crops (🍅 Tomato, 🧅 Onion, 🥔 Potato, 🌾 Wheat, 🌱 Soybean) and Mandis (Nashik APMC, Pune Gultekdi, Indore, Azadpur).
- **Interactive Price Visualizer**: 7-day, 30-day, and 90-day historical trend graphs (Min/Max/Modal price and arrival volume) styled after official Agmarknet/e-NAM feeds.
- **AI Recommendation Card**: Prominent **"Sell Now"**, **"Wait a Few Days"**, or **"Store in Warehouse"** recommendation with plain-language reasoning comparing current prices against 30-day moving averages and crop perishability.
- **Weather & Spoilage Intelligence**: Temperature, humidity, and 48h rainfall telemetry when available, with deterministic mandi defaults when it is not.
- **Nearby Mandi Arbitrage**: Compares prices across nearby centers to identify better regional price discovery.

### 2. 🌱 Digital Lot Creation + AI Quality Grading
- **3-Step "List My Produce" Flow**: Farmer enters quantity, selects crop, and sets price boundaries.
- **Client-Side AI Quality Assessment**: Photo scanner reports an AI-assessed crop grade (**Grade A / Grade B / Grade C**) with confidence metrics and detected quality attributes.
- **Automated Lot Card**: Lot is saved to the SQLite database and made available for buyer offers.

### 3. 🤝 AI Negotiation Agent (*The Core Standout Feature*)
- **Farmer-Set Parameters**: Farmer defines a **Floor Price** (hard minimum) and a **Target Price** (ideal goal).
- **Buyer Bidding Simulator**: Select a verified buyer profile (e.g. *Shree Balaji Agro Traders* with Trust Score 94) and submit an offer.
- **Bounded Multi-Round Bargaining (Python Rule Engine)**:
  - If offer < floor, AI firmly counters, defending produce quality using the verified AI Grade and local mandi price rallies.
  - If offer meets target or near-target from a high-trust buyer, the system recommends acceptance; it never finalizes without the farmer.
- **Live Audit Trail / Negotiation Log**: Timestamped dialogue history showing the AI arguing for higher farmer realization in real time.
- **Farmer-Confirmed Demo Settlement**: The farmer explicitly confirms a final sale after a recommendation; the prototype records a simulated settlement amount, not a real escrow transaction.

### 4. 🎙️ Multilingual Spoken Voice Agent
- **Persistent Floating Mic**: Accessible across all pages.
- **Spoken Price Queries**: Tap the mic and speak (e.g., *"Tomato price in Nashik"* or *"आज का प्याज का भाव"*).
- **Audio Feedback**: Deterministic English/Hindi/Marathi/Hinglish parsing extracts known entities, with optional Gemini help only for ambiguous language; browser speech synthesis can read the result aloud.
- **Demo Quick-Chips**: One-tap sample queries for quick demonstration during judging.

### 5. 🧭 Geo-Pooling + Verified Buyer Matching
- **Explainable Geo-Pooling**: Uses Haversine distance plus crop, variety, grade, availability, and radius checks to discover compatible nearby lots.
- **Buyer RFQ Feasibility**: Applies hard filters before ranking: buyer verification, active RFQ, crop/variety/grade, quantity, unit, and delivery window.
- **Transparent Ranking**: Shows trust, effective value after demo transport/handling estimates, weighted rank, and readable match reasons.
- **Judge Dataset**: The 20 qtl Nashik onion lot cannot meet Shree Balaji's 100 qtl RFQ alone; the persisted 106 qtl pool can.

---

## 🎨 Farmer-First Accessible UX

- **Large Typography & Touch Targets**: Minimum 18px body font, large 48px+ touch buttons.
- **Warm Agricultural Earth Palette**: Forest Green (`#2C7335`), Harvest Amber (`#E8871E`), Cream Background (`#FFFDF9`).
- **Icons Paired With Clear Text**: Every interactive element pairs a high-contrast icon with plain-language labels.
- **Indian Number Formatting**: Native Indian currency groupings (e.g., `₹1,850/qtl`, `₹1,07,500`).

---

## 🔑 External API Integrations & `.env.local` Setup

Create or update `.env.local` in your root folder:

```env
# 1. Google Gemini API (optional)
# May improve wording or interpret ambiguous voice text; never decides numbers/state.
GEMINI_API_KEY=your_gemini_api_key_here

# 2. OpenWeatherMap API
# Optional live weather enrichment; deterministic telemetry is used without it.
OPENWEATHER_API_KEY=your_openweather_key_here

# 3. Data.gov.in / Agmarknet Market Data API
# Optional market-feed enrichment; deterministic seeded data is used without it.
DATA_GOV_IN_API_KEY=your_data_gov_in_key_here
```

### Where to get these API keys (Free Tiers Available):
1. **Google Gemini API**: Go to [Google AI Studio](https://aistudio.google.com/app/apikey) → Click **"Create API Key"**.
2. **OpenWeatherMap API**: Go to [OpenWeatherMap API](https://openweathermap.org/api) → Sign up for the free **Current Weather Data & 5-Day Forecast** tier.
3. **Data.gov.in API**: Go to [Data.gov.in](https://data.gov.in/) → Register → Request an API key under My Account → Search for the **"Current Daily Price of Various Commodities from Various Markets (Mandi)"** resource ID (`9ef84268-d588-465a-a308-a864a43d0070`).

Without these keys, KisanSetu uses the deterministic Python rules and seeded dataset. The judge walkthrough is designed to run in that mode.

---

## ⚡ Quick Start & Run Instructions

```bash
# 1. Install dependencies
npm install

# 2. Install Python API dependencies (once)
cd apps/api
python -m pip install -r requirements.txt

# 3. Seed the Python-owned SQLite database
cd ../..
npm run seed

# 4. Start FastAPI in a second terminal
cd apps/api
python -m uvicorn app.main:app --reload --port 8000

# 5. Start the Next.js frontend (in the repository root)
cd ../..
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Next.js keeps the existing browser `/api/*` calls stable and proxies them to
FastAPI. Set `PYTHON_API_URL` only when the Python service is not running at
`http://127.0.0.1:8000`.

---

## 🧪 Step-by-Step Judge Walkthrough

1. **Test Feature 1 (Price & Advisory with Weather)**:
   - Click on 🍅 Tomato in the crop selector.
   - Note the **"Sell Now"** advisory card explaining that prices are +12% above the monthly average, with weather telemetry for Nashik.
   - Click on 🧅 Onion to see how the advisory changes to **"Store in Warehouse"** due to lower prices and long storage longevity.
2. **Test Feature 2 (Listing & AI Grading)**:
   - Click **"List Produce & AI Grade"** in the top navigation.
   - Enter `50` Quintals and click **"Next"**.
   - Watch the AI Vision Scanner analyze the produce and assign **Grade A (94.6% confidence)**.
   - Set Floor (`₹1,900`) and Target (`₹2,250`) and click **"Publish Lot"**.
3. **Test Feature 3 (AI Negotiation & Simulated Settlement)**:
   - In the right-hand **Buyer Simulator**, select *Shree Balaji Agro Traders* and enter a low offer of `₹1,750`.
   - Click **"Submit Offer & Trigger AI Bargain"**.
   - Watch the KisanSetu AI Agent respond with a protected counter-offer because ₹1,750 is below the farmer floor and the produce is AI-Assessed Grade A.
   - At a suitable price, review the recommendation and explicitly confirm the sale as the farmer; the prototype then records a simulated settlement amount.
4. **Test Feature 4 (Voice Assistant)**:
   - Click the pulsing 🎙️ **Voice Help** button in the bottom-right corner.
   - If browser speech recognition is available, speak a price question. Otherwise, use a quick sample chip such as *"🍅 Tomato in Nashik"*, *"Show my pool"*, or *"Who is my best buyer?"*.
5. **Test Feature 5 (Geo-Pooling and Buyer Match)**:
   - Open **Pool & Buyers**, load the seeded 20 qtl Nashik onion lot, and inspect its compatible 35, 26, and 25 qtl lots.
   - Materialize the 106 qtl pool and review the Shree Balaji match. The individual 20 qtl lot is infeasible; the pool satisfies the 100 qtl RFQ.
   - Use **Negotiate with Buyer** and submit a protected low bid or a target bid. The final confirmation records a 106 qtl demo settlement only after farmer approval.

## Documentation

- [Architecture](docs/architecture.md)
- [API contract](docs/api-spec.yaml)
- [Clean-seed demo script](docs/demo-script.md)
