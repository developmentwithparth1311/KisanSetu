import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { computeAdvisory } from '@/lib/advisory-engine';
import { parseVoiceQueryWithGemini } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transcript = (body.transcript || '').toLowerCase().trim();

    if (!transcript) {
      return NextResponse.json({ error: 'Empty voice transcript' }, { status: 400 });
    }

    // 1. Try Gemini NLP Entity Extraction first
    let detectedCropId = 'tomato';
    let detectedMandiId = 'nashik';

    const geminiParsed = await parseVoiceQueryWithGemini(transcript);

    if (geminiParsed?.detectedCropId && geminiParsed?.detectedMandiId) {
      detectedCropId = geminiParsed.detectedCropId;
      detectedMandiId = geminiParsed.detectedMandiId;
    } else {
      // Rule-based entity extraction fallback (English & Hindi/Marathi/Hinglish)
      if (
        transcript.includes('onion') ||
        transcript.includes('pyaz') ||
        transcript.includes('pyaaz') ||
        transcript.includes('प्याज़') ||
        transcript.includes('कांदा')
      ) {
        detectedCropId = 'onion';
      } else if (
        transcript.includes('potato') ||
        transcript.includes('aloo') ||
        transcript.includes('aalu') ||
        transcript.includes('आलू') ||
        transcript.includes('बटाटा')
      ) {
        detectedCropId = 'potato';
      } else if (
        transcript.includes('wheat') ||
        transcript.includes('gehu') ||
        transcript.includes('gehoon') ||
        transcript.includes('गेहूं') ||
        transcript.includes('गहू')
      ) {
        detectedCropId = 'wheat';
      } else if (
        transcript.includes('soybean') ||
        transcript.includes('soya') ||
        transcript.includes('सोयाबीन')
      ) {
        detectedCropId = 'soybean';
      } else if (
        transcript.includes('tomato') ||
        transcript.includes('tamatar') ||
        transcript.includes('टमाटर')
      ) {
        detectedCropId = 'tomato';
      }

      if (transcript.includes('pune') || transcript.includes('पुणे')) {
        detectedMandiId = 'pune';
      } else if (transcript.includes('indore') || transcript.includes('इंदौर')) {
        detectedMandiId = 'indore';
      } else if (
        transcript.includes('delhi') ||
        transcript.includes('azadpur') ||
        transcript.includes('आजादपुर')
      ) {
        detectedMandiId = 'azadpur';
      } else if (
        transcript.includes('nashik') ||
        transcript.includes('नाशिक') ||
        transcript.includes('नासिक')
      ) {
        detectedMandiId = 'nashik';
      }
    }

    // 2. Fetch data from DB
    const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(detectedCropId) as any;
    const mandi = db.prepare('SELECT * FROM mandis WHERE id = ?').get(detectedMandiId) as any;

    const pricePoints = db
      .prepare('SELECT * FROM price_points WHERE crop_id = ? AND mandi_id = ? ORDER BY date ASC')
      .all(detectedCropId, detectedMandiId) as any[];

    if (!crop || !mandi || pricePoints.length === 0) {
      return NextResponse.json({
        spokenResponse: `I could not find latest rates for ${transcript}. Please try asking for Tomato or Onion in Nashik.`,
        transcript,
      });
    }

    const advisory = computeAdvisory(pricePoints, crop, mandi.name);
    const latest = pricePoints[pricePoints.length - 1];
    const trendText =
      advisory.pctTrend7Day >= 0
        ? `up ${advisory.pctTrend7Day}% this week`
        : `down ${Math.abs(advisory.pctTrend7Day)}% this week`;

    // 3. Generate Natural Spoken Dialogue (English & Hindi)
    const spokenResponse = `${crop.name.split(' ')[0]} price in ${mandi.name} is ₹${latest.modal_price.toLocaleString('en-IN')} per quintal, ${trendText}. Our AI recommendation is to ${advisory.badgeTitle}.`;
    const spokenResponseHi = `${mandi.name} में ${crop.name.split(' ')[0]} का भाव ₹${latest.modal_price.toLocaleString('en-IN')} प्रति क्विंटल है। AI सलाह है: ${advisory.badgeTitleHi}।`;

    return NextResponse.json({
      transcript,
      cropId: detectedCropId,
      cropName: crop.name,
      cropIcon: crop.icon,
      mandiId: detectedMandiId,
      mandiName: mandi.name,
      modalPrice: latest.modal_price,
      minPrice: latest.min_price,
      maxPrice: latest.max_price,
      trendPct: advisory.pctTrend7Day,
      advisoryDecision: advisory.decision,
      advisoryLabel: advisory.badgeTitle,
      spokenResponse,
      spokenResponseHi,
      reason: advisory.reason,
      isGeminiParsed: !!geminiParsed,
    });
  } catch (error: any) {
    console.error('Error in voice query:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
