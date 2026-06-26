"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// Hook para Text-to-Speech via Web Speech API (gratuito, nativo do browser).
//
// Para um ditado, a voz lê SEMPRE a um ritmo natural (sem arrastar/distorcer a
// pronúncia). O que o aluno controla é a PAUSA ENTRE PALAVRAS: cada palavra é
// dita normalmente e o intervalo até à seguinte aumenta/diminui com o slider,
// dando tempo para escrever. Mudar o ritmo aplica-se de imediato à palavra
// seguinte, sem consumir uma reprodução.
// ============================================================================

const BASE_RATE = 1; // ritmo natural da voz (não mexer com o slider)

export interface UseTTSOptions {
  maxPlays?: number;
  voiceURI?: string;
}

export interface UseTTS {
  supported: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  playCount: number;
  pace: number; // 1 (sem pausa) … 5 (pausa grande)
  setPace: (p: number) => void;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  setVoiceURI: (uri: string) => void;
  canPlay: boolean;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  resetCount: () => void;
}

function pickPortugueseVoice(
  voices: SpeechSynthesisVoice[],
  preferredURI?: string
): SpeechSynthesisVoice | null {
  if (preferredURI) {
    const match = voices.find((v) => v.voiceURI === preferredURI);
    if (match) return match;
  }
  const ptPT = voices.find((v) => v.lang?.toLowerCase().startsWith("pt-pt"));
  if (ptPT) return ptPT;
  const ptBR = voices.find((v) => v.lang?.toLowerCase().startsWith("pt-br"));
  if (ptBR) return ptBR;
  return voices.find((v) => v.lang?.toLowerCase().startsWith("pt")) ?? null;
}

// Pausa base (ms) entre palavras, em função do nível de ritmo (1..5).
function paceToGap(pace: number): number {
  return Math.round((pace - 1) * 250); // 0, 250, 500, 750, 1000
}

// Pausa extra após pontuação, para o texto "respirar".
function punctuationExtra(word: string): number {
  if (/[.!?…]$/.test(word)) return 400;
  if (/[,;:]$/.test(word)) return 200;
  return 0;
}

export function useTTS(options: UseTTSOptions = {}): UseTTS {
  const { maxPlays = 3, voiceURI } = options;

  const [supported, setSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [pace, setPaceState] = useState(3);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedURI, setSelectedURI] = useState<string | undefined>(voiceURI);

  const paceRef = useRef(3);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const selectedURIRef = useRef<string | undefined>(voiceURI);

  const wordsRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const inGapRef = useRef(false); // true = entre palavras; false = a dizer palavra
  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakNextRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) {
        setVoices(list);
        voicesRef.current = list;
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    setSelectedURI(voiceURI);
    selectedURIRef.current = voiceURI;
  }, [voiceURI]);

  const currentVoice = pickPortugueseVoice(voices, selectedURI);
  const canPlay = supported && playCount < maxPlays;

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const finish = useCallback(() => {
    playingRef.current = false;
    pausedRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  // Diz a próxima palavra da fila e agenda a pausa seguinte.
  const speakNext = useCallback(() => {
    if (!playingRef.current) return;
    const words = wordsRef.current;
    if (indexRef.current >= words.length) {
      finish();
      return;
    }
    const word = words[indexRef.current];
    indexRef.current += 1;
    inGapRef.current = false;

    const voice = pickPortugueseVoice(voicesRef.current, selectedURIRef.current);
    const u = new SpeechSynthesisUtterance(word);
    u.lang = voice?.lang ?? "pt-PT";
    if (voice) u.voice = voice;
    u.rate = BASE_RATE;
    u.pitch = 1;
    u.onend = () => {
      if (!playingRef.current) return;
      inGapRef.current = true;
      if (pausedRef.current) return; // retoma em resume()
      const gap = paceToGap(paceRef.current) + punctuationExtra(word);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        speakNextRef.current();
      }, gap);
    };
    window.speechSynthesis.speak(u);
  }, [finish]);

  useEffect(() => {
    speakNextRef.current = speakNext;
  }, [speakNext]);

  const speakInternal = useCallback((text: string, countAsPlay: boolean) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    clearTimer();
    window.speechSynthesis.cancel();

    const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (words.length === 0) return;

    wordsRef.current = words;
    indexRef.current = 0;
    inGapRef.current = false;
    playingRef.current = true;
    pausedRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    if (countAsPlay) setPlayCount((c) => c + 1);

    speakNextRef.current();
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (playCount >= maxPlays) return;
      speakInternal(text, true);
    },
    [playCount, maxPlays, speakInternal]
  );

  const setPace = useCallback((p: number) => {
    paceRef.current = p;
    setPaceState(p);
    // Aplica-se à pausa seguinte — não é preciso reiniciar nem consome reprodução.
  }, []);

  const pause = useCallback(() => {
    if (!supported || !playingRef.current) return;
    pausedRef.current = true;
    setIsPaused(true);
    if (inGapRef.current) {
      clearTimer(); // estávamos entre palavras
    } else {
      window.speechSynthesis.pause(); // a meio de uma palavra
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported || !pausedRef.current) return;
    pausedRef.current = false;
    setIsPaused(false);
    if (inGapRef.current) {
      speakNextRef.current(); // continua para a próxima palavra
    } else {
      window.speechSynthesis.resume();
    }
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    clearTimer();
    window.speechSynthesis.cancel();
    finish();
  }, [supported, finish]);

  const resetCount = useCallback(() => setPlayCount(0), []);

  return {
    supported,
    isPlaying,
    isPaused,
    playCount,
    pace,
    setPace,
    voices,
    currentVoice,
    setVoiceURI: (uri: string) => {
      setSelectedURI(uri);
      selectedURIRef.current = uri;
    },
    canPlay,
    speak,
    pause,
    resume,
    stop,
    resetCount,
  };
}
