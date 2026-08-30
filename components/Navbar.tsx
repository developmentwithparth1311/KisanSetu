'use client';

import React from 'react';
import {
  TrendingUp,
  PlusCircle,
  MessageSquareQuote,
  Mic,
  ArrowRightLeft,
  UsersRound,
  Sparkles,
  Shield,
  Sprout,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'price' | 'lots' | 'pooling' | 'negotiation';
  onSelectTab: (tab: 'price' | 'lots' | 'pooling' | 'negotiation') => void;
  onOpenVoice: () => void;
  activeRole: 'farmer' | 'buyer';
  onToggleRole: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenVoice,
  activeRole,
  onToggleRole,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-header border-b border-border/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <div
            onClick={() => onSelectTab('price')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center text-white shadow-card shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  Kisan<span className="text-emerald-700">Setu</span>
                </span>
                <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  SIH26132
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                AI Market Intelligence & Fair Trade
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Modern ShadCN Segmented Control) */}
          <nav className="hidden md:flex items-center bg-secondary/80 p-1.5 rounded-2xl border border-border">
            <button
              onClick={() => onSelectTab('pooling')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentTab === 'pooling'
                  ? 'bg-card text-foreground shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UsersRound className="w-4 h-4 text-emerald-600" />
              <span>Pool & Buyers</span>
            </button>

            <button
              onClick={() => onSelectTab('price')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentTab === 'price'
                  ? 'bg-card text-foreground shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Prices & Advisory</span>
            </button>

            <button
              onClick={() => onSelectTab('lots')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentTab === 'lots'
                  ? 'bg-card text-foreground shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>List & AI Grade</span>
            </button>

            <button
              onClick={() => onSelectTab('negotiation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentTab === 'negotiation'
                  ? 'bg-card text-foreground shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquareQuote className="w-4 h-4 text-emerald-600" />
              <span>AI Deals & Bargain</span>
            </button>
          </nav>

          {/* Right Action Tools: Role Switcher & Voice Agent */}
          <div className="flex items-center gap-2.5">
            {/* Role Simulation Switcher */}
            <button
              onClick={onToggleRole}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-secondary/60 transition-colors shadow-subtle"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
              <span>
                Role: <strong className="uppercase text-emerald-700">{activeRole}</strong>
              </span>
            </button>

            {/* Voice Assistant Trigger */}
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 text-white text-xs font-bold shadow-card shadow-emerald-700/20 hover:from-emerald-700 hover:to-green-800 transition-all active:scale-95"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">Voice Help (बोलें)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Tab Navigation */}
      <div className="md:hidden flex items-center justify-around border-t border-border bg-card px-2 py-2">
        <button
          onClick={() => onSelectTab('pooling')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg ${
            currentTab === 'pooling'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'text-muted-foreground'
          }`}
        >
          🌐 Pool
        </button>
        <button
          onClick={() => onSelectTab('price')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg ${
            currentTab === 'price'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'text-muted-foreground'
          }`}
        >
          📈 Prices
        </button>
        <button
          onClick={() => onSelectTab('lots')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg ${
            currentTab === 'lots'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'text-muted-foreground'
          }`}
        >
          🌱 List Produce
        </button>
        <button
          onClick={() => onSelectTab('negotiation')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg ${
            currentTab === 'negotiation'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'text-muted-foreground'
          }`}
        >
          🤝 AI Deals
        </button>
      </div>
    </header>
  );
};
