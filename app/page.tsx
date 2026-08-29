'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { PriceDashboard } from '@/components/PriceDashboard';
import { LotCreationWizard } from '@/components/LotCreationWizard';
import { NegotiationSection } from '@/components/NegotiationSection';
import { VoiceAssistantModal } from '@/components/VoiceAssistantModal';
import { FloatingVoiceButton } from '@/components/FloatingVoiceButton';
import {
  TrendingUp,
  ShieldCheck,
  Bot,
  Mic,
  ArrowRight,
  Sprout,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<'price' | 'lots' | 'negotiation'>('price');
  const [activeRole, setActiveRole] = useState<'farmer' | 'buyer'>('farmer');
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [selectedCropIdForListing, setSelectedCropIdForListing] = useState<string>('tomato');
  const [selectedMandiIdForListing, setSelectedMandiIdForListing] = useState<string>('nashik');
  const [createdLotId, setCreatedLotId] = useState<string | null>(null);

  const handleNavigateToListProduce = (cropId: string, mandiId: string) => {
    setSelectedCropIdForListing(cropId);
    setSelectedMandiIdForListing(mandiId);
    setCurrentTab('lots');
  };

  const handleLotCreated = (newLotId: string) => {
    setCreatedLotId(newLotId);
    setCurrentTab('negotiation');
  };

  const handleToggleRole = () => {
    setActiveRole((prev) => (prev === 'farmer' ? 'buyer' : 'farmer'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Glass Header Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenVoice={() => setIsVoiceOpen(true)}
        activeRole={activeRole}
        onToggleRole={handleToggleRole}
      />

      {/* 2. Top Metric & Live Status Strip */}
      <div className="border-b border-border/70 bg-card/60 px-4 py-2">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between text-xs font-semibold gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
              Live Mandi Feeds (Agmarknet & e-NAM)
            </span>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <span className="hidden sm:flex items-center text-muted-foreground">
              <Bot className="w-3.5 h-3.5 text-emerald-700 mr-1" />
              Autonomous Bounded Bargaining Active
            </span>
          </div>

          <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
            <span className="flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 mr-1" />
              100% Escrow Protection
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Uncrowded Body Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* TAB 1: Mandi Prices & AI Advisory */}
        {currentTab === 'price' && (
          <div className="animate-in fade-in duration-200">
            <PriceDashboard onNavigateToListProduce={handleNavigateToListProduce} />
          </div>
        )}

        {/* TAB 2: Produce Listing & AI Grading */}
        {currentTab === 'lots' && (
          <div className="animate-in fade-in duration-200">
            <LotCreationWizard
              initialCropId={selectedCropIdForListing}
              initialMandiId={selectedMandiIdForListing}
              onLotCreated={handleLotCreated}
            />
          </div>
        )}

        {/* TAB 3: AI Negotiation & Escrow Deals */}
        {currentTab === 'negotiation' && (
          <div className="animate-in fade-in duration-200">
            <NegotiationSection initialLotId={createdLotId} activeRole={activeRole} />
          </div>
        )}
      </main>

      {/* 4. Persistent Floating Voice Assistant Button */}
      <FloatingVoiceButton onClick={() => setIsVoiceOpen(true)} />

      {/* 5. Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSelectCropAndMandi={(cId, mId) => {
          setSelectedCropIdForListing(cId);
          setSelectedMandiIdForListing(mId);
          setCurrentTab('price');
        }}
      />

      {/* 6. Footer */}
      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-foreground">
            🌾 KisanSetu (किसान सेतु) — Smart India Hackathon Prototype (SIH26132)
          </p>
          <p className="text-muted-foreground text-[11px]">
            Designed for Smallholder Farmers • PWA Accessible • Sarvam AI & Web Speech
          </p>
        </div>
      </footer>
    </div>
  );
}
