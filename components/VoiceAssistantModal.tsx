'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  X,
  Sparkles,
  Radio,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCropAndMandi?: (cropId: string, mandiId: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectCropAndMandi,
}) => {
  const { language, locale, t, l } = useLanguage();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      handleStopVoice();
    }
  }, [isOpen]);

  const handleStartListening = () => {
    setErrorMessage('');
    setQueryResult(null);
    setTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(t('voiceUnsupported'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = locale;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);

        if (event.results[current].isFinal) {
          processVoiceQuery(text);
          recognition.stop();
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(t('micDenied'));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e: any) {
      console.error(e);
      setIsListening(false);
      setErrorMessage(t('micFailed'));
    }
  };

  const handleStopVoice = () => {
    setIsListening(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const processVoiceQuery = async (spokenText: string) => {
    setTranscript(spokenText);
    try {
      const res = await fetch('/api/voice-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: spokenText, language }),
      });

      const data = await res.json();
      setQueryResult(data);
      speakAudio(getSpokenResponse(data));
    } catch (err) {
      console.error('Failed to process voice query', err);
      setErrorMessage(t('voiceFailed'));
    }
  };

  const speakAudio = async (textToSpeak: string) => {
    if (!textToSpeak) return;

    // Prefer Sarvam when configured on the Python API. If unavailable, use the
    // browser's built-in voice with the same language code.
    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, language }),
      });
      const data = await response.json();
      if (data.available && data.audioBase64) {
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
        audioRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
        audio.onerror = () => { setIsSpeaking(false); audioRef.current = null; };
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('Sarvam speech unavailable; using browser speech.', err);
    }

    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = locale;
    const languagePrefix = locale.slice(0, 2).toLowerCase();
    const availableVoices = window.speechSynthesis.getVoices();
    const matchingVoice = availableVoices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
      || availableVoices.find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix));
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const getSpokenResponse = (data: any): string => {
    if (language === 'hi') return data.spokenResponseHi || data.spokenResponse || '';
    if (language === 'mr') {
      if (data.spokenResponseMr) return data.spokenResponseMr;
      if (data.cropName && data.mandiName && data.modalPrice) {
        return `${data.cropName}, ${data.mandiName} मंडीतील मोडल दर ₹${data.modalPrice} प्रति क्विंटल आहे.`;
      }
    }
    return data.spokenResponse || data.spokenResponseHi || '';
  };

  const quickQueries = [
    {
      query: l('Tomato price in Nashik', 'नाशिक में टमाटर का भाव', 'नाशिकमध्ये टोमॅटोचा भाव'),
      label: l('🍅 Tomato in Nashik', '🍅 नाशिक में टमाटर', '🍅 नाशिकमधील टोमॅटो'),
    },
    {
      query: l('Onion price in Nashik', 'आज नाशिक में प्याज़ का भाव', 'आज नाशिकमध्ये कांद्याचा भाव'),
      label: l('🧅 Onion in Nashik', '🧅 नाशिक में प्याज़', '🧅 नाशिकमधील कांदा'),
    },
    {
      query: l('Wheat price in Indore', 'इंदौर में गेहूं का भाव', 'इंदूरमध्ये गव्हाचा भाव'),
      label: l('🌾 Wheat in Indore', '🌾 इंदौर में गेहूं', '🌾 इंदूरमधील गहू'),
    },
    {
      query: l('Potato rate in Pune', 'पुणे में आलू का भाव', 'पुण्यात बटाट्याचा भाव'),
      label: l('🥔 Potato in Pune', '🥔 पुणे में आलू', '🥔 पुण्यातील बटाटा'),
    },
    {
      query: l('Show my pool', 'मेरा पूल दिखाओ', 'माझा पूल दाखवा'),
      label: l('🌐 Show my pool', '🌐 मेरा पूल दिखाओ', '🌐 माझा पूल दाखवा'),
    },
    {
      query: l('Who is my best buyer?', 'मेरा सबसे अच्छा खरीदार कौन है?', 'माझा सर्वोत्तम खरेदीदार कोण आहे?'),
      label: l('🤝 Who is my best buyer?', '🤝 सबसे अच्छा खरीदार कौन है?', '🤝 सर्वोत्तम खरेदीदार कोण?'),
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-border shadow-floating relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-secondary hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="text-center space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[11px] font-bold border border-emerald-200">
            <Sparkles className="w-3 h-3" />
            <span>{t('voiceAgent')}</span>
          </span>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            {t('voiceTitle')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('voiceDescription')}
          </p>
        </div>

        {/* Microphone Pulse Sphere */}
        <div className="flex flex-col items-center justify-center py-3">
          <button
            onClick={isListening ? handleStopVoice : handleStartListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-elevated active:scale-90 relative ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/40'
                : isSpeaking
                ? 'bg-emerald-600 text-white animate-pulse shadow-emerald-500/40'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {isListening ? (
              <Radio className="w-10 h-10 animate-spin" />
            ) : isSpeaking ? (
              <Volume2 className="w-10 h-10 animate-pulse" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>

          <p className="mt-3 text-xs font-bold text-foreground">
            {isListening
              ? `🎙️ ${t('listening')}`
              : isSpeaking
              ? `🔊 ${t('speaking')}`
              : t('tapToSpeak')}
          </p>
        </div>

        {/* Live Transcript Display */}
        {transcript && (
          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">
              {t('transcript')}
            </span>
            <p className="text-sm font-bold text-foreground">
              "{transcript}"
            </p>
          </div>
        )}

        {/* Query Result Card */}
        {queryResult && (
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-subtle space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{queryResult.cropIcon}</span>
                <h4 className="font-bold text-sm text-emerald-950">
                  {queryResult.cropName} in {queryResult.mandiName}
                </h4>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-700 text-white rounded-md">
                {queryResult.advisoryLabel}
              </span>
            </div>

            <div className="flex items-baseline justify-between border-t border-emerald-200/80 pt-2">
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">{t('modalRate')}</span>
                <span className="text-2xl font-black text-emerald-950">
                  ₹{queryResult.modalPrice?.toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-muted-foreground"> / qtl</span>
                </span>
              </div>

              <span
                className={`text-xs font-bold ${
                  queryResult.trendPct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {queryResult.trendPct >= 0 ? `+${queryResult.trendPct}%` : `${queryResult.trendPct}%`} 7d
              </span>
            </div>

            <p className="text-xs font-medium text-emerald-900 bg-card p-2 rounded-lg border border-emerald-200">
              💡 {queryResult.reason}
            </p>

            {onSelectCropAndMandi && (
              <button
                onClick={() => {
                  onSelectCropAndMandi(queryResult.cropId, queryResult.mandiId);
                  onClose();
                }}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <span>{t('fullChart')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 text-center">
            {errorMessage}
          </div>
        )}

        {/* Quick Demo Question Chips */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase text-muted-foreground block text-center">
            {t('quickQueries')}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {quickQueries.map((chip) => (
              <button
                key={chip.query}
                onClick={() => processVoiceQuery(chip.query)}
                className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-left text-xs font-bold text-foreground flex items-center justify-between transition-colors"
              >
                <span>{chip.label}</span>
                <Volume2 className="w-3 h-3 text-emerald-700" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
