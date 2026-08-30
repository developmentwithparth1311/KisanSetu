'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, MapPinned, RefreshCw, Users } from 'lucide-react';
import { PoolCard } from './PoolCard';
import { BuyerMatchCard } from './BuyerMatchCard';

interface NegotiationContext { lotId: string; buyerId: string; buyerName: string; poolId: string; requirementId: string; quantity: number; }
interface GeoPoolingSectionProps { initialLotId?: string | null; onNegotiate: (context: NegotiationContext) => void; }

export const GeoPoolingSection: React.FC<GeoPoolingSectionProps> = ({ initialLotId, onNegotiate }) => {
  const [anchorLotId, setAnchorLotId] = useState<string | null>(initialLotId || null);
  const [lots, setLots] = useState<any[]>([]);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [pool, setPool] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const load = async (lotId = anchorLotId) => {
    setLoading(true); setError(''); setSuggestion(null); setPool(null); setMatches([]);
    try {
      const lotsResponse = await fetch('/api/lots');
      const lotsData = await lotsResponse.json(); setLots(lotsData.lots || []);
      const usableLotId = lotId || lotsData.lots?.find((lot: any) => lot.id === 'LOT-GEO-PRIMARY')?.id;
      if (!usableLotId) throw new Error('No lot available for Geo-Pooling.');
      setAnchorLotId(usableLotId);
      const suggestionsResponse = await fetch(`/api/pools/suggestions?lotId=${encodeURIComponent(usableLotId)}`);
      const suggestionsData = await suggestionsResponse.json();
      if (!suggestionsResponse.ok) throw new Error(suggestionsData.error || 'Could not discover nearby lots.');
      setSuggestion(suggestionsData.suggestions?.[0] || null);
    } catch (err: any) { setError(err.message || 'Could not load Geo-Pooling.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(initialLotId || undefined); }, [initialLotId]);

  const joinPool = async () => {
    if (!anchorLotId) return; setJoining(true); setError('');
    try {
      const response = await fetch('/api/pools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lotId: anchorLotId }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not join pool.');
      setPool(data.pool);
      const matchResponse = await fetch(`/api/matches?poolId=${encodeURIComponent(data.pool.id)}`);
      const matchData = await matchResponse.json(); if (!matchResponse.ok) throw new Error(matchData.error || 'Could not find buyer matches.');
      setMatches(matchData.matches || []);
    } catch (err: any) { setError(err.message || 'Could not join pool.'); }
    finally { setJoining(false); }
  };

  if (loading) return <div className="rounded-3xl bg-card border border-border p-12 text-center shadow-card"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" /><p className="text-xs font-semibold text-muted-foreground">Searching nearby compatible farmers...</p></div>;

  return <div className="space-y-7">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-card"><div><span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"><MapPinned className="w-3.5 h-3.5" /> Collective Market Access</span><h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">Geo-Pooling & Buyer Matching</h1><p className="text-xs text-muted-foreground mt-1">Aggregate compatible nearby lots before comparing verified buyer requirements.</p></div><button onClick={() => load()} className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-muted text-xs font-bold flex items-center gap-1.5 self-start"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button></div>
    {error && <div className="rounded-2xl p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    {suggestion ? <PoolCard suggestion={suggestion} joining={joining} joined={Boolean(pool)} onJoin={joinPool} /> : <div className="rounded-3xl bg-card border border-border p-8 text-center space-y-3"><Users className="w-8 h-8 text-emerald-600 mx-auto" /><h2 className="font-bold text-foreground">No compatible pool for this listing yet</h2><p className="text-xs text-muted-foreground max-w-md mx-auto">A pool needs compatible crop, variety, grade, availability, and location details. Load the seeded Nashik Red Onion demo to view the full 106 qtl opportunity.</p>{lots.some((lot) => lot.id === 'LOT-GEO-PRIMARY') && <button onClick={() => load('LOT-GEO-PRIMARY')} className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold">Load 106 qtl demo pool</button>}</div>}
    {pool && <section className="space-y-4"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center"><Users className="w-4 h-4" /></span><div><h2 className="font-bold text-foreground">Verified buyer matches</h2><p className="text-xs text-muted-foreground">Pool joined. Only hard-feasible requirements are recommended.</p></div></div>{matches.length ? <div className="grid lg:grid-cols-2 gap-5">{matches.map((match) => <BuyerMatchCard key={match.requirementId} match={match} onNegotiate={() => onNegotiate({ lotId: anchorLotId || 'LOT-GEO-PRIMARY', buyerId: match.buyerId, buyerName: match.buyerName, poolId: pool.id, requirementId: match.requirementId, quantity: pool.total_quantity })} />)}</div> : <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs font-semibold text-amber-900">No hard-feasible buyer requirements are available for this pool.</div>}</section>}
  </div>;
};
