import db from './db';
import cropsMandisData from '../data/seed/crops-mandis.json';
import buyersData from '../data/seed/buyers.json';
import { createSeededRandom } from './seeded-random';

export function seedDatabase() {
  const cropCount = (db.prepare('SELECT COUNT(*) as count FROM crops').get() as { count: number }).count;
  if (cropCount > 0) {
    console.log('[Seed] Database is already populated.');
    return;
  }

  console.log('[Seed] Seeding database with realistic mandi feeds and buyer profiles...');
  const rand = createSeededRandom(42);

  const insertCrop = db.prepare(`
    INSERT INTO crops (id, name, icon, unit, unit_short, perishability, base_price, volatility, description, grades_json)
    VALUES (@id, @name, @icon, @unit, @unitShort, @perishability, @basePrice, @volatility, @description, @gradesJson)
  `);

  const insertMandi = db.prepare(`
    INSERT INTO mandis (id, name, state, distance_km, badge)
    VALUES (@id, @name, @state, @distanceKm, @badge)
  `);

  const insertBuyer = db.prepare(`
    INSERT INTO buyers (id, name, type, location, trust_score, rating, completed_trades, payment_speed, crops_wanted, avatar)
    VALUES (@id, @name, @type, @location, @trustScore, @rating, @completedTrades, @paymentSpeed, @cropsWanted, @avatar)
  `);

  const insertPrice = db.prepare(`
    INSERT OR REPLACE INTO price_points (crop_id, mandi_id, date, min_price, max_price, modal_price, arrival_volume)
    VALUES (@cropId, @mandiId, @date, @minPrice, @maxPrice, @modalPrice, @arrivalVolume)
  `);

  const insertLot = db.prepare(`
    INSERT INTO lots (id, farmer_name, farmer_phone, crop_id, mandi_id, quantity, unit, photo_url, ai_grade, ai_confidence, ai_defects, floor_price, target_price, current_offer, highest_bidder_id, highest_bidder_name, status, escrow_amount, escrow_status, created_at)
    VALUES (@id, @farmerName, @farmerPhone, @cropId, @mandiId, @quantity, @unit, @photoUrl, @aiGrade, @aiConfidence, @aiDefects, @floorPrice, @targetPrice, @currentOffer, @highestBidderId, @highestBidderName, @status, @escrowAmount, @escrowStatus, @createdAt)
  `);

  const insertNegotiation = db.prepare(`
    INSERT INTO negotiation_events (lot_id, sender_type, sender_name, amount, message, action_type, created_at)
    VALUES (@lotId, @senderType, @senderName, @amount, @message, @actionType, @createdAt)
  `);

  const seedAll = db.transaction(() => {
    // 1. Insert Crops
    for (const crop of cropsMandisData.crops) {
      insertCrop.run({
        id: crop.id,
        name: crop.name,
        icon: crop.icon,
        unit: crop.unit,
        unitShort: crop.unitShort,
        perishability: crop.perishability,
        basePrice: crop.basePrice,
        volatility: crop.volatility,
        description: crop.description,
        gradesJson: JSON.stringify(crop.grades),
      });
    }

    // 2. Insert Mandis
    for (const mandi of cropsMandisData.mandis) {
      insertMandi.run(mandi);
    }

    // 3. Insert Buyers
    for (const buyer of buyersData) {
      insertBuyer.run({
        ...buyer,
        cropsWanted: JSON.stringify(buyer.cropsWanted),
      });
    }

    // 4. Generate 90-day time series for each crop & mandi
    const DAYS = 90;
    const now = new Date();

    for (const crop of cropsMandisData.crops) {
      for (let mandiIdx = 0; mandiIdx < cropsMandisData.mandis.length; mandiIdx++) {
        const mandi = cropsMandisData.mandis[mandiIdx];
        let price = crop.basePrice * (1 + (mandiIdx - 1) * 0.04);

        for (let dayOffset = DAYS; dayOffset >= 0; dayOffset--) {
          const dateObj = new Date(now);
          dateObj.setDate(now.getDate() - dayOffset);
          const dateStr = dateObj.toISOString().split('T')[0];

          const noise = (rand() - 0.48) * crop.volatility;
          price = Math.max(crop.basePrice * 0.55, price * (1 + noise));

          // Give deliberate recent 10-day market narrative
          if (dayOffset <= 10) {
            const trendFactor = getCropTrendNarrative(crop.id, dayOffset);
            price = price * (1 + trendFactor);
          }

          const modalPrice = Math.round(price);
          const minPrice = Math.round(modalPrice * 0.93);
          const maxPrice = Math.round(modalPrice * 1.07);
          const arrivalVolume = Math.round(100 + rand() * 350);

          insertPrice.run({
            cropId: crop.id,
            mandiId: mandi.id,
            date: dateStr,
            minPrice,
            maxPrice,
            modalPrice,
            arrivalVolume,
          });
        }
      }
    }

    // 5. Pre-seed initial active demo lots for immediate testing
    const demoLot1Id = 'LOT-7821';
    insertLot.run({
      id: demoLot1Id,
      farmerName: 'Ramesh Patil (रमेश पाटिल)',
      farmerPhone: '+91 98231 44520',
      cropId: 'tomato',
      mandiId: 'nashik',
      quantity: 50,
      unit: 'quintal',
      photoUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      aiGrade: 'Grade A',
      aiConfidence: 94.2,
      aiDefects: JSON.stringify(['Uniform Crimson Color', 'Firm Flesh (>90%)', 'Zero Pest Marks']),
      floorPrice: 1950,
      targetPrice: 2300,
      currentOffer: 2150,
      highestBidderId: 'b1',
      highestBidderName: 'Shree Balaji Agro Traders',
      status: 'Under Negotiation',
      escrowAmount: null,
      escrowStatus: null,
      createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    });

    // Add initial negotiation history for LOT-7821
    insertNegotiation.run({
      lotId: demoLot1Id,
      senderType: 'Farmer',
      senderName: 'Ramesh Patil',
      amount: 2300,
      message: 'Listed 50 qtl Grade A Tomatoes at target price ₹2,300/qtl (Floor: ₹1,950).',
      actionType: 'Offer',
      createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    });

    insertNegotiation.run({
      lotId: demoLot1Id,
      senderType: 'Buyer',
      senderName: 'Shree Balaji Agro Traders',
      amount: 1850,
      message: 'Offered ₹1,850/qtl for immediate dispatch to Vashi market.',
      actionType: 'Offer',
      createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    });

    insertNegotiation.run({
      lotId: demoLot1Id,
      senderType: 'AI_Agent',
      senderName: 'KisanSetu AI Agent',
      amount: 2150,
      message: 'Counter-offered ₹2,150/qtl. AI analysis: Produce is Grade A with 94.2% quality score, and Nashik mandi modal price has surged +8.4% this week. ₹1,850 is below farmer floor of ₹1,950.',
      actionType: 'Counter',
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    });

    // Seed Demo Lot 2 (Onion - Ready for new buyer bid)
    const demoLot2Id = 'LOT-6540';
    insertLot.run({
      id: demoLot2Id,
      farmerName: 'Suresh Gaikwad',
      farmerPhone: '+91 94220 88192',
      cropId: 'onion',
      mandiId: 'nashik',
      quantity: 80,
      unit: 'quintal',
      photoUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
      aiGrade: 'Grade A',
      aiConfidence: 91.8,
      aiDefects: JSON.stringify(['Clean dry outer layer', 'Average 55mm bulb', 'Low moisture content']),
      floorPrice: 1550,
      targetPrice: 1850,
      currentOffer: null,
      highestBidderId: null,
      highestBidderName: null,
      status: 'Active',
      escrowAmount: null,
      escrowStatus: null,
      createdAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    });
  });

  seedAll();
  console.log('[Seed] Database seeded successfully with 90-day time series and demo lots!');
}

function getCropTrendNarrative(cropId: string, dayOffset: number): number {
  const intensity = (10 - dayOffset) / 10; // 0 approaching 1 today
  switch (cropId) {
    case 'tomato':
      return 0.012 * intensity; // Strong surge (+12% over recent days) -> "Sell Now"
    case 'onion':
      return -0.015 * intensity; // Recent price dip (-15%) with high storability -> "Store It"
    case 'potato':
      return 0.002 * intensity; // Very steady (+1-2%) -> "Wait a Few Days"
    case 'wheat':
      return 0.005 * intensity; // Steady upward trend -> "Wait a Few Days"
    case 'soybean':
      return 0.009 * intensity; // Upward momentum -> "Sell Now / Wait"
    default:
      return 0;
  }
}

// Auto-run if executed directly
if (require.main === module) {
  seedDatabase();
}
