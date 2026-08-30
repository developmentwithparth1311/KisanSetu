'use client';

import React from 'react';
import { MapPin, Users, Wheat, CheckCircle2, Loader2 } from 'lucide-react';

interface PoolCardProps {
  suggestion: any;
  joining: boolean;
  joined: boolean;
  onJoin: () => void;
}

export const PoolCard: React.FC<PoolCardProps> = ({ suggestion, joining, joined, onJoin }) => (
  <article className="rounded-3xl bg-card border-2 border-emerald-300 p-6 sm:p-8 shadow-card space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <Users className="w-3.5 h-3.5" /> Geo-Pool Opportunity
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mt-3">Nearby compatible supply found</h2>
        <p className="text-xs text-muted-foreground mt-1">Deterministic crop, variety, grade, availability, and radius checks.</p>
      </div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold self-start">
        <Wheat className="w-4 h-4" /> {suggestion.cropId} pool
      </span>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        ['Your lot', `${suggestion.anchorQuantity} ${suggestion.unit}`],
        ['Nearby supply', `${suggestion.nearbyQuantity} ${suggestion.unit}`],
        ['Potential pool', `${suggestion.totalQuantity} ${suggestion.unit}`],
        ['Compatible farmers', `${suggestion.memberCount - 1}`],
      ].map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-4">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block">{label}</span>
          <span className="text-xl font-black text-emerald-950 mt-1 block">{value}</span>
        </div>
      ))}
    </div>

    <div className="rounded-2xl border border-border bg-secondary/40 divide-y divide-border">
      {suggestion.members.map((member: any) => (
        <div key={member.lotId} className="flex items-center justify-between gap-3 p-3.5 text-xs">
          <div>
            <p className="font-bold text-foreground">{member.farmerName}</p>
            <p className="text-muted-foreground mt-0.5">{member.aiGrade} · {member.variety || 'Standard variety'}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-foreground">{member.quantity} {member.unit}</p>
            <p className="text-muted-foreground flex items-center justify-end gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {member.distanceKm} km</p>
          </div>
        </div>
      ))}
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
      <p className="text-xs font-semibold text-amber-900">This potential pool can satisfy the seeded 100 qtl buyer requirement.</p>
      <button onClick={onJoin} disabled={joining || joined} className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">
        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {joined ? 'Pool Joined' : 'Join Pool'}
      </button>
    </div>
  </article>
);
