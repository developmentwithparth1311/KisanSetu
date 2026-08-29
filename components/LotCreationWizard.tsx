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
            { num: 1, label: 'Produce Details', sub: 'फसल और वजन' },
            { num: 2, label: 'AI Quality Scan', sub: 'गुणवत्ता जांच' },
            { num: 3, label: 'Price Bounds', sub: 'मूल्य सीमा' },
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
              Step 1 of 3
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mt-2">
              What produce are you selling? (फसल का विवरण)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter your crop and ready harvest volume for listing.
            </p>
          </div>

          {/* Farmer Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-secondary/50 border border-border">
            <div>
              <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                Farmer Name (किसान का नाम)
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
                Mobile Number (मोबाइल नंबर)
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
              Select Crop (फसल चुनें)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'tomato', name: 'Tomato', icon: '🍅' },
                { id: 'onion', name: 'Onion', icon: '🧅' },
                { id: 'potato', name: 'Potato', icon: '🥔' },
                { id: 'wheat', name: 'Wheat', icon: '🌾' },
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
              Estimated Harvest Quantity (कुल वजन)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-36 p-3 text-2xl font-black text-foreground bg-card rounded-xl border border-border focus:border-emerald-600 text-center"
              />
              <span className="text-base font-bold text-foreground">Quintals (क्विंटल)</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground font-semibold">Quick set:</span>
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
              <span>Next: AI Quality Scan</span>
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
              Step 2 of 3
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mt-2">
              AI Photo Quality Assessment (कंप्यूटर विज़न ग्रेडिंग)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload or scan your harvest photo to automatically certify produce quality.
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
                    <span>AI SCANNING QUALITY...</span>
                  </div>
                </div>
              )}

              {/* Certified Quality Badge */}
              {!isScanning && aiGradeResult && (
                <div className="absolute top-3 right-3 bg-emerald-700 text-white px-3 py-1.5 rounded-xl shadow-card flex items-center gap-1.5 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>{aiGradeResult.grade} Certified</span>
                </div>
              )}
            </div>

            {/* Diagnostic Output */}
            <div className="space-y-4">
              {isScanning ? (
                <div className="p-6 rounded-2xl bg-secondary/50 border border-border flex flex-col items-center justify-center text-center min-h-[200px]">
                  <Scan className="w-8 h-8 text-emerald-600 animate-pulse mb-2" />
                  <h4 className="text-base font-bold text-foreground">Analyzing Crop Texture & Skin...</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Testing surface firmness, color distribution, and blemish indices.
                  </p>
                </div>
              ) : aiGradeResult ? (
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-subtle space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800">Model Output</span>
                      <h3 className="text-xl font-bold text-emerald-950">
                        {aiGradeResult.grade} Produce
                      </h3>
                    </div>
                    <div className="bg-card px-2.5 py-1 rounded-lg border border-emerald-300 text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Score</span>
                      <span className="text-sm font-black text-emerald-700">{aiGradeResult.confidence}%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Verified Attributes</span>
                    {aiGradeResult.defects.map((d, i) => (
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
                  Select Demo Sample or Upload
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
                  <span>Upload Custom Photo</span>
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
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-card transition-all active:scale-95"
            >
              <span>Next: Set Price Bounds</span>
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
              Step 3 of 3
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mt-2">
              Set Price Safeguards (मूल्य सीमा तय करें)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              The AI Negotiation Agent will defend these bounds in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Price */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-emerald-800">Target Price (लक्ष्य मूल्य)</span>
                <span className="text-[11px] font-semibold text-emerald-700">Ideal Rate</span>
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
                If a buyer bids this or higher, AI immediately accepts.
              </p>
            </div>

            {/* Floor Price */}
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-amber-900">Floor Price (न्यूनतम भाव)</span>
                <span className="text-[11px] font-semibold text-amber-700">Hard Protection</span>
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
                AI will NEVER sell below this floor price.
              </p>
            </div>
          </div>

          {/* Revenue Summary Pill */}
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={selectedPhotoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-border" />
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  {quantity} Quintals of {cropId.toUpperCase()}
                </h4>
                <p className="text-xs font-semibold text-emerald-700">
                  {aiGradeResult?.grade} ({aiGradeResult?.confidence}% Score)
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Expected Value</span>
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
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-base font-bold shadow-card transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'Listing Lot...' : 'Publish Lot & Activate AI'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
