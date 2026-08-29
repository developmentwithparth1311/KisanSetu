import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'kisansetu.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
CREATE TABLE IF NOT EXISTS crops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_short TEXT NOT NULL,
  perishability INTEGER NOT NULL,
  base_price REAL NOT NULL,
  volatility REAL NOT NULL,
  description TEXT,
  grades_json TEXT
);

CREATE TABLE IF NOT EXISTS mandis (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  distance_km INTEGER,
  badge TEXT
);

CREATE TABLE IF NOT EXISTS price_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop_id TEXT NOT NULL,
  mandi_id TEXT NOT NULL,
  date TEXT NOT NULL,
  min_price REAL NOT NULL,
  max_price REAL NOT NULL,
  modal_price REAL NOT NULL,
  arrival_volume INTEGER NOT NULL,
  UNIQUE(crop_id, mandi_id, date)
);

CREATE TABLE IF NOT EXISTS buyers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT NOT NULL,
  trust_score INTEGER NOT NULL,
  rating REAL NOT NULL,
  completed_trades INTEGER NOT NULL,
  payment_speed TEXT NOT NULL,
  crops_wanted TEXT NOT NULL,
  avatar TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lots (
  id TEXT PRIMARY KEY,
  farmer_name TEXT NOT NULL,
  farmer_phone TEXT NOT NULL,
  crop_id TEXT NOT NULL,
  mandi_id TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  ai_grade TEXT NOT NULL,
  ai_confidence REAL NOT NULL,
  ai_defects TEXT,
  floor_price REAL NOT NULL,
  target_price REAL NOT NULL,
  current_offer REAL,
  highest_bidder_id TEXT,
  highest_bidder_name TEXT,
  status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Under Negotiation', 'Accepted', 'Sold'
  escrow_amount REAL,
  escrow_status TEXT, -- 'Pending', 'Held', 'Released'
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS negotiation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_id TEXT NOT NULL,
  sender_type TEXT NOT NULL, -- 'Buyer', 'AI_Agent', 'Farmer'
  sender_name TEXT NOT NULL,
  amount REAL NOT NULL,
  message TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'Offer', 'Counter', 'Accept', 'Reject'
  created_at TEXT NOT NULL
);
`);

export default db;
