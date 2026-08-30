# 🌾 KisanSetu (किसान सेतु) — SIH Hackathon Prototype

> **Smart India Hackathon (SIH26132)**  
> *Agriculture, FoodTech & Rural Development — Strengthening market linkages and price discovery for smallholder farmers.*

KisanSetu is an accessible, web-based Progressive Web App (PWA) that empowers farmers with real-time price intelligence, AI-driven sale-window advice with weather risk alerts, client-side photo quality grading, autonomous bounded price negotiation with verified buyers, and full voice accessibility in Indian languages.

---

## 🚀 The 4 Core Prototype Features

### 1. 📈 Price Dashboard + AI Sale-Window Advisory
- **Live Mandi Intelligence**: Switch between crops (🍅 Tomato, 🧅 Onion, 🥔 Potato, 🌾 Wheat, 🌱 Soybean) and Mandis (Nashik APMC, Pune Gultekdi, Indore, Azadpur).
- **Interactive Price Visualizer**: 7-day, 30-day, and 90-day historical trend graphs (Min/Max/Modal price and arrival volume) styled after official Agmarknet/e-NAM feeds.
- **AI Recommendation Card**: Prominent **"Sell Now"**, **"Wait a Few Days"**, or **"Store in Warehouse"** recommendation with plain-language reasoning comparing current prices against 30-day moving averages and crop perishability.
- **Weather & Spoilage Intelligence**: Live temperature, humidity, and 48h rainfall probability telemetry (via OpenWeatherMap API) to alert farmers before open-mandi rain ruins harvests.
- **Nearby Mandi Arbitrage**: Compares prices across nearby centers to identify better regional price discovery.

### 2. 🌱 Digital Lot Creation + AI Quality Grading
- **3-Step "List My Produce" Flow**: Farmer enters quantity, selects crop, and sets price boundaries.
- **Client-Side AI Quality Assessment**: Photo scanner computes certified Crop Grade (**Grade A / Grade B / Grade C**) with confidence metrics and detected quality attributes.
- **Automated Lot Card**: Lot is saved to the SQLite database and made available for buyer offers.

### 3. 🤝 AI Negotiation Agent (*The Core Standout Feature*)
- **Farmer-Set Parameters**: Farmer defines a **Floor Price** (hard minimum) and a **Target Price** (ideal goal).
- **Buyer Bidding Simulator**: Select a verified buyer profile (e.g. *Shree Balaji Agro Traders* with Trust Score 94) and submit an offer.
- **Autonomous Multi-Round Bargaining (Google Gemini + Rule Engine)**:
  - If offer < floor, AI firmly counters, defending produce quality using the verified AI Grade and local mandi price rallies.
  - If offer meets target or near-target from a high-trust buyer, AI accepts.
- **Live Audit Trail / Negotiation Log**: Timestamped dialogue history showing the AI arguing for higher farmer realization in real time.
- **Escrow Settlement Lock**: Farmer can accept at any moment to lock funds in the **KisanSetu Escrow Vault** (`₹X,XX,XXX Held in Escrow`).

### 4. 🎙️ Multilingual Spoken Voice Agent
- **Persistent Floating Mic**: Accessible across all pages.
- **Spoken Price Queries**: Tap the mic and speak (e.g., *"Tomato price in Nashik"* or *"आज का प्याज का भाव"*).
- **Audio Feedback**: Transcribes speech, extracts entities (via Google Gemini NLP + Regex), and uses Text-to-Speech (`window.speechSynthesis` / Web Speech API) to speak the price and advisory back aloud.
- **Demo Quick-Chips**: One-tap sample queries for quick demonstration during judging.

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
# 1. Google Gemini API (Vertex AI / Google AI Studio)
# Powers LLM Multi-Turn Bargaining & Multilingual Voice Query Parser
GEMINI_API_KEY=your_gemini_api_key_here

# 2. OpenWeatherMap API
# Powers Hyper-local Mandi Weather Telemetry & Spoilage Risk Forecasting
OPENWEATHER_API_KEY=your_openweather_key_here

# 3. Data.gov.in / Agmarknet Market Data API
# Powers Live Government Mandi Daily Modal Rates and Arrivals Feed
DATA_GOV_IN_API_KEY=your_data_gov_in_key_here
```

### Where to get these API keys (Free Tiers Available):
1. **Google Gemini API**: Go to [Google AI Studio](https://aistudio.google.com/app/apikey) → Click **"Create API Key"**.
2. **OpenWeatherMap API**: Go to [OpenWeatherMap API](https://openweathermap.org/api) → Sign up for the free **Current Weather Data & 5-Day Forecast** tier.
3. **Data.gov.in API**: Go to [Data.gov.in](https://data.gov.in/) → Register → Request an API key under My Account → Search for the **"Current Daily Price of Various Commodities from Various Markets (Mandi)"** resource ID (`9ef84268-d588-465a-a308-a864a43d0070`).

*(Note: If API keys are not provided, KisanSetu automatically falls back to deterministic rule engines and realistic seeded datasets, ensuring a 100% stable presentation.)*

---

## ⚡ Quick Start & Run Instructions

```bash
# 1. Install dependencies
npm install

# 2. Seed database with 90-day mandi prices & verified buyers
npm run seed

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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
3. **Test Feature 3 (AI Negotiation & Escrow)**:
   - In the right-hand **Buyer Simulator**, select *Shree Balaji Agro Traders* and enter a low offer of `₹1,750`.
   - Click **"Submit Offer & Trigger AI Bargain"**.
   - Watch the KisanSetu AI Agent automatically respond on the live ledger with a counter-offer (`₹2,110/qtl`) explaining that ₹1,750 is below the farmer floor and citing the certified Grade A quality.
   - Click **"Accept Offer & Lock Escrow"** to mark the lot as **Sold** and see the **Escrow Locked** status.
4. **Test Feature 4 (Voice Assistant)**:
   - Click the pulsing 🎙️ **Voice Help** button in the bottom-right corner.
   - Click one of the quick sample chips (e.g., *"🍅 Tomato in Nashik"*).
   - Listen to the audio readout and view the instant price breakdown card.
