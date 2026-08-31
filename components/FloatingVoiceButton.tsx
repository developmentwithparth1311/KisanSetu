'use client';

import React from 'react';
import { Mic } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface FloatingVoiceButtonProps {
  onClick: () => void;
}

export const FloatingVoiceButton: React.FC<FloatingVoiceButtonProps> = ({ onClick }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={onClick}
        aria-label={t('voiceHelp')}
        className="group relative flex items-center justify-center p-3.5 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-floating transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white ring-4 ring-emerald-500/20"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Mic className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-100"></span>
            </span>
          </div>
          <span className="hidden sm:inline font-bold text-xs tracking-tight">
            {t('voiceHelp')}
          </span>
        </div>
      </button>
    </div>
  );
};
