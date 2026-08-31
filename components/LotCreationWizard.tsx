'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Scan,
  ShieldCheck,
  Tag,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface LotCreationWizardProps {
  initialCropId?: string;
  initialMandiId?: string;
  onLotCreated: (newLotId: string) => void;
}

const SAMPLE_PHOTOS = [
  {
    id: 'sample-tomato-a',
    cropId: 'tomato',
    title: 'Grade A Premium Red',
    url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    grade: 'Grade A',
    confidence: 94.6,
    defects: ['Uniform Deep Crimson Hue', 'Firm Flesh (>92%)', 'Zero Blemishes'],
  },
  {
    id: 'sample-onion-a',
    cropId: 'onion',
    title: 'Grade A Export Onion',
    url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    grade: 'Grade A',
    confidence: 92.1,
    defects: ['Tight Outer Shell', '55mm+ Consistent Caliber', 'Dry Neck (No sprouts)'],
  },
  {
    id: 'sample-potato-a',
    cropId: 'potato',
    title: 'Grade A Table Potato',
    url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    grade: 'Grade A',
    confidence: 90.8,
    defects: ['Smooth Light Skin', 'No Greening / Eyes', 'Even Weight'],
  },
  {
    id: 'sample-wheat-a',
    cropId: 'wheat',
    title: 'Grade A Sharbati Wheat',
    url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
    grade: 'Grade A',
    confidence: 95.3,
    defects: ['Golden Luster Grain', 'Moisture <11.5%', 'Clean Non-Admixed'],
  },
];

export const LotCreationWizard: React.FC<LotCreationWizardProps> = ({
  initialCropId = 'tomato',
  initialMandiId = 'nashik',
  onLotCreated,
}) => {
  const { language, l } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [farmerName, setFarmerName] = useState('Parth Kumbhar');
  const [farmerPhone, setFarmerPhone] = useState('+91 98230 11223');
  const [cropId, setCropId] = useState(initialCropId);
  const [mandiId, setMandiId] = useState(initialMandiId);
  const [quantity, setQuantity] = useState<number>(50);
  const [unit, setUnit] = useState('quintal');

  // AI Quality Scan State
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [aiGradeResult, setAiGradeResult] = useState<{
    grade: string;
    confidence: number;
    defects: string[];
  } | null>({
    grade: 'Grade A',
    confidence: 94.6,
    defects: ['Uniform Deep Crimson Hue', 'Firm Flesh (>92%)', 'Zero Blemishes'],
  });

  // Price Boundaries
  const [floorPrice, setFloorPrice] = useState<number>(1900);
  const [targetPrice, setTargetPrice] = useState<number>(2250);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSelectPhoto = (sample: (typeof SAMPLE_PHOTOS)[0]) => {
    setSelectedPhotoUrl(sample.url);
    runAiGradingScan(sample);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const localUrl = URL.createObjectURL(file);
      setSelectedPhotoUrl(localUrl);

      runAiGradingScan({
        grade: 'Grade A',
        confidence: 92.4,
        defects: ['High Surface Uniformity', 'Good Texture Density', 'No Visible Rot'],
      });
    }
  };

  const runAiGradingScan = (preset?: { grade: string; confidence: number; defects: string[] }) => {
    setIsScanning(true);
    setAiGradeResult(null);

    setTimeout(() => {
      setIsScanning(false);
      setAiGradeResult(
        preset || {
          grade: 'Grade A',
          confidence: Math.round((88 + Math.random() * 8) * 10) / 10,
          defects: ['High Visual Symmetry', 'Clean Outer Skin', 'Optimum Harvest Maturity'],
        }
      );
    }, 1600);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerName,
          farmerPhone,
          cropId,
          mandiId,
          quantity,
          unit,
          photoUrl: selectedPhotoUrl,
          aiGrade: aiGradeResult?.grade || 'Grade A',
          aiConfidence: aiGradeResult?.confidence || 92,
          aiDefects: aiGradeResult?.defects || [],
          floorPrice,
          targetPrice,
        }),
      });

      const json = await res.json();
      if (json.success && json.lotId) {
        onLotCreated(json.lotId);
      }
    } catch (err) {
      console.error('Error listing lot:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* 1. Progress Step Bar (Spacious & Clear for Farmers) */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: l('Produce details', 'फसल विवरण', 'शेतमाल माहिती'), sub: l('Crop and weight', 'फसल और वजन', 'पीक आणि वजन') },
            { num: 2, label: l('Quality check', 'गुणवत्ता जांच', 'गुणवत्ता तपासणी'), sub: l('Photo assessment', 'फोटो जांच', 'फोटो तपासणी') },
            { num: 3, label: l('Your prices', 'आपके भाव', 'तुमचे भाव'), sub: l('Target and minimum', 'लक्ष्य और न्यूनतम', 'अपेक्षित आणि किमान') },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    step === s.num
                      ? 'bg-emerald-700 text-white shadow-subtle'
                      : step > s.num
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <div className="hidden sm:block">
                  <p
                    className={`text-xs font-bold ${
                      step === s.num ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{s.sub}</p>
                </div>
              </div>

              {idx < 2 && (
                <div
                  className={`flex-1 h-0.5 mx-3 sm:mx-6 rounded-full ${
                    step > s.num ? 'bg-emerald-600' : 'bg-border'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP 1: PRODUCE & QUANTITY */}
      {step === 1 && (
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-card space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {l('Step 1 of 3', '3 में से चरण 1', '3 पैकी टप्पा 1')}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mt-2">
              {l('What produce are you selling?', 'आप कौन-सी फसल बेच रहे हैं?', 'तुम्ही कोणता शेतमाल विकत आहात?')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {l('Tell us the crop and quantity ready to sell.', 'बेचने के लिए तैयार फसल और मात्रा भरें।', 'विक्रीसाठी तयार पीक आणि प्रमाण भरा.')}
            </p>
          </div>

          {/* Farmer Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-secondary/50 border border-border">
            <div>
              <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                {l('Farmer name', 'किसान का नाम', 'शेतकऱ्याचे नाव')}
              </label>
              <input
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full p-2.5 text-sm font-semibold text-foreground bg-card rounded-xl border border-border focus:border-emerald-600 focus:ring-0"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                {l('Mobile number', 'मोबाइल नंबर', 'मोबाइल क्रमांक')}
              </label>
              <input
                type="text"
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                className="w-full p-2.5 text-sm font-semibold text-foreground bg-card rounded-xl border border-border focus:border-emerald-600 focus:ring-0"
              />
            </div>
          </div>

          {/* Crop Selector Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground block">
              {l('Select crop', 'फसल चुनें', 'पीक निवडा')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'tomato', name: l('Tomato', 'टमाटर', 'टोमॅटो'), icon: '🍅' },
                { id: 'onion', name: l('Onion', 'प्याज़', 'कांदा'), icon: '🧅' },
                { id: 'potato', name: l('Potato', 'आलू', 'बटाटा'), icon: '🥔' },
                { id: 'wheat', name: l('Wheat', 'गेहूं', 'गहू'), icon: '🌾' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCropId(c.id)}
                  className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    cropId === c.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-subtle'
                      : 'border-border bg-card hover:bg-secondary/50 text-foreground'
                  }`}
                >
                  <span className="text-3xl mb-1">{c.icon}</span>
                  <span className="font-bold text-xs">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector with Quick Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground block">
              {l('Quantity ready to sell', 'बेचने के लिए तैयार मात्रा', 'विक्रीसाठी तयार प्रमाण')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-36 p-3 text-2xl font-black text-foreground bg-card rounded-xl border border-border focus:border-emerald-600 text-center"
              />
              <span className="text-base font-bold text-foreground">{l('Quintals', 'क्विंटल', 'क्विंटल')}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground font-semibold">{l('Quick choice:', 'जल्दी चुनें:', 'झटपट निवड:')}</span>
              {[20, 50, 100, 200].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setQuantity(amt)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                    quantity === amt
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-card text-foreground border-border hover:bg-secondary'
                  }`}
                >
                  {amt} Qtl
                </button>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-card transition-all active:scale-95"
            >
              <span>{l('Next: check quality', 'अगला: गुणवत्ता जांच', 'पुढे: गुणवत्ता तपासणी')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AI QUALITY SCANNER */}
      {step === 2 && (
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-card space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {l('Step 2 of 3', '3 में से चरण 2', '3 पैकी टप्पा 2')}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mt-2">
              {l('Photo quality assessment', 'फोटो से गुणवत्ता जांच', 'फोटोद्वारे गुणवत्ता तपासणी')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {l('Choose a produce photo to receive an AI-assessed demo grade.', 'AI द्वारा आंका गया डेमो ग्रेड पाने के लिए फसल की फोटो चुनें।', 'AI-आधारित डेमो ग्रेडसाठी शेतमालाचा फोटो निवडा.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Image Box with Laser Scan effect */}
            <div className="relative rounded-2xl overflow-hidden border border-border bg-black/5 aspect-video md:aspect-square flex items-center justify-center shadow-subtle">
              <img
                src={selectedPhotoUrl}
                alt="Selected crop sample"
                className="w-full h-full object-cover"
              />

              {/* Animated Laser Scanning Line */}
              {isScanning && (
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-4">
                  <div className="w-full h-1 bg-emerald-400 laser-line animate-laser-scan" />
                  <div className="self-center bg-card/95 px-3 py-1.5 rounded-full text-foreground text-[11px] font-bold flex items-center gap-2 shadow-card">
                    <Scan className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    <span>{l('CHECKING QUALITY…', 'गुणवत्ता जांच रहे हैं…', 'गुणवत्ता तपासत आहोत…')}</span>
                  </div>
                </div>
              )}

              {/* AI-assessed quality badge */}
              {!isScanning && aiGradeResult && (
                <div className="absolute top-3 right-3 bg-emerald-700 text-white px-3 py-1.5 rounded-xl shadow-card flex items-center gap-1.5 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>{l('AI-assessed', 'AI द्वारा आंका गया', 'AI-आधारित')} {aiGradeResult.grade}</span>
                </div>
              )}
            </div>

            {/* Diagnostic Output */}
            <div className="space-y-4">
              {isScanning ? (
                <div className="p-6 rounded-2xl bg-secondary/50 border border-border flex flex-col items-center justify-center text-center min-h-[200px]">
                  <Scan className="w-8 h-8 text-emerald-600 animate-pulse mb-2" />
                  <h4 className="text-base font-bold text-foreground">{l('Checking color, texture, and visible quality…', 'रंग, बनावट और दिखाई देने वाली गुणवत्ता जांच रहे हैं…', 'रंग, पोत आणि दिसणारी गुणवत्ता तपासत आहोत…')}</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {l('This is an AI-assessed prototype result, not an official certificate.', 'यह AI द्वारा आंका गया प्रोटोटाइप परिणाम है, आधिकारिक प्रमाणपत्र नहीं।', 'हा AI-आधारित नमुना निकाल आहे, अधिकृत प्रमाणपत्र नाही.')}
                  </p>
                </div>
              ) : aiGradeResult ? (
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-subtle space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800">{l('Assessment result', 'जांच परिणाम', 'तपासणी निकाल')}</span>
                      <h3 className="text-xl font-bold text-emerald-950">
                        {aiGradeResult.grade} {l('produce', 'उपज', 'शेतमाल')}
                      </h3>
                    </div>
                    <div className="bg-card px-2.5 py-1 rounded-lg border border-emerald-300 text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">{l('Score', 'स्कोर', 'गुण')}</span>
                      <span className="text-sm font-black text-emerald-700">{aiGradeResult.confidence}%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">{l('Observed attributes', 'देखे गए गुण', 'दिसलेले गुणधर्म')}</span>
                    {(language === 'en' ? aiGradeResult.defects : language === 'hi' ? ['समान रंग', 'अच्छी बाहरी बनावट', 'कोई स्पष्ट सड़न नहीं'] : ['समान रंग', 'चांगला बाह्य पोत', 'दिसणारी कुज नाही']).map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Sample Photo selector */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                  {l('Choose a demo photo or upload yours', 'डेमो फोटो चुनें या अपनी फोटो डालें', 'डेमो फोटो निवडा किंवा तुमचा फोटो अपलोड करा')}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_PHOTOS.filter((s) => s.cropId === cropId || s.cropId === 'tomato').slice(0, 2).map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectPhoto(sample)}
                      className={`p-2 rounded-xl text-xs font-semibold border text-left flex items-center gap-2 truncate ${
                        selectedPhotoUrl === sample.url
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                          : 'border-border bg-card text-foreground'
                      }`}
                    >
                      <img src={sample.url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      <span className="truncate">{sample.title}</span>
                    </button>
                  ))}
                </div>

                <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-border bg-secondary/50 hover:bg-secondary cursor-pointer text-xs font-bold text-foreground transition-colors">
                  <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{l('Upload your photo', 'अपनी फोटो डालें', 'तुमचा फोटो अपलोड करा')}</span>
                  <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-border">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-muted text-foreground text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{l('Back', 'पीछे', 'मागे')}</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-card transition-all active:scale-95"
            >
              <span>{l('Next: set your prices', 'अगला: अपने भाव तय करें', 'पुढे: तुमचे भाव ठरवा')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PRICE BOUNDARIES */}
      {step === 3 && (
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-card space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {l('Step 3 of 3', '3 में से चरण 3', '3 पैकी टप्पा 3')}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mt-2">
              {l('Set your target and minimum price', 'लक्ष्य और न्यूनतम भाव तय करें', 'अपेक्षित आणि किमान भाव ठरवा')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {l('The system can recommend offers, but only you approve the final sale.', 'सिस्टम प्रस्ताव सुझा सकता है, लेकिन अंतिम बिक्री केवल आप मंज़ूर करेंगे।', 'प्रणाली ऑफर सुचवू शकते, पण अंतिम विक्री फक्त तुम्ही मंजूर कराल.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Price */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-emerald-800">{l('Target price', 'लक्ष्य भाव', 'अपेक्षित भाव')}</span>
                <span className="text-[11px] font-semibold text-emerald-700">{l('Preferred', 'आपकी पसंद', 'तुमची पसंती')}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xl font-bold text-muted-foreground">₹</span>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-12 py-2 text-2xl font-black text-emerald-950 bg-card rounded-xl border border-emerald-300 focus:ring-0"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-muted-foreground">/qtl</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {l('An offer at this price will be recommended for your approval.', 'इस भाव का प्रस्ताव आपकी मंज़ूरी के लिए सुझाया जाएगा।', 'या भावाची ऑफर तुमच्या मंजुरीसाठी सुचवली जाईल.')}
              </p>
            </div>

            {/* Floor Price */}
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-amber-900">{l('Minimum price', 'न्यूनतम भाव', 'किमान भाव')}</span>
                <span className="text-[11px] font-semibold text-amber-700">{l('Protected', 'सुरक्षित', 'सुरक्षित')}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xl font-bold text-muted-foreground">₹</span>
                <input
                  type="number"
                  value={floorPrice}
                  onChange={(e) => setFloorPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-12 py-2 text-2xl font-black text-amber-950 bg-card rounded-xl border border-amber-300 focus:ring-0"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-muted-foreground">/qtl</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {l('The system will never accept below this price.', 'सिस्टम इस भाव से कम कभी स्वीकार नहीं करेगा।', 'प्रणाली या भावापेक्षा कमी ऑफर स्वीकारणार नाही.')}
              </p>
            </div>
          </div>

          {/* Revenue Summary Pill */}
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={selectedPhotoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-border" />
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  {quantity} {l('quintals of', 'क्विंटल', 'क्विंटल')} {cropId.toUpperCase()}
                </h4>
                <p className="text-xs font-semibold text-emerald-700">
                  {aiGradeResult?.grade} ({aiGradeResult?.confidence}% Score)
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">{l('Expected value', 'अनुमानित मूल्य', 'अपेक्षित मूल्य')}</span>
              <span className="text-xl font-black text-foreground">
                ₹{(targetPrice * quantity).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-4 flex items-center justify-between border-t border-border">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-muted text-foreground text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{l('Back', 'पीछे', 'मागे')}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-base font-bold shadow-card transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? l('Creating lot…', 'लॉट बन रहा है…', 'लॉट तयार होत आहे…') : l('Publish lot and continue', 'लॉट प्रकाशित करें और आगे बढ़ें', 'लॉट प्रकाशित करा आणि पुढे जा')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
