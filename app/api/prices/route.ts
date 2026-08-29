import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { computeAdvisory } from '@/lib/advisory-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cropId = searchParams.get('crop') || 'tomato';
    const mandiId = searchParams.get('mandi') || 'nashik';
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Fetch crops & mandis list for dropdowns
    const crops = db.prepare('SELECT * FROM crops').all();
    const mandis = db.prepare('SELECT * FROM mandis').all();

    // Fetch active crop & mandi metadata
    const selectedCrop = db.prepare('SELECT * FROM crops WHERE id = ?').get(cropId) as any;
    const selectedMandi = db.prepare('SELECT * FROM mandis WHERE id = ?').get(mandiId) as any;

    if (!selectedCrop || !selectedMandi) {
      return NextResponse.json({ error: 'Crop or Mandi not found' }, { status: 404 });
    }

    // Fetch price history for selected crop & mandi
    const allPricePoints = db
      .prepare(
        'SELECT * FROM price_points WHERE crop_id = ? AND mandi_id = ? ORDER BY date ASC'
      )
      .all(cropId, mandiId) as any[];

    const requestedPricePoints = allPricePoints.slice(-days);

    // Fetch current prices across all other mandis for comparative view
    const mandiComparisons = mandis.map((m: any) => {
      const latestPoint = db
        .prepare(
          'SELECT * FROM price_points WHERE crop_id = ? AND mandi_id = ? ORDER BY date DESC LIMIT 1'
        )
        .get(cropId, m.id) as any;

      return {
        mandiId: m.id,
        mandiName: m.name,
        state: m.state,
        distanceKm: m.distance_km,
        badge: m.badge,
        currentModalPrice: latestPoint?.modal_price || selectedCrop.base_price,
        arrivalVolume: latestPoint?.arrival_volume || 120,
        isCurrent: m.id === mandiId,
      };
    });

    // Compute Advisory
    const advisory = computeAdvisory(allPricePoints, selectedCrop, selectedMandi.name);

    return NextResponse.json({
      crops,
      mandis,
      selectedCrop: {
        ...selectedCrop,
        grades: selectedCrop.grades_json ? JSON.parse(selectedCrop.grades_json) : [],
      },
      selectedMandi,
      priceHistory: requestedPricePoints,
      allHistoryCount: allPricePoints.length,
      latestPricePoint: requestedPricePoints[requestedPricePoints.length - 1],
      mandiComparisons,
      advisory,
    });
  } catch (error: any) {
    console.error('Error fetching price data:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
