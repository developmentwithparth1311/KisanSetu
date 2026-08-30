import { NegotiationEvaluationInput, NegotiationEvaluationOutput } from './negotiation-agent';
import { AdvisoryResponse } from './advisory-engine';
import { MandiWeather } from './weather';

export async function generateGeminiNegotiationCounter(
  input: NegotiationEvaluationInput,
  ruleBasedResult: NegotiationEvaluationOutput
): Promise<NegotiationEvaluationOutput> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key') {
    return ruleBasedResult;
  }

  try {
    const prompt = `You are "KisanSetu AI Bargaining Agent", an intelligent, polite, yet firm agricultural representative acting on behalf of an Indian farmer named ${input.farmerName}.
Produce details:
- Crop: ${input.cropName} (${input.quantity} ${input.unit})
- Certified Quality Grade: ${input.aiGrade} (${input.aiConfidence}% AI vision score)
- Farmer Hard Floor Price: ₹${input.floorPrice}/${input.unit} (CRITICAL: NEVER agree to a price below ₹${input.floorPrice})
- Farmer Target Price: ₹${input.targetPrice}/${input.unit}
- Current Local Mandi Modal Rate: ₹${input.currentMandiModalPrice}/${input.unit}

Buyer Offer:
- Buyer Name: ${input.buyerName} (Trust Score: ${input.buyerTrustScore}/100)
- Offer Amount: ₹${input.offerAmount}/${input.unit}
- Negotiation Round: ${input.negotiationRound}

Mathematical baseline recommendation:
- Baseline Action: ${ruleBasedResult.action}
- Baseline Counter Amount: ₹${ruleBasedResult.amount}/${input.unit}

INSTRUCTIONS:
1. If the baseline action is 'Accept', confirm acceptance enthusiastically and mention instant escrow security.
2. If the baseline action is 'Counter', propose ₹${ruleBasedResult.amount}/${input.unit}. Write a persuasive 2-sentence counter-justification highlighting the certified ${input.aiGrade} grade, premium freshness, and current mandi trends.
3. Output STRICT JSON format only:
{
  "action": "${ruleBasedResult.action}",
  "amount": ${ruleBasedResult.amount},
  "message": "Direct message to the buyer explaining counter/acceptance",
  "rationale": "Clear explanation to the farmer explaining why this counter protects their profit",
  "farmerRecommendation": "Short actionable advice for the farmer"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          action: parsed.action || ruleBasedResult.action,
          // Guarantee hard bounds:
          amount: Math.max(input.floorPrice, Number(parsed.amount) || ruleBasedResult.amount),
          message: parsed.message || ruleBasedResult.message,
          rationale: parsed.rationale || ruleBasedResult.rationale,
          farmerRecommendation: parsed.farmerRecommendation || ruleBasedResult.farmerRecommendation,
          statusUpdate: ruleBasedResult.statusUpdate,
        };
      }
    }
  } catch (err) {
    console.warn('Gemini negotiation generation error, fallback to rule engine:', err);
  }

  return ruleBasedResult;
}

export async function parseVoiceQueryWithGemini(transcript: string): Promise<{
  detectedCropId: string;
  detectedMandiId: string;
  intent: string;
  language: string;
} | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    return null;
  }

  try {
    const prompt = `Extract agricultural entities from this spoken query by an Indian farmer.
Query: "${transcript}"

Possible crops: "tomato", "onion", "potato", "wheat", "soybean"
Possible mandis: "nashik", "pune", "indore", "azadpur"

Return JSON only:
{
  "detectedCropId": "tomato" | "onion" | "potato" | "wheat" | "soybean",
  "detectedMandiId": "nashik" | "pune" | "indore" | "azadpur",
  "intent": "check_price" | "sell_advisory" | "general",
  "language": "hi" | "en" | "hinglish"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return JSON.parse(text);
      }
    }
  } catch (err) {
    console.warn('Gemini NLP parsing error, fallback to regex:', err);
  }

  return null;
}
