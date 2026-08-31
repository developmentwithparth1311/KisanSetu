'use client';

import React from 'react';
import {
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  Handshake,
  MapPinned,
  PackagePlus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from './LanguageProvider';

type JourneyTab = 'price' | 'lots' | 'pooling' | 'negotiation';

export function FarmerJourney({ onNavigate }: { onNavigate: (tab: JourneyTab) => void }) {
  const { l } = useLanguage();

  const steps = [
    {
      number: '01',
      icon: BadgeIndianRupee,
      title: l('Check today’s price', 'आज का भाव देखें', 'आजचा बाजारभाव पहा'),
      description: l(
        'Compare nearby mandi prices and get a simple selling advisory.',
        'आस-पास की मंडियों के भाव और बेचने की सरल सलाह देखें।',
        'जवळच्या बाजारातील भाव आणि विक्रीचा सोपा सल्ला पहा.'
      ),
      action: l('View prices', 'भाव देखें', 'भाव पहा'),
      tab: 'price' as const,
    },
    {
      number: '02',
      icon: PackagePlus,
      title: l('Create your produce lot', 'अपना फसल लॉट बनाएं', 'आपला शेतमाल लॉट तयार करा'),
      description: l(
        'Add crop, quantity, quality photo, target price, and your protected minimum price.',
        'फसल, मात्रा, फोटो, लक्ष्य भाव और सुरक्षित न्यूनतम भाव भरें।',
        'पीक, प्रमाण, फोटो, अपेक्षित भाव आणि सुरक्षित किमान भाव भरा.'
      ),
      action: l('Create lot', 'लॉट बनाएं', 'लॉट तयार करा'),
      tab: 'lots' as const,
    },
    {
      number: '03',
      icon: MapPinned,
      title: l('Join nearby farmers', 'पास के किसानों से जुड़ें', 'जवळच्या शेतकऱ्यांशी जोडा'),
      description: l(
        'Combine compatible produce into a larger Geo-Pool and match verified buyers.',
        'मिलती-जुलती उपज का बड़ा जियो-पूल बनाकर सत्यापित खरीदार खोजें।',
        'जुळणारा शेतमाल जिओ-पूलमध्ये एकत्र करून पडताळलेले खरेदीदार शोधा.'
      ),
      action: l('See pooling', 'पूल देखें', 'पूल पहा'),
      tab: 'pooling' as const,
    },
    {
      number: '04',
      icon: Handshake,
      title: l('Negotiate and approve', 'मोलभाव करें और मंज़ूरी दें', 'वाटाघाटी करा आणि मंजुरी द्या'),
      description: l(
        'The system protects your floor price. Only you can approve the final sale.',
        'सिस्टम न्यूनतम भाव सुरक्षित रखता है। अंतिम बिक्री केवल आप मंज़ूर करते हैं।',
        'प्रणाली किमान भाव सुरक्षित ठेवते. अंतिम विक्रीला फक्त तुम्ही मंजुरी देता.'
      ),
      action: l('Open deals', 'सौदे खोलें', 'व्यवहार पहा'),
      tab: 'negotiation' as const,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 text-white shadow-card">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-50">
              <Sparkles className="h-3.5 w-3.5" />
              {l('Simple selling support for every farmer', 'हर किसान के लिए आसान बिक्री सहायता', 'प्रत्येक शेतकऱ्यासाठी सोपी विक्री मदत')}
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {l(
                'Get a fair price for your harvest—step by step.',
                'अपनी फसल का सही भाव पाएं—एक-एक आसान कदम में।',
                'तुमच्या शेतमालाला योग्य भाव मिळवा—सोप्या टप्प्यांमध्ये.'
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-sm font-medium leading-6 text-emerald-50/85 sm:text-base">
              {l(
                'KisanSetu helps you understand mandi prices, list produce, join nearby supply, find buyers, and approve a safe final deal.',
                'किसानसेतु मंडी भाव समझने, फसल लिस्ट करने, पास की उपज जोड़ने, खरीदार खोजने और सुरक्षित सौदा मंज़ूर करने में मदद करता है।',
                'किसानसेतू बाजारभाव समजून घेणे, माल नोंदवणे, जवळचा पुरवठा जोडणे, खरेदीदार शोधणे आणि सुरक्षित व्यवहार मंजूर करणे सोपे करते.'
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => onNavigate('price')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-emerald-900 shadow-card transition hover:bg-emerald-50 active:scale-[0.98]"
              >
                {l('Start with today’s price', 'आज के भाव से शुरू करें', 'आजच्या भावापासून सुरू करा')}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigate('lots')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/15 active:scale-[0.98]"
              >
                {l('I already know my price', 'मुझे अपना भाव पता है', 'मला माझा भाव माहीत आहे')}
              </button>
            </div>
          </div>

          <div className="relative isolate overflow-hidden border-t border-white/10 bg-black/10 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <img
              src="/images/indian-farm-harvest.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover object-right opacity-95"
            />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-emerald-950/5 to-emerald-950/20" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
              {l('Your journey', 'आपकी यात्रा', 'तुमचा प्रवास')}
            </p>
            <div className="mt-5 space-y-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.number}
                    onClick={() => onNavigate(step.tab)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-white/15 bg-emerald-950/45 p-4 text-left shadow-sm backdrop-blur-[2px] transition hover:bg-emerald-950/60"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-100">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-200">{step.number}</span>
                      <span className="block text-sm font-bold text-white">{step.title}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-emerald-200 transition group-hover:translate-x-1" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {l('How it works', 'यह कैसे काम करता है', 'हे कसे काम करते')}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {l('One clear path from crop to buyer', 'फसल से खरीदार तक एक साफ़ रास्ता', 'शेतमालापासून खरेदीदारापर्यंत स्पष्ट मार्ग')}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.number} className="group flex min-h-64 flex-col rounded-3xl border border-border bg-card p-6 shadow-subtle transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-black text-emerald-100">{step.number}</span>
                </div>
                <h3 className="mt-5 text-lg font-black text-foreground">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm font-medium leading-6 text-muted-foreground">{step.description}</p>
                <button onClick={() => onNavigate(step.tab)} className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-emerald-700 hover:text-emerald-900">
                  {step.action} <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 sm:grid-cols-3 sm:p-6">
        {[
          l('Your minimum price is protected', 'आपका न्यूनतम भाव सुरक्षित है', 'तुमचा किमान भाव सुरक्षित आहे'),
          l('Only you approve the final sale', 'अंतिम बिक्री केवल आप मंज़ूर करते हैं', 'अंतिम विक्रीला फक्त तुम्ही मंजुरी देता'),
          l('Core features work without paid AI', 'मुख्य सुविधाएं पेड AI के बिना भी चलती हैं', 'मुख्य सुविधा सशुल्क AI शिवायही चालतात'),
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 text-sm font-bold text-emerald-950">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            {item}
          </div>
        ))}
      </section>
    </div>
  );
}
