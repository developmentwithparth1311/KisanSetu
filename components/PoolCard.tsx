'use client';

import React from 'react';
import { MapPin, Users, Wheat, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface PoolCardProps {
  suggestion: any;
  joining: boolean;
  joined: boolean;
  onJoin: () => void;
}

export const PoolCard: React.FC<PoolCardProps> = ({ suggestion, joining, joined, onJoin }) => {
  const { language, l } = useLanguage();
  const unit = language === 'en' ? suggestion.unit : suggestion.unit?.toLowerCase() === 'quintal' ? 'क्विंटल' : suggestion.unit;
  const crop = suggestion.cropId === 'onion' ? l('Onion', 'प्याज़', 'कांदा') : suggestion.cropId;
  const variety = (value?: string) => value === 'Red Onion' ? l('Red Onion', 'लाल प्याज़', 'लाल कांदा') : value || l('Standard variety', 'सामान्य किस्म', 'सामान्य वाण');
  const grade = (value: string) => language === 'en' ? value : value?.replace('Grade', 'ग्रेड');
  return (
  <article className="rounded-3xl bg-card border-2 border-emerald-300 p-6 sm:p-8 shadow-card space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <Users className="w-3.5 h-3.5" /> {l('Geo-Pool opportunity', 'जियो-पूल अवसर', 'जिओ-पूल संधी')}
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mt-3">{l('Nearby compatible produce found', 'पास में मिलती-जुलती उपज मिली', 'जवळ जुळणारा शेतमाल मिळाला')}</h2>
        <p className="text-xs text-muted-foreground mt-1">{l('Checked by crop, variety, grade, availability, and distance.', 'फसल, किस्म, ग्रेड, उपलब्धता और दूरी से जांचा गया।', 'पीक, वाण, ग्रेड, उपलब्धता आणि अंतर तपासले आहे.')}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold self-start">
        <Wheat className="w-4 h-4" /> {crop} {l('pool', 'पूल', 'पूल')}
      </span>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        [l('Your lot', 'आपका लॉट', 'तुमचा लॉट'), `${suggestion.anchorQuantity} ${unit}`],
        [l('Nearby supply', 'पास की उपज', 'जवळचा पुरवठा'), `${suggestion.nearbyQuantity} ${unit}`],
        [l('Total pool', 'कुल पूल', 'एकूण पूल'), `${suggestion.totalQuantity} ${unit}`],
        [l('Nearby farmers', 'पास के किसान', 'जवळचे शेतकरी'), `${suggestion.memberCount - 1}`],
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
            <p className="text-muted-foreground mt-0.5">{grade(member.aiGrade)} · {variety(member.variety)}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-foreground">{member.quantity} {language === 'en' ? member.unit : member.unit?.toLowerCase() === 'quintal' ? 'क्विंटल' : member.unit}</p>
            <p className="text-muted-foreground flex items-center justify-end gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {member.distanceKm} km</p>
          </div>
        </div>
      ))}
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
      <p className="text-xs font-semibold text-amber-900">{l('This pool can meet the 100 qtl buyer requirement.', 'यह पूल खरीदार की 100 क्विंटल मांग पूरी कर सकता है।', 'हा पूल खरेदीदाराची 100 क्विंटल मागणी पूर्ण करू शकतो.')}</p>
      <button onClick={onJoin} disabled={joining || joined} className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">
        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {joined ? l('Pool joined', 'पूल जुड़ गया', 'पूल जोडला') : l('Join this pool', 'इस पूल से जुड़ें', 'या पूलमध्ये सामील व्हा')}
      </button>
    </div>
  </article>
  );
};
