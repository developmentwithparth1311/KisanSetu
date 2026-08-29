export interface PricePointRecord {
  id?: number;
  crop_id: string;
  mandi_id: string;
  date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrival_volume: number;
}

export interface AdvisoryResponse {
  decision: 'SELL_NOW' | 'WAIT' | 'STORE';
  badgeTitle: string;
  badgeTitleHi: string;
  shortTagline: string;
  reason: string;
  reasonHi: string;
  currentPrice: number;
  avg30Day: number;
  avg7Day: number;
  pctVs30Day: number;
  pctTrend7Day: number;
  perishabilityScore: number;
  perishabilityLabel: string;
  confidenceScore: number;
  suggestedActionTimeline: string;
  arrivalVolumeToday: number;
  arrivalVolumeAvg: number;
  arrivalImpact: 'High Supply (Price Down)' | 'Normal Supply' | 'Low Supply (Price Up)';
}

export function computeAdvisory(
  priceHistory: PricePointRecord[],
  crop: {
    id: string;
    name: string;
    perishability: number;
    basePrice: number;
  },
  mandiName: string
): AdvisoryResponse {
  if (!priceHistory || priceHistory.length === 0) {
    return {
      decision: 'WAIT',
      badgeTitle: 'Wait a Few Days',
      badgeTitleHi: 'कुछ दिन रुकें',
      shortTagline: 'Gathering more market data',
      reason: 'Sufficient market data is being processed.',
      reasonHi: 'बाजार के आंकड़ों का विश्लेषण किया जा रहा है।',
      currentPrice: crop.basePrice,
      avg30Day: crop.basePrice,
      avg7Day: crop.basePrice,
      pctVs30Day: 0,
      pctTrend7Day: 0,
      perishabilityScore: crop.perishability,
      perishabilityLabel: 'Medium',
      confidenceScore: 85,
      suggestedActionTimeline: '2-3 days',
      arrivalVolumeToday: 150,
      arrivalVolumeAvg: 150,
      arrivalImpact: 'Normal Supply',
    };
  }

  // Sort ascending by date
  const sorted = [...priceHistory].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const currentPrice = latest.modal_price;

  // 30-day window
  const last30 = sorted.slice(-30);
  const avg30Day = Math.round(last30.reduce((acc, p) => acc + p.modal_price, 0) / last30.length);

  // 7-day window
  const last7 = sorted.slice(-7);
  const avg7Day = Math.round(last7.reduce((acc, p) => acc + p.modal_price, 0) / last7.length);

  // Price from 7 days ago
  const price7DaysAgo = sorted.length >= 8 ? sorted[sorted.length - 8].modal_price : last7[0].modal_price;

  // Calculations
  const pctVs30Day = Math.round(((currentPrice - avg30Day) / avg30Day) * 100 * 10) / 10;
  const pctTrend7Day = Math.round(((currentPrice - price7DaysAgo) / price7DaysAgo) * 100 * 10) / 10;

  // Arrival volume impact
  const arrivalVolumeToday = latest.arrival_volume;
  const arrivalVolumeAvg = Math.round(last30.reduce((acc, p) => acc + p.arrival_volume, 0) / last30.length);
  let arrivalImpact: AdvisoryResponse['arrivalImpact'] = 'Normal Supply';
  if (arrivalVolumeToday > arrivalVolumeAvg * 1.25) {
    arrivalImpact = 'High Supply (Price Down)';
  } else if (arrivalVolumeToday < arrivalVolumeAvg * 0.8) {
    arrivalImpact = 'Low Supply (Price Up)';
  }

  // Perishability label
  const perishabilityLabel =
    crop.perishability >= 4 ? 'Very High (1-3 Days)' : crop.perishability === 3 ? 'Medium (1-2 Weeks)' : 'Low / Storable (>3 Months)';

  let decision: AdvisoryResponse['decision'];
  let badgeTitle: string;
  let badgeTitleHi: string;
  let shortTagline: string;
  let reason: string;
  let reasonHi: string;
  let suggestedActionTimeline: string;
  let confidenceScore = 91;

  // Rule Evaluation Engine
  if (pctVs30Day >= 8) {
    // Current price is well above monthly average
    decision = 'SELL_NOW';
    badgeTitle = 'Sell Now';
    badgeTitleHi = 'तुरंत बेचें';
    shortTagline = `Prices are ${pctVs30Day}% above the monthly average`;
    reason = `Market rates at ${mandiName} are currently ₹${currentPrice.toLocaleString('en-IN')}/qtl (${pctVs30Day}% above the 30-day average). Favorable window to lock in premium profit before fresh mandi arrivals increase.`;
    reasonHi = `${mandiName} में मौजूदा भाव 30 दिनों के औसत से ${pctVs30Day}% अधिक है। माल तुरंत बेचकर अधिक मुनाफा कमाने का यह सबसे सही समय है।`;
    suggestedActionTimeline = 'Next 24 - 48 Hours';
    confidenceScore = 95;
  } else if (pctVs30Day <= -10) {
    // Price is noticeably depressed
    if (crop.perishability >= 4) {
      // Highly perishable crop (e.g. Tomato) cannot afford storage loss
      decision = 'SELL_NOW';
      badgeTitle = 'Sell Now';
      badgeTitleHi = 'तुरंत बेचें';
      shortTagline = 'High spoilage risk — liquidate to avoid post-harvest losses';
      reason = `Although prices are below monthly average, ${crop.name} has high perishability (${perishabilityLabel}). Selling today avoids weight loss and produce degradation.`;
      reasonHi = `भाव कुछ कम हैं, लेकिन जल्द खराब होने वाली फसल होने के कारण आज ही बेचना नुकसान से बचाएगा।`;
      suggestedActionTimeline = 'Immediate (Today)';
      confidenceScore = 88;
    } else {
      // Storable crop (Onion, Potato, Wheat, Soybean)
      decision = 'STORE';
      badgeTitle = 'Store in Warehouse';
      badgeTitleHi = 'भंडारण करें';
      shortTagline = `Prices are ${Math.abs(pctVs30Day)}% below normal — hold for market recovery`;
      reason = `Current prices are temporarily dipped by ${Math.abs(pctVs30Day)}% at ${mandiName}. Since ${crop.name} is storable, holding in local warehouse/cold storage for 2-4 weeks will yield ₹${Math.round(avg30Day * 1.1).toLocaleString('en-IN')}+/qtl.`;
      reasonHi = `मौजूदा भाव मंदी में है (${Math.abs(pctVs30Day)}% कम)। फसल को वेयरहाउस या कोल्ड स्टोरेज में रखें, कुछ हफ्तों में भाव सुधरने की संभावना है।`;
      suggestedActionTimeline = 'Hold for 2-4 Weeks';
      confidenceScore = 93;
    }
  } else if (pctTrend7Day >= 4) {
    // Strong weekly upward momentum
    decision = 'WAIT';
    badgeTitle = 'Wait a Few Days';
    badgeTitleHi = 'कुछ दिन रुकें';
    shortTagline = `Prices gained +${pctTrend7Day}% this week — upward rally underway`;
    reason = `Rates have risen +${pctTrend7Day}% over the last 7 days. Demand from outstation buyers is building up. Holding for 3-5 days is likely to fetch higher bids.`;
    reasonHi = `पिछले 7 दिनों में भाव में +${pctTrend7Day}% की तेजी आई है। 3-5 दिन रुकने पर और बेहतर भाव मिल सकता है।`;
    suggestedActionTimeline = '3 - 5 Days';
    confidenceScore = 92;
  } else if (crop.perishability >= 4) {
    // Fast spoiling crop with stable price -> safe to sell
    decision = 'SELL_NOW';
    badgeTitle = 'Sell Now';
    badgeTitleHi = 'तुरंत बेचें';
    shortTagline = 'Steady prices — sell fresh harvest for best grade valuation';
    reason = `Prices are stable at ₹${currentPrice.toLocaleString('en-IN')}/qtl. Given fast perishability, selling fresh harvest guarantees Grade-A pricing.`;
    reasonHi = `भाव स्थिर हैं। ताजा उपज तुरंत बेचकर ग्रेड-ए का पूरा दाम प्राप्त करें।`;
    suggestedActionTimeline = 'Next 1-2 Days';
    confidenceScore = 90;
  } else {
    // Default wait for storable/steady
    decision = 'WAIT';
    badgeTitle = 'Wait a Few Days';
    badgeTitleHi = 'कुछ दिन रुकें';
    shortTagline = 'Market is consolidating — watch for upcoming buyer demand';
    reason = `Prices are holding near ₹${currentPrice.toLocaleString('en-IN')}/qtl. Mandi arrivals are moderate. Recommend waiting 2-4 days for better buying bids.`;
    reasonHi = `बाजार स्थिर है। आगामी दिनों में बड़े खरीदारों की मांग बढ़ने पर अच्छे भाव की उम्मीद है।`;
    suggestedActionTimeline = '2 - 4 Days';
    confidenceScore = 87;
  }

  return {
    decision,
    badgeTitle,
    badgeTitleHi,
    shortTagline,
    reason,
    reasonHi,
    currentPrice,
    avg30Day,
    avg7Day,
    pctVs30Day,
    pctTrend7Day,
    perishabilityScore: crop.perishability,
    perishabilityLabel,
    confidenceScore,
    suggestedActionTimeline,
    arrivalVolumeToday,
    arrivalVolumeAvg,
    arrivalImpact,
  };
}
