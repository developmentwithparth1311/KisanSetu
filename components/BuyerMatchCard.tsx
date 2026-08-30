'use client';

import React from 'react';
import { BadgeCheck, Handshake, MapPin, ShieldCheck, Sparkles } from 'lucide-react';

interface BuyerMatchCardProps {
  match: any;
  onNegotiate: () => void;
}

export const BuyerMatchCard: React.FC<BuyerMatchCardProps> = ({ match, onNegotiate }) => (
  <article className="rounded-3xl bg-card border border-border p-6 shadow-card space-y-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full"><BadgeCheck className="w-3.5 h-3.5" /> Platform-Verified Demo Buyer</span>
        <h3 className="text-lg font-bold text-foreground mt-2">{match.buyerName}</h3>
        <p className="text-xs text-muted-foreground">Needs {match.requirementQuantity} {match.unit} · {match.minimumGrade}</p>
      </div>
      <div className="text-right"><p className="text-2xl font-black text-emerald-700">{Math.round(match.matchScore * 100)}%</p><p className="text-[10px] font-bold text-muted-foreground uppercase">Match</p></div>
    </div>

    <div className="grid grid-cols-2 gap-3 text-xs">
      <div className="rounded-xl bg-secondary/60 p-3"><span className="text-muted-foreground block">Trust</span><span className="font-black text-foreground">{match.trustScore}/100</span></div>
      <div className="rounded-xl bg-secondary/60 p-3"><span className="text-muted-foreground block">Offer</span><span className="font-black text-foreground">₹{match.offerPrice?.toLocaleString('en-IN')}/qtl</span></div>
      <div className="rounded-xl bg-secondary/60 p-3"><span className="text-muted-foreground block">Effective demo value</span><span className="font-black text-foreground">₹{match.effectivePrice?.toLocaleString('en-IN')}/qtl</span></div>
      <div className="rounded-xl bg-secondary/60 p-3"><span className="text-muted-foreground block">Delivery distance</span><span className="font-black text-foreground">{match.distanceKm} km</span></div>
    </div>

    <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-4"><p className="text-[10px] font-bold uppercase text-emerald-800 mb-2">Why this match?</p><ul className="space-y-1.5">{match.reasons.slice(0, 5).map((reason: string) => <li key={reason} className="text-xs text-emerald-950 flex gap-2"><Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-700 mt-0.5" />{reason}</li>)}</ul></div>

    <button onClick={onNegotiate} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-subtle"><Handshake className="w-4 h-4" /> Negotiate with Buyer</button>
  </article>
);
