'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Send,
  Building2,
  Lock,
  RefreshCw,
  Cpu,
} from 'lucide-react';

interface NegotiationSectionProps {
  initialLotId?: string | null;
  initialBuyerId?: string | null;
  poolContext?: { poolId: string; requirementId: string; quantity: number };
  activeRole: 'farmer' | 'buyer';
}

export const NegotiationSection: React.FC<NegotiationSectionProps> = ({
  initialLotId,
  initialBuyerId,
  poolContext,
  activeRole,
}) => {
  const [lots, setLots] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(initialLotId || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGeminiActive, setIsGeminiActive] = useState<boolean>(true);

  // Buyer Simulation State
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('b1');
  const [buyerBidAmount, setBuyerBidAmount] = useState<number>(1850);
  const [buyerMessage, setBuyerMessage] = useState<string>('');
  const [isBargaining, setIsBargaining] = useState<boolean>(false);

  const fetchLots = async () => {
    try {
      const res = await fetch('/api/lots');
      const data = await res.json();
      setLots(data.lots || []);
      setBuyers(data.buyers || []);

      if (!selectedLotId && data.lots?.length > 0) {
        setSelectedLotId(data.lots[0].id);
        setBuyerBidAmount(data.lots[0].floor_price - 100);
      }
    } catch (err) {
      console.error('Failed to fetch lots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  useEffect(() => {
    if (initialLotId) {
      setSelectedLotId(initialLotId);
    }
  }, [initialLotId]);

  useEffect(() => {
    if (initialBuyerId) setSelectedBuyerId(initialBuyerId);
  }, [initialBuyerId]);

  const activeLot = lots.find((l) => l.id === selectedLotId) || lots[0];
  const usesPoolContext = Boolean(poolContext && activeLot?.id === initialLotId);
  const negotiationQuantity = usesPoolContext ? poolContext!.quantity : activeLot?.quantity;

  const handleBuyerSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLot || isBargaining) return;

    setIsBargaining(true);
    try {
      const selectedBuyer = buyers.find((b) => b.id === selectedBuyerId) || buyers[0];

      const res = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotId: activeLot.id,
          action: 'buyer_bid',
          buyerId: selectedBuyer.id,
          buyerName: selectedBuyer.name,
          poolId: usesPoolContext ? poolContext!.poolId : undefined,
          offerAmount: Number(buyerBidAmount),
          customMessage: buyerMessage,
        }),
      });

      const json = await res.json();
      if (json.success) {
        if (json.isGeminiPowered !== undefined) {
          setIsGeminiActive(json.isGeminiPowered);
        }
        await fetchLots();
        setBuyerMessage('');
      }
    } catch (err) {
      console.error('Negotiation error:', err);
    } finally {
      setIsBargaining(false);
    }
  };

  const handleFarmerAccept = async () => {
    if (!activeLot) return;
    setIsBargaining(true);
    try {
      const res = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotId: activeLot.id,
          action: 'farmer_accept',
          poolId: usesPoolContext ? poolContext!.poolId : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchLots();
      }
    } catch (err) {
      console.error('Accept error:', err);
    } finally {
      setIsBargaining(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-card border border-border p-12 text-center shadow-card">
        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-muted-foreground">Loading AI Negotiation Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              Autonomous Bounded Bargaining
            </span>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Floor Guaranteed
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mt-2">
            AI Negotiation & Demo Settlement
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            The KisanSetu AI agent recommends bounded counter-offers using AI-assessed quality grades; the farmer confirms every final sale.
          </p>
        </div>

        <button
          onClick={fetchLots}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-muted text-xs font-bold text-foreground transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {poolContext && (
        <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Geo-Pool negotiation context</p><p className="text-xs font-semibold text-emerald-950 mt-1">Buyer requirement selected for {poolContext.quantity} qtl pooled supply.</p></div>
          <span className="text-[11px] font-bold text-emerald-800">{poolContext.poolId}</span>
        </div>
      )}

      {/* 2. Active Lots Carousel Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {lots.map((lot) => {
          const isSelected = lot.id === activeLot?.id;
          const isSold = lot.status === 'Sold' || lot.status === 'Accepted';

          return (
            <div
              key={lot.id}
              onClick={() => {
                setSelectedLotId(lot.id);
                setBuyerBidAmount(lot.floor_price - 100);
              }}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-card scale-[1.01]'
                  : 'border-border bg-card hover:bg-secondary/50 shadow-subtle'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={lot.photo_url}
                    alt=""
                    className="w-11 h-11 rounded-xl object-cover border border-border"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {lot.cropIcon} {lot.quantity} {lot.unit}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {lot.farmer_name.split(' ')[0]} • {lot.mandiName}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    isSold
                      ? 'bg-emerald-700 text-white'
                      : lot.status === 'Under Negotiation'
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {lot.status}
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/80 flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Floor: <strong className="text-amber-900">₹{lot.floor_price}</strong></span>
                <span className="text-muted-foreground">Target: <strong className="text-emerald-800">₹{lot.target_price}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {activeLot && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Negotiation Audit Timeline (7 Cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Live Bargaining Ledger
                </span>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {activeLot.id} — Audit Log
                </h3>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  activeLot.status === 'Sold'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                {activeLot.status === 'Sold' ? '🤝 Deal Closed' : '⚡ AI Active'}
              </span>
            </div>

            {/* Conversation Feed */}
            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-2">
              {activeLot.negotiationEvents?.map((event: any, idx: number) => {
                const isAI = event.sender_type === 'AI_Agent';
                const isBuyer = event.sender_type === 'Buyer';

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isAI
                        ? 'bg-emerald-50/70 border-emerald-200 shadow-subtle ml-3'
                        : isBuyer
                        ? 'bg-amber-50/70 border-amber-200 mr-3'
                        : 'bg-secondary/60 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                            isAI ? 'bg-emerald-700' : isBuyer ? 'bg-amber-600' : 'bg-slate-700'
                          }`}
                        >
                          {isAI ? <Bot className="w-3.5 h-3.5" /> : isBuyer ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-bold text-xs text-foreground">{event.sender_name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-card text-muted-foreground border border-border">
                          {event.action_type}
                        </span>
                      </div>

                      <span className="text-sm font-black text-foreground">
                        ₹{event.amount?.toLocaleString('en-IN')}/{activeLot.unit}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-foreground/90 leading-relaxed">
                      {event.message}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Farmer Action Footer */}
            {activeLot.status === 'Recommended Accept' && (
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Top Offer</span>
                  <span className="text-xl font-black text-foreground">
                    ₹{(activeLot.current_offer || activeLot.target_price).toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-muted-foreground"> / {activeLot.unit}</span>
                  </span>
                </div>

                <button
                  onClick={handleFarmerAccept}
                  disabled={isBargaining}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-card transition-all active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Deal & Record Demo Settlement</span>
                </button>
              </div>
            )}

            {/* Demo settlement confirmation banner */}
            {activeLot.status === 'Sold' && (
              <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-subtle">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-emerald-950">
                  Simulated Settlement Recorded (₹{activeLot.escrow_amount?.toLocaleString('en-IN')})
                </h4>
                <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                  Prototype settlement only: no regulated escrow or payment transfer has occurred.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Buyer Bidding Simulator (5 Cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-card space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Interactive Simulator
              </span>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-2">
                Simulate Buyer Offer
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Place an offer as a wholesale buyer to see the AI counter-bargaining in action.
              </p>
              {usesPoolContext && (
                <p className="text-[11px] font-bold text-emerald-800 mt-2">
                  Negotiating {negotiationQuantity} qtl pooled supply.
                </p>
              )}
            </div>

            <form onSubmit={handleBuyerSubmitOffer} className="space-y-4">
              {/* Buyer Selector */}
              <div>
                <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                  Select Verified Buyer
                </label>
                <select
                  value={selectedBuyerId}
                  onChange={(e) => setSelectedBuyerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border text-xs font-bold text-foreground focus:border-emerald-600 focus:ring-0"
                >
                  {buyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Trust: {b.trust_score}/100)
                    </option>
                  ))}
                </select>
              </div>

              {/* Offer Amount */}
              <div>
                <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                  Offer Amount (₹ / {activeLot.unit})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-lg font-bold text-muted-foreground">₹</span>
                  <input
                    type="number"
                    value={buyerBidAmount}
                    onChange={(e) => setBuyerBidAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 text-2xl font-black text-foreground bg-secondary/50 rounded-xl border border-border focus:border-emerald-600 focus:ring-0"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setBuyerBidAmount(activeLot.floor_price - 150)}
                    className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-[11px] font-bold border border-rose-200"
                  >
                    Low-Ball (Below Floor)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuyerBidAmount(Math.round((activeLot.floor_price + activeLot.target_price) / 2))}
                    className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold border border-amber-200"
                  >
                    Mid Bid
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuyerBidAmount(activeLot.target_price)}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200"
                  >
                    Target Bid
                  </button>
                </div>
              </div>

              {/* Custom Note */}
              <div>
                <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                  Optional Terms Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ready for immediate dispatch."
                  value={buyerMessage}
                  onChange={(e) => setBuyerMessage(e.target.value)}
                  className="w-full p-2.5 bg-secondary/50 rounded-xl border border-border text-xs text-foreground focus:border-emerald-600 focus:ring-0"
                />
              </div>

              <button
                type="submit"
                disabled={isBargaining || activeLot.status === 'Sold'}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-card transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isBargaining ? 'AI Agent Analyzing Offer...' : 'Submit Offer & Trigger AI Bargain'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
