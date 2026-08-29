export interface NegotiationEvaluationInput {
  lotId: string;
  farmerName: string;
  cropName: string;
  quantity: number;
  unit: string;
  aiGrade: string;
  aiConfidence: number;
  floorPrice: number;
  targetPrice: number;
  buyerName: string;
  buyerTrustScore: number;
  offerAmount: number;
  currentMandiModalPrice: number;
  negotiationRound: number;
}

export interface NegotiationEvaluationOutput {
  action: 'Counter' | 'Accept' | 'Reject';
  amount: number;
  message: string;
  rationale: string;
  farmerRecommendation: string;
  statusUpdate: 'Active' | 'Under Negotiation' | 'Accepted' | 'Sold';
}

export function evaluateBuyerOffer(input: NegotiationEvaluationInput): NegotiationEvaluationOutput {
  const {
    cropName,
    quantity,
    unit,
    aiGrade,
    aiConfidence,
    floorPrice,
    targetPrice,
    buyerName,
    buyerTrustScore,
    offerAmount,
    currentMandiModalPrice,
    negotiationRound,
  } = input;

  const totalLotValue = offerAmount * quantity;

  // Case 1: Buyer matches or exceeds target price -> Instant Acceptance
  if (offerAmount >= targetPrice) {
    return {
      action: 'Accept',
      amount: offerAmount,
      message: `Offer Accepted! ₹${offerAmount.toLocaleString('en-IN')}/${unit} meets farmer target of ₹${targetPrice.toLocaleString('en-IN')}. Initiating Escrow Lock for ₹${(offerAmount * quantity).toLocaleString('en-IN')}.`,
      rationale: `The buyer offered ₹${offerAmount.toLocaleString('en-IN')}, which meets or exceeds your target of ₹${targetPrice.toLocaleString('en-IN')}. Full payment is secured in escrow.`,
      farmerRecommendation: 'Great outcome! Deal accepted at full target price.',
      statusUpdate: 'Accepted',
    };
  }

  // Case 2: Offer is strictly below floor price -> Firm Counter
  if (offerAmount < floorPrice) {
    // Counter calculation: Step down from target towards floor, but never below floor
    // Round 1 counter: 85% of gap from floor to target
    // Round 2+ counter: 60% of gap
    const concessionFactor = negotiationRound <= 1 ? 0.8 : 0.55;
    const rawCounter = floorPrice + (targetPrice - floorPrice) * concessionFactor;
    const counterAmount = Math.round(Math.max(floorPrice + 50, rawCounter));

    const priceDiff = floorPrice - offerAmount;

    return {
      action: 'Counter',
      amount: counterAmount,
      message: `Counter-offer: ₹${counterAmount.toLocaleString('en-IN')}/${unit}. Farmer floor price is ₹${floorPrice.toLocaleString('en-IN')}. This produce is verified ${aiGrade} (${aiConfidence}% AI quality score) with superior market freshness compared to standard arrivals at ₹${currentMandiModalPrice.toLocaleString('en-IN')}.`,
      rationale: `Buyer offered ₹${offerAmount.toLocaleString('en-IN')}, which is ₹${priceDiff.toLocaleString('en-IN')} below your hard floor (₹${floorPrice.toLocaleString('en-IN')}). AI countered at ₹${counterAmount.toLocaleString('en-IN')} defending your produce quality.`,
      farmerRecommendation: `Do not accept below ₹${floorPrice.toLocaleString('en-IN')}. The AI is protecting your profit margin.`,
      statusUpdate: 'Under Negotiation',
    };
  }

  // Case 3: Offer is between floorPrice and targetPrice
  const gap = targetPrice - offerAmount;
  const spreadPercent = ((targetPrice - offerAmount) / targetPrice) * 100;

  // If offer is very close to target (>94% of target) and buyer is highly trusted (>=90)
  if (spreadPercent <= 5 && buyerTrustScore >= 90) {
    return {
      action: 'Accept',
      amount: offerAmount,
      message: `Offer Accepted at ₹${offerAmount.toLocaleString('en-IN')}/${unit}. Verified buyer ${buyerName} (Trust Score: ${buyerTrustScore}/100) has agreed to instant escrow settlement.`,
      rationale: `Offer is within 5% of your target (₹${offerAmount.toLocaleString('en-IN')} vs target ₹${targetPrice.toLocaleString('en-IN')}) from a top-rated buyer. Accepting locks in ₹${totalLotValue.toLocaleString('en-IN')} with zero payment default risk.`,
      farmerRecommendation: 'Highly recommended to close deal now. Fast escrow payout.',
      statusUpdate: 'Accepted',
    };
  }

  // Moderate gap: Generate balanced counter
  const counterSpread = negotiationRound <= 1 ? 0.65 : 0.4;
  const counterAmount = Math.round(offerAmount + gap * counterSpread);

  return {
    action: 'Counter',
    amount: counterAmount,
    message: `Counter-offer: ₹${counterAmount.toLocaleString('en-IN')}/${unit}. We appreciate ${buyerName}'s bid of ₹${offerAmount.toLocaleString('en-IN')}. Given the certified ${aiGrade} grade and bulk volume of ${quantity} ${unit}, ₹${counterAmount.toLocaleString('en-IN')} is our best settled rate.`,
    rationale: `Buyer bid ₹${offerAmount.toLocaleString('en-IN')} (above your floor of ₹${floorPrice.toLocaleString('en-IN')}). AI is bargaining upward to capture an extra ₹${((counterAmount - offerAmount) * quantity).toLocaleString('en-IN')} for you.`,
    farmerRecommendation: `You can let the AI negotiate further or tap "Accept Offer" if you want immediate dispatch.`,
    statusUpdate: 'Under Negotiation',
  };
}
