'use client';

import React from 'react';
import {
  TrendingUp,
  Clock,
  Warehouse,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  CloudRain,
  Thermometer,
  Droplets,
  AlertTriangle,
  Sun,
} from 'lucide-react';
import type { AdvisoryResponse, MandiWeather } from '@/lib/client-types';

interface AdvisoryCardProps {
  advisory: AdvisoryResponse;
  cropName: string;
  mandiName: string;
  weather?: MandiWeather;
}

export const AdvisoryCard: React.FC<AdvisoryCardProps> = ({
  advisory,
  cropName,
  mandiName,
  weather,
}) => {
  const isSellNow = advisory.decision === 'SELL_NOW';
  const isWait = advisory.decision === 'WAIT';
  const isStore = advisory.decision === 'STORE';

  const config = {
    SELL_NOW: {
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-600 text-white',
      pillBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      actionTitle: 'Sell Now (तुरंत बेचें)',
      statusDot: 'bg-emerald-500',
    },
    WAIT: {
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderColor: 'border-amber-500/30',
      badgeBg: 'bg-amber-500 text-white',
      pillBg: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: <Clock className="w-5 h-5 text-white" />,
      actionTitle: 'Wait a Few Days (कुछ दिन रुकें)',
      statusDot: 'bg-amber-500',
    },
    STORE: {
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      borderColor: 'border-blue-500/30',
      badgeBg: 'bg-blue-600 text-white',
      pillBg: 'bg-blue-50 text-blue-900 border-blue-200',
      icon: <Warehouse className="w-5 h-5 text-white" />,
      actionTitle: 'Store in Warehouse (भंडारण करें)',
      statusDot: 'bg-blue-500',
    },
  }[advisory.decision];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-card border-2 ${config.borderColor} p-6 sm:p-8 shadow-card transition-all space-y-6`}
    >
      {/* Subtle Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} pointer-events-none`} />

      <div className="relative z-10 space-y-6">
        {/* Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${config.badgeBg} flex items-center justify-center shadow-sm`}>
              {config.icon}
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                AI Sale-Window Engine
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{config.actionTitle}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-card border border-border shadow-subtle text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
              {advisory.confidenceScore}% Model Confidence
            </span>
            <span className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full border ${config.pillBg}`}>
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              {advisory.suggestedActionTimeline}
            </span>
          </div>
        </div>

        {/* Big Plain-Language Highlight */}
        <div className="p-5 rounded-2xl bg-secondary/60 border border-border/80 space-y-1.5">
          <p className="text-lg sm:text-xl font-bold text-foreground leading-snug">
            {advisory.reason}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            💡 {advisory.reasonHi}
          </p>
        </div>

        {/* Weather Intelligence Strip */}
        {weather && (
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
                {weather.conditionIcon.startsWith('http') ? (
                  <img src={weather.conditionIcon} alt="" className="w-7 h-7 object-contain" />
                ) : (
                  <span>{weather.conditionIcon}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {weather.mandiName} Weather: {weather.temp}°C • {weather.condition}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      weather.spoilageRisk === 'High'
                        ? 'bg-rose-100 text-rose-800'
                        : weather.spoilageRisk === 'Moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {weather.spoilageRisk} Spoilage Risk
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Humidity: {weather.humidity}% • 48h Rain Probability: {weather.rainProbabilityNext48h}%
                  {weather.isLive ? ' (OpenWeatherMap Live API)' : ' (Telemetry Active)'}
                </p>
              </div>
            </div>

            {weather.weatherAlert && (
              <span className="text-[11px] font-semibold text-amber-900 bg-amber-100/80 px-3 py-1 rounded-lg border border-amber-300 flex items-center gap-1.5 self-stretch sm:self-auto">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                <span>{weather.weatherAlert}</span>
              </span>
            )}
          </div>
        )}

        {/* 4 Clean Metric Cards (Uncrowded, High Readability) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {/* Stat 1: Current Rate */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current Modal Rate
            </span>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              ₹{advisory.currentPrice.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-muted-foreground">/qtl</span>
            </p>
            <p
              className={`text-xs font-semibold flex items-center ${
                advisory.pctTrend7Day >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              {advisory.pctTrend7Day >= 0 ? `+${advisory.pctTrend7Day}%` : `${advisory.pctTrend7Day}%`} in 7 days
            </p>
          </div>

          {/* Stat 2: 30-Day Average */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              30-Day Mandi Avg
            </span>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              ₹{advisory.avg30Day.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-muted-foreground">/qtl</span>
            </p>
            <p
              className={`text-xs font-semibold ${
                advisory.pctVs30Day >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {advisory.pctVs30Day >= 0 ? `+${advisory.pctVs30Day}% vs avg` : `${advisory.pctVs30Day}% vs avg`}
            </p>
          </div>

          {/* Stat 3: Shelf Life */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Produce Shelf-Life
            </span>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {advisory.perishabilityLabel.split(' ')[0]}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {advisory.perishabilityScore >= 4 ? '⚠️ Fast spoilage risk' : '📦 Storage suitable'}
            </p>
          </div>

          {/* Stat 4: Market Supply */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mandi Supply Today
            </span>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {advisory.arrivalVolumeToday} <span className="text-xs font-normal text-muted-foreground">Tonnes</span>
            </p>
            <p className="text-xs font-semibold text-muted-foreground truncate">
              {advisory.arrivalImpact}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
