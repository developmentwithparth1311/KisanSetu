'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'en' | 'hi' | 'mr';

type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    language: 'Language',
    english: 'English',
    hindi: 'हिंदी',
    marathi: 'मराठी',
    pool: 'Pool & Buyers',
    prices: 'Prices & Advisory',
    list: 'List & AI Grade',
    negotiate: 'AI Deals & Bargain',
    role: 'Role',
    voiceHelp: 'Voice Help',
    liveFeeds: 'Live Mandi Feeds (Agmarknet & e-NAM)',
    bargainingActive: 'Autonomous Bounded Bargaining Active',
    demoMode: 'Demo Settlement Test Mode',
    footerProduct: 'KisanSetu (किसान सेतु) — Smart India Hackathon Prototype (SIH26132)',
    footerDetail: 'Designed for Smallholder Farmers • PWA Accessible • Web Speech enabled',
    voiceAgent: 'KisanSetu Voice Agent',
    voiceTitle: 'Spoken Price Assistant',
    voiceDescription: 'Ask in your selected language for mandi rates and advice.',
    listening: 'Listening…',
    speaking: 'Speaking response…',
    tapToSpeak: 'Tap microphone to speak',
    transcript: 'Transcribed speech',
    modalRate: 'Modal rate',
    fullChart: 'View full chart & advisory',
    quickQueries: 'Quick voice queries',
    voiceUnsupported: 'Speech recognition is not supported in this browser. Please use a quick question below.',
    micDenied: 'Microphone access was denied. You can use a quick question below to test.',
    micFailed: 'Microphone failed to start. Please select a quick question below.',
    voiceFailed: 'Could not process the voice query. Please try again.',
  },
  hi: {
    language: 'भाषा',
    english: 'English',
    hindi: 'हिंदी',
    marathi: 'मराठी',
    pool: 'पूल और खरीदार',
    prices: 'भाव और सलाह',
    list: 'लॉट और AI ग्रेड',
    negotiate: 'AI सौदा और मोलभाव',
    role: 'भूमिका',
    voiceHelp: 'आवाज़ सहायता',
    liveFeeds: 'लाइव मंडी भाव (Agmarknet और e-NAM)',
    bargainingActive: 'सुरक्षित स्वचालित मोलभाव सक्रिय',
    demoMode: 'डेमो सेटलमेंट टेस्ट मोड',
    footerProduct: '🌾 किसानसेतु — स्मार्ट इंडिया हैकाथॉन प्रोटोटाइप (SIH26132)',
    footerDetail: 'छोटे किसानों के लिए बनाया गया • PWA उपलब्ध • आवाज़ सुविधा उपलब्ध',
    voiceAgent: 'किसानसेतु आवाज़ सहायक',
    voiceTitle: 'आवाज़ से मंडी भाव',
    voiceDescription: 'अपने चुने हुए भाषा में मंडी के भाव और सलाह पूछें।',
    listening: 'सुन रहे हैं…',
    speaking: 'जवाब सुनाया जा रहा है…',
    tapToSpeak: 'बोलने के लिए माइक्रोफ़ोन दबाएँ',
    transcript: 'सुनी गई बात',
    modalRate: 'मोडल भाव',
    fullChart: 'पूरा चार्ट और सलाह देखें',
    quickQueries: 'त्वरित आवाज़ प्रश्न',
    voiceUnsupported: 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। नीचे दिए प्रश्न का उपयोग करें।',
    micDenied: 'माइक्रोफ़ोन की अनुमति नहीं मिली। नीचे दिया प्रश्न चुनकर परीक्षण करें।',
    micFailed: 'माइक्रोफ़ोन शुरू नहीं हो सका। नीचे दिया प्रश्न चुनें।',
    voiceFailed: 'आवाज़ प्रश्न पूरा नहीं हो सका। कृपया फिर कोशिश करें।',
  },
  mr: {
    language: 'भाषा',
    english: 'English',
    hindi: 'हिंदी',
    marathi: 'मराठी',
    pool: 'पूल आणि खरेदीदार',
    prices: 'भाव आणि सल्ला',
    list: 'लॉट आणि AI ग्रेड',
    negotiate: 'AI व्यवहार आणि वाटाघाटी',
    role: 'भूमिका',
    voiceHelp: 'आवाज मदत',
    liveFeeds: 'थेट मंडी भाव (Agmarknet आणि e-NAM)',
    bargainingActive: 'सुरक्षित स्वयंचलित वाटाघाटी सुरू आहेत',
    demoMode: 'डेमो सेटलमेंट चाचणी मोड',
    footerProduct: '🌾 किसानसेतू — स्मार्ट इंडिया हॅकाथॉन प्रोटोटाइप (SIH26132)',
    footerDetail: 'लघुधारक शेतकऱ्यांसाठी • PWA उपलब्ध • आवाज सुविधा उपलब्ध',
    voiceAgent: 'किसानसेतू आवाज सहाय्यक',
    voiceTitle: 'आवाजातील बाजारभाव सहाय्यक',
    voiceDescription: 'निवडलेल्या भाषेत मंडी भाव आणि सल्ला विचारा.',
    listening: 'ऐकत आहोत…',
    speaking: 'उत्तर बोलले जात आहे…',
    tapToSpeak: 'बोलण्यासाठी मायक्रोफोन दाबा',
    transcript: 'ऐकलेला मजकूर',
    modalRate: 'मोडल दर',
    fullChart: 'पूर्ण चार्ट आणि सल्ला पहा',
    quickQueries: 'जलद आवाज प्रश्न',
    voiceUnsupported: 'या ब्राउझरमध्ये आवाज ओळख उपलब्ध नाही. खालील प्रश्न वापरा.',
    micDenied: 'मायक्रोफोनची परवानगी मिळाली नाही. खालील प्रश्न निवडून चाचणी करा.',
    micFailed: 'मायक्रोफोन सुरू होऊ शकला नाही. खालील प्रश्न निवडा.',
    voiceFailed: 'आवाज प्रश्न पूर्ण झाला नाही. कृपया पुन्हा प्रयत्न करा.',
  },
} as const;

const locales: Record<AppLanguage, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

interface LanguageContextValue {
  language: AppLanguage;
  locale: string;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
  l: (english: string, hindi: string, marathi: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem('kisansetu-language');
    if (savedLanguage === 'en' || savedLanguage === 'hi' || savedLanguage === 'mr') {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem('kisansetu-language', nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = locales[language];
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      locale: locales[language],
      setLanguage,
      t: (key: TranslationKey) => translations[language][key],
      l: (english: string, hindi: string, marathi: string) =>
        language === 'hi' ? hindi : language === 'mr' ? marathi : english,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
