'use client';

import React from 'react';
import {
  BadgeIndianRupee,
  Handshake,
  Home,
  Languages,
  MapPinned,
  Mic,
  PackagePlus,
  Sprout,
  UserRound,
} from 'lucide-react';
import { AppLanguage, useLanguage } from './LanguageProvider';

export type NavigationTab = 'home' | 'price' | 'lots' | 'pooling' | 'negotiation';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
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
  const { language, setLanguage, t, l } = useLanguage();

  const languageOptions: Array<{ value: AppLanguage; label: string }> = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिंदी' },
    { value: 'mr', label: 'मराठी' },
  ];

  const links = [
    { tab: 'home' as const, icon: Home, label: l('Home', 'होम', 'मुख्यपृष्ठ') },
    { tab: 'price' as const, icon: BadgeIndianRupee, label: l('Prices', 'मंडी भाव', 'बाजारभाव') },
    { tab: 'lots' as const, icon: PackagePlus, label: l('My Lot', 'मेरा लॉट', 'माझा लॉट') },
    { tab: 'pooling' as const, icon: MapPinned, label: l('Pool & Buyers', 'पूल और खरीदार', 'पूल आणि खरेदीदार') },
    { tab: 'negotiation' as const, icon: Handshake, label: l('Deals', 'सौदे', 'व्यवहार') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-950/10 bg-white/95 shadow-[0_1px_12px_rgba(6,78,59,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:h-[72px] lg:px-8 xl:px-10">
        <button
          onClick={() => onSelectTab('home')}
          className="flex shrink-0 items-center gap-3 text-left"
          aria-label={l('KisanSetu home', 'किसानसेतु होम', 'किसानसेतू मुख्यपृष्ठ')}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-subtle">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-lg font-black leading-none tracking-tight text-foreground">
              Kisan<span className="text-emerald-700">Setu</span>
            </span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {l('Fair farm trade', 'उचित किसान व्यापार', 'न्याय्य शेतमाल व्यापार')}
            </span>
          </span>
        </button>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label={l('Main navigation', 'मुख्य नेविगेशन', 'मुख्य नेव्हिगेशन')}>
          {links.map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              title={label}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors xl:px-4 ${
                currentTab === tab
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <label className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-xs font-bold text-foreground">
            <Languages className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            <span className="sr-only">{t('language')}</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as AppLanguage)}
              className="max-w-[74px] cursor-pointer bg-transparent text-xs font-bold outline-none sm:max-w-none"
              aria-label={t('language')}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <button
            onClick={onToggleRole}
            className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary 2xl:flex"
          >
            <UserRound className="h-4 w-4 text-emerald-700" />
            {activeRole === 'farmer'
              ? l('Farmer view', 'किसान दृश्य', 'शेतकरी दृश्य')
              : l('Buyer view', 'खरीदार दृश्य', 'खरेदीदार दृश्य')}
          </button>

          <button
            onClick={onOpenVoice}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-black text-white shadow-subtle transition hover:bg-emerald-800 active:scale-95 sm:px-4"
          >
            <Mic className="h-4 w-4" />
            <span className="hidden md:inline">{t('voiceHelp')}</span>
          </button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-border/70 bg-white px-3 py-2 lg:hidden" aria-label={l('Main navigation', 'मुख्य नेविगेशन', 'मुख्य नेव्हिगेशन')}>
        {links.map(({ tab, icon: Icon, label }) => (
          <button
            key={tab}
            onClick={() => onSelectTab(tab)}
            className={`flex min-w-max flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold ${
              currentTab === tab ? 'bg-emerald-50 text-emerald-800' : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
};
