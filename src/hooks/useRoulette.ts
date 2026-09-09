import { useState, useEffect } from 'react';

interface Sentence {
  id: string;
  description: string;
  is_active: boolean;
}

// Audio Context Helper
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playTick = () => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {}
};

const playImpact = () => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
};

export function useRoulette(sentences: Sentence[]) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<Sentence | null>(null);
  const [result, setResult] = useState<Sentence | null>(null);

  const activeSentences = sentences.filter(s => s.is_active);

  const spin = async (suspectId: string): Promise<void> => {
    if (activeSentences.length === 0) return;
    
    setIsSpinning(true);
    setResult(null);
    initAudio();

    // Start visual roulette effect
    let currentIndex = 0;
    const intervalTime = 80;
    const interval = setInterval(() => {
      setCurrentDisplay(activeSentences[currentIndex]);
      currentIndex = (currentIndex + 1) % activeSentences.length;
      playTick();
    }, intervalTime);

    try {
      const res = await fetch('/api/judgement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: suspectId })
      });
      
      if (!res.ok) {
        if (res.status === 401) window.location.href = '/hq-admin/login';
        throw new Error('Failed to process judgement');
      }

      const drawData = await res.json();
      
      // Let it spin for effect
      setTimeout(() => {
        clearInterval(interval);
        setCurrentDisplay(drawData.sentence);
        setResult(drawData.sentence);
        setIsSpinning(false);
        playImpact();
      }, 3000); // 3 seconds of suspense

    } catch (err) {
      clearInterval(interval);
      setIsSpinning(false);
      console.error(err);
    }
  };

  return { isSpinning, currentDisplay, result, spin, setResult };
}
