'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { PriceDashboard } from '@/components/PriceDashboard';
import { LotCreationWizard } from '@/components/LotCreationWizard';
import { NegotiationSection } from '@/components/NegotiationSection';
import { VoiceAssistantModal } from '@/components/VoiceAssistantModal';
import { FloatingVoiceButton } from '@/components/FloatingVoiceButton';
import { GeoPoolingSection } from '@/components/GeoPoolingSection';
import { FarmerJourney } from '@/components/FarmerJourney';
import type { NavigationTab } from '@/components/Navbar';
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
import { useLanguage } from '@/components/LanguageProvider';

export default function HomePage() {
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [activeRole, setActiveRole] = useState<'farmer' | 'buyer'>('farmer');
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [selectedCropIdForListing, setSelectedCropIdForListing] = useState<string>('tomato');
  const [selectedMandiIdForListing, setSelectedMandiIdForListing] = useState<string>('nashik');
  const [createdLotId, setCreatedLotId] = useState<string | null>(null);
  const [negotiationContext, setNegotiationContext] = useState<{ buyerId: string; buyerName: string; poolId: string; requirementId: string; quantity: number } | null>(null);

  const handleNavigateToListProduce = (cropId: string, mandiId: string) => {
    setSelectedCropIdForListing(cropId);
    setSelectedMandiIdForListing(mandiId);
    setCurrentTab('lots');
  };

  const handleLotCreated = (newLotId: string) => {
    setCreatedLotId(newLotId);
    setNegotiationContext(null);
    setCurrentTab('pooling');
  };

  const handlePoolNegotiation = (context: { lotId: string; buyerId: string; buyerName: string; poolId: string; requirementId: string; quantity: number }) => {
    setCreatedLotId(context.lotId);
    setNegotiationContext({ buyerId: context.buyerId, buyerName: context.buyerName, poolId: context.poolId, requirementId: context.requirementId, quantity: context.quantity });
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

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {currentTab === 'home' && (
          <div className="animate-in fade-in duration-200">
            <FarmerJourney onNavigate={setCurrentTab} />
          </div>
        )}

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

        {/* TAB 3: Geo-Pooling and verified-buyer requirements */}
        {currentTab === 'pooling' && (
          <div className="animate-in fade-in duration-200">
            <GeoPoolingSection initialLotId={createdLotId} onNegotiate={handlePoolNegotiation} />
          </div>
        )}

        {/* TAB 4: AI Negotiation & simulated settlement */}
        {currentTab === 'negotiation' && (
          <div className="animate-in fade-in duration-200">
            <NegotiationSection initialLotId={createdLotId} initialBuyerId={negotiationContext?.buyerId} poolContext={negotiationContext ? { poolId: negotiationContext.poolId, requirementId: negotiationContext.requirementId, quantity: negotiationContext.quantity } : undefined} activeRole={activeRole} />
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
            {t('footerProduct')}
          </p>
          <p className="text-muted-foreground text-[11px]">
            {t('footerDetail')}
          </p>
        </div>
      </footer>
    </div>
  );
}
