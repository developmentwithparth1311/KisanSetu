import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lots = db.prepare('SELECT * FROM lots ORDER BY created_at DESC').all() as any[];

    const lotsWithDetails = lots.map((lot) => {
      const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(lot.crop_id) as any;
      const mandi = db.prepare('SELECT * FROM mandis WHERE id = ?').get(lot.mandi_id) as any;
      const negotiationEvents = db
        .prepare('SELECT * FROM negotiation_events WHERE lot_id = ? ORDER BY created_at ASC')
        .all(lot.id) as any[];

      return {
        ...lot,
        cropName: crop?.name || lot.crop_id,
        cropIcon: crop?.icon || '🌾',
        mandiName: mandi?.name || lot.mandi_id,
        aiDefects: lot.ai_defects ? JSON.parse(lot.ai_defects) : [],
        negotiationEvents,
      };
    });

    const buyers = db.prepare('SELECT * FROM buyers').all() as any[];

    return NextResponse.json({
      lots: lotsWithDetails,
      buyers: buyers.map((b) => ({
        ...b,
        cropsWanted: b.crops_wanted ? JSON.parse(b.crops_wanted) : [],
      })),
    });
  } catch (error: any) {
    console.error('Error fetching lots:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      farmerName,
      farmerPhone,
      cropId,
      mandiId,
      quantity,
      unit = 'quintal',
      photoUrl,
      aiGrade,
      aiConfidence,
      aiDefects = [],
      floorPrice,
      targetPrice,
    } = body;

    if (!farmerName || !cropId || !mandiId || !quantity || !floorPrice || !targetPrice) {
      return NextResponse.json({ error: 'Missing required lot creation fields' }, { status: 400 });
    }

    const lotId = `LOT-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    const insertLot = db.prepare(`
      INSERT INTO lots (
        id, farmer_name, farmer_phone, crop_id, mandi_id, quantity, unit,
        photo_url, ai_grade, ai_confidence, ai_defects, floor_price, target_price,
        current_offer, status, created_at
      ) VALUES (
        @id, @farmerName, @farmerPhone, @cropId, @mandiId, @quantity, @unit,
        @photoUrl, @aiGrade, @aiConfidence, @aiDefects, @floorPrice, @targetPrice,
        @currentOffer, @status, @createdAt
      )
    `);

    insertLot.run({
      id: lotId,
      farmerName: farmerName.trim(),
      farmerPhone: farmerPhone || '+91 98000 00000',
      cropId,
      mandiId,
      quantity: Number(quantity),
      unit,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      aiGrade: aiGrade || 'Grade A',
      aiConfidence: Number(aiConfidence) || 92.5,
      aiDefects: JSON.stringify(aiDefects),
      floorPrice: Number(floorPrice),
      targetPrice: Number(targetPrice),
      currentOffer: null,
      status: 'Active',
      createdAt,
    });

    // Create initial listing event in negotiation ledger
    db.prepare(`
      INSERT INTO negotiation_events (lot_id, sender_type, sender_name, amount, message, action_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      lotId,
      'Farmer',
      farmerName,
      Number(targetPrice),
      `New Produce Listed: ${quantity} ${unit} (AI Certified ${aiGrade}). Expected target ₹${Number(targetPrice).toLocaleString('en-IN')}/${unit}, Floor ₹${Number(floorPrice).toLocaleString('en-IN')}/${unit}.`,
      'Offer',
      createdAt
    );

    return NextResponse.json({ success: true, lotId });
  } catch (error: any) {
    console.error('Error creating lot:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
