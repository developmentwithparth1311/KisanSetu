/** Frontend-only API response types retained after the Python backend cutover. */

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

export interface MandiWeather {
  mandiId: string;
  mandiName: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  conditionIcon: string;
  rainProbabilityNext48h: number;
  spoilageRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  weatherAlert?: string;
  isLive: boolean;
}
