'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  MapPin,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Info,
  CloudSun,
  Database,
} from 'lucide-react';
import { AdvisoryCard } from './AdvisoryCard';
import { useLanguage } from './LanguageProvider';

interface PriceDashboardProps {
  onNavigateToListProduce: (cropId: string, mandiId: string) => void;
}

export const PriceDashboard: React.FC<PriceDashboardProps> = ({ onNavigateToListProduce }) => {
  const { l } = useLanguage();
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato');
  const [selectedMandiId, setSelectedMandiId] = useState<string>('nashik');
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPriceData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/prices?crop=${selectedCropId}&mandi=${selectedMandiId}&days=${timeframe}`
      );
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load prices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceData();
  }, [selectedCropId, selectedMandiId, timeframe]);

  const crops = data?.crops || [
    { id: 'tomato', name: 'Tomato (टमाटर)', icon: '🍅' },
    { id: 'onion', name: 'Onion (प्याज़)', icon: '🧅' },
    { id: 'potato', name: 'Potato (आलू)', icon: '🥔' },
    { id: 'wheat', name: 'Wheat (गेहूं)', icon: '🌾' },
    { id: 'soybean', name: 'Soybean (सोयाबीन)', icon: '🌱' },
  ];

  const mandis = data?.mandis || [
    { id: 'nashik', name: 'Nashik APMC', state: 'Maharashtra' },
    { id: 'pune', name: 'Pune Gultekdi', state: 'Maharashtra' },
    { id: 'indore', name: 'Indore Mandi', state: 'Madhya Pradesh' },
    { id: 'azadpur', name: 'Azadpur Mandi', state: 'Delhi' },
  ];

  const cropLabel = (crop: any) => {
    const labels: Record<string, [string, string, string]> = {
      tomato: ['Tomato', 'टमाटर', 'टोमॅटो'],
      onion: ['Onion', 'प्याज़', 'कांदा'],
      potato: ['Potato', 'आलू', 'बटाटा'],
      wheat: ['Wheat', 'गेहूं', 'गहू'],
      soybean: ['Soybean', 'सोयाबीन', 'सोयाबीन'],
    };
    const label = labels[crop.id];
    return label ? l(...label) : crop.name;
  };

  const formattedChartData =
    data?.priceHistory?.map((p: any) => ({
      date: p.date.substring(5), // 'MM-DD'
      modalPrice: p.modal_price,
      minPrice: p.min_price,
      maxPrice: p.max_price,
      arrivalVolume: p.arrival_volume,
    })) || [];

  return (
    <div className="space-y-8">
      {/* 1. Crop Selector Cards (Clean, Large Visual Affordance for Farmers) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {l('Select your crop', 'अपनी फसल चुनें', 'तुमचे पीक निवडा')}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {data?.isLiveAgmarknet
                ? l('Live Agmarknet prices', 'लाइव Agmarknet भाव', 'थेट Agmarknet भाव')
                : l('Verified demo market feed', 'सत्यापित डेमो मंडी डेटा', 'पडताळलेला डेमो बाजार डेटा')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {crops.map((c: any) => {
            const isSelected = c.id === selectedCropId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCropId(c.id)}
                className={`relative p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-200 border-2 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-card text-emerald-950 scale-[1.02]'
                    : 'border-border bg-card hover:bg-secondary/60 text-foreground shadow-subtle'
                }`}
              >
                <span className="text-3xl mb-1.5">{c.icon}</span>
                <span className="font-bold text-sm tracking-tight">{cropLabel(c)}</span>

                {isSelected && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Mandi & Timeframe Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-subtle">
        {/* Mandi Selector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {l('Market / APMC mandi', 'बाज़ार / APMC मंडी', 'बाजार / APMC मंडी')}
            </span>
            <select
              value={selectedMandiId}
              onChange={(e) => setSelectedMandiId(e.target.value)}
              className="text-base font-bold text-foreground bg-transparent border-0 focus:ring-0 cursor-pointer p-0 pr-4"
            >
              {mandis.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeframe Segmented Control */}
        <div className="flex items-center bg-secondary/80 p-1 rounded-xl border border-border self-start sm:self-auto">
          {[
            { label: l('7 days', '7 दिन', '7 दिवस'), val: 7 },
            { label: l('30 days', '30 दिन', '30 दिवस'), val: 30 },
            { label: l('90 days', '90 दिन', '90 दिवस'), val: 90 },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setTimeframe(tab.val as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === tab.val
                  ? 'bg-card text-foreground shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. AI Sale-Window Advisory Card (Feature 1 Hero with Weather Telemetry) */}
      {data?.advisory && (
        <AdvisoryCard
          advisory={data.advisory}
          cropName={data?.selectedCrop?.name || selectedCropId}
          mandiName={data?.selectedMandi?.name || selectedMandiId}
          weather={data?.weather}
        />
      )}

      {/* 4. Interactive Price Graph */}
      <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              {cropLabel(data?.selectedCrop || { id: selectedCropId, name: 'Crop' })} {l('price movement', 'भाव का बदलाव', 'भावातील बदल')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {l(
                `Modal rates at ${data?.selectedMandi?.name || l('your selected mandi', 'आपकी चुनी हुई मंडी', 'तुमच्या निवडलेल्या मंडीत')} over the last ${timeframe} days.`,
                `${data?.selectedMandi?.name || 'चुनी हुई मंडी'} में पिछले ${timeframe} दिनों के मोडल भाव।`,
                `${data?.selectedMandi?.name || 'निवडलेली मंडी'} येथील मागील ${timeframe} दिवसांचे मोडल भाव.`
              )}
            </p>
          </div>

          {/* Quick Action to Sell */}
          <button
            onClick={() => onNavigateToListProduce(selectedCropId, selectedMandiId)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-subtle transition-all active:scale-95 self-start sm:self-auto"
          >
            <span>{l('Create lot at this price', 'इस भाव पर लॉट बनाएं', 'या भावावर लॉट तयार करा')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Minimal Recharts Area Chart */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#15803D" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#15803D" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" opacity={0.6} />
              <XAxis
                dataKey="date"
                stroke="#A8A29E"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickMargin={6}
              />
              <YAxis
                stroke="#A8A29E"
                tick={{ fontSize: 11, fontWeight: 500 }}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E7E5E4',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
                formatter={(value: any) => [`₹${value}/qtl`, 'Modal Price']}
              />
              <Area
                type="monotone"
                dataKey="modalPrice"
                stroke="#15803D"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#priceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Nearby Mandi Arbitrage & Comparison */}
      {data?.mandiComparisons && (
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-card space-y-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              {l('Compare nearby mandi prices', 'पास की मंडियों के भाव मिलाएं', 'जवळच्या बाजारभावांची तुलना करा')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {l('Choose a market to compare rates.', 'भावों की तुलना के लिए मंडी चुनें।', 'भावांची तुलना करण्यासाठी बाजार निवडा.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {data.mandiComparisons.map((item: any) => {
              const priceDiff = item.currentModalPrice - (data?.latestPricePoint?.modal_price || 0);
              return (
                <div
                  key={item.mandiId}
                  onClick={() => setSelectedMandiId(item.mandiId)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    item.isCurrent
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-subtle'
                      : 'border-border bg-card hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-foreground">{item.mandiName}</span>
                    {item.isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-700 text-white rounded-full">
                        {l('Selected', 'चुनी हुई', 'निवडलेले')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{item.state} • {item.distanceKm} km</p>

                  <div className="flex items-baseline justify-between border-t border-border/80 pt-2.5">
                    <span className="text-xl font-black text-foreground">
                      ₹{item.currentModalPrice.toLocaleString('en-IN')}
                    </span>
                    {!item.isCurrent && priceDiff !== 0 && (
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                          priceDiff > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {priceDiff > 0 ? `+₹${priceDiff}` : `-₹${Math.abs(priceDiff)}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
