import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { evaluateBuyerOffer } from '@/lib/negotiation-agent';
import { generateGeminiNegotiationCounter } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      lotId,
      action = 'buyer_bid', // 'buyer_bid' | 'farmer_accept' | 'farmer_counter'
      buyerId,
      buyerName,
      offerAmount,
      customMessage,
    } = body;

    const lot = db.prepare('SELECT * FROM lots WHERE id = ?').get(lotId) as any;
    if (!lot) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
    }

    const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(lot.crop_id) as any;
    const mandi = db.prepare('SELECT * FROM mandis WHERE id = ?').get(lot.mandi_id) as any;

    const latestPrice = db
      .prepare('SELECT modal_price FROM price_points WHERE crop_id = ? AND mandi_id = ? ORDER BY date DESC LIMIT 1')
      .get(lot.crop_id, lot.mandi_id) as any;

    const currentMandiPrice = latestPrice?.modal_price || crop?.base_price || 1800;

    const existingEvents = db
      .prepare('SELECT * FROM negotiation_events WHERE lot_id = ? ORDER BY created_at ASC')
      .all(lotId) as any[];

    const now = new Date().toISOString();

    // ----------------------------------------------------
    // Scenario 1: Buyer Submits Bid -> AI Evaluates & Counters
    // ----------------------------------------------------
    if (action === 'buyer_bid') {
      const buyer = db.prepare('SELECT * FROM buyers WHERE id = ?').get(buyerId) as any;
      const effectiveBuyerName = buyerName || buyer?.name || 'Verified Agro Trader';
      const buyerTrustScore = buyer?.trust_score || 88;
      const numRounds = existingEvents.filter((e) => e.sender_type === 'Buyer').length + 1;

      // 1. Record Buyer's initial offer
      db.prepare(`
        INSERT INTO negotiation_events (lot_id, sender_type, sender_name, amount, message, action_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        lotId,
        'Buyer',
        effectiveBuyerName,
        Number(offerAmount),
        customMessage || `Placed a direct purchase offer of ₹${Number(offerAmount).toLocaleString('en-IN')}/${lot.unit} for all ${lot.quantity} ${lot.unit}.`,
        'Offer',
        now
      );

      // 2. Run Baseline KisanSetu Negotiation Engine
      const baselineInput = {
        lotId: lot.id,
        farmerName: lot.farmer_name,
        cropName: crop?.name || lot.crop_id,
        quantity: lot.quantity,
        unit: lot.unit,
        aiGrade: lot.ai_grade,
        aiConfidence: lot.ai_confidence,
        floorPrice: lot.floor_price,
        targetPrice: lot.target_price,
        buyerName: effectiveBuyerName,
        buyerTrustScore,
        offerAmount: Number(offerAmount),
        currentMandiModalPrice: currentMandiPrice,
        negotiationRound: numRounds,
      };

      const ruleResult = evaluateBuyerOffer(baselineInput);

      // 3. Enhance with Gemini LLM Reasoning if API key is provided
      const aiResult = await generateGeminiNegotiationCounter(baselineInput, ruleResult);

      // 4. Record AI Agent Action
      const aiEventTime = new Date(Date.now() + 1000).toISOString();
      db.prepare(`
        INSERT INTO negotiation_events (lot_id, sender_type, sender_name, amount, message, action_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        lotId,
        'AI_Agent',
        'KisanSetu AI Agent',
        aiResult.amount,
        aiResult.message,
        aiResult.action,
        aiEventTime
      );

      // 5. Update Lot Status in SQLite
      let updatedStatus = aiResult.statusUpdate;
      let escrowAmount = null;
      let escrowStatus = null;

      if (aiResult.action === 'Accept') {
        updatedStatus = 'Accepted';
        escrowAmount = aiResult.amount * lot.quantity;
        escrowStatus = 'Held';
      }

      db.prepare(`
        UPDATE lots
        SET current_offer = ?,
            highest_bidder_id = ?,
            highest_bidder_name = ?,
            status = ?,
            escrow_amount = ?,
            escrow_status = ?
        WHERE id = ?
      `).run(
        aiResult.amount,
        buyerId || 'b1',
        effectiveBuyerName,
        updatedStatus,
        escrowAmount,
        escrowStatus,
        lotId
      );

      // Return updated state
      const updatedEvents = db
        .prepare('SELECT * FROM negotiation_events WHERE lot_id = ? ORDER BY created_at ASC')
        .all(lotId);

      return NextResponse.json({
        success: true,
        aiEvaluation: aiResult,
        events: updatedEvents,
        lotStatus: updatedStatus,
        isGeminiPowered: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key',
      });
    }

    // ----------------------------------------------------
    // Scenario 2: Farmer Explicitly Accepts Current Offer
    // ----------------------------------------------------
    if (action === 'farmer_accept') {
      const finalPrice = lot.current_offer || lot.target_price;
      const totalEscrow = finalPrice * lot.quantity;

      db.prepare(`
        INSERT INTO negotiation_events (lot_id, sender_type, sender_name, amount, message, action_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        lotId,
        'Farmer',
        lot.farmer_name,
        finalPrice,
        `Deal Confirmed! Farmer accepted the final price of ₹${finalPrice.toLocaleString('en-IN')}/${lot.unit}. Total ₹${totalEscrow.toLocaleString('en-IN')} locked in KisanSetu Escrow Vault.`,
        'Accept',
        now
      );

      db.prepare(`
        UPDATE lots
        SET status = 'Sold',
            escrow_amount = ?,
            escrow_status = 'Held'
        WHERE id = ?
      `).run(totalEscrow, lotId);

      const updatedEvents = db
        .prepare('SELECT * FROM negotiation_events WHERE lot_id = ? ORDER BY created_at ASC')
        .all(lotId);

      return NextResponse.json({
        success: true,
        message: 'Deal closed successfully! Escrow payment locked.',
        events: updatedEvents,
        lotStatus: 'Sold',
        escrowAmount: totalEscrow,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in negotiation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
