'use client'

import { useState, useEffect } from 'react'
import { Gavel, AlertCircle, X, ArrowLeft } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { getDashboardData, drawJudgementAction } from '@/app/actions/dashboard'
import Link from 'next/link'

// Audio Context Helper inline
let audioCtx: AudioContext | null = null

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

const playTick = () => {
  try {
    const ctx = initAudio()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03)
    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.03)
  } catch (e) {}
}

const playImpact = () => {
  try {
    const ctx = initAudio()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(150, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch (e) {}
}

export default function JudgementPage() {
  const [suspects, setSuspects] = useState<any[]>([])
  const [sentences, setSentences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSuspect, setSelectedSuspect] = useState<any | null>(null)
  
  // Roulette state
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentDisplay, setCurrentDisplay] = useState<any | null>(null)
  const [result, setResult] = useState<any | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getDashboardData()
      setSuspects(data.suspects || [])
      setSentences(data.sentences || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSuspect = (suspect: any) => {
    setSelectedSuspect(suspect)
    setResult(null)
  }

  const handleCloseModal = () => {
    if (isSpinning) return
    setSelectedSuspect(null)
    if (result) {
      fetchData()
    }
  }

  const spin = async (suspectId: string) => {
    if (sentences.length === 0) return
    setIsSpinning(true)
    setResult(null)
    initAudio()

    let currentIndex = 0
    const interval = setInterval(() => {
      setCurrentDisplay(sentences[currentIndex])
      currentIndex = (currentIndex + 1) % sentences.length
      playTick()
    }, 80)

    try {
      const res = await drawJudgementAction(suspectId)
      
      setTimeout(() => {
        clearInterval(interval)
        if (res.sentence) {
          setCurrentDisplay(res.sentence)
          setResult(res.sentence)
        } else {
          // fallback na UI
          setCurrentDisplay({ description: 'ERRO NO SORTEIO' })
        }
        setIsSpinning(false)
        playImpact()
      }, 3000)
    } catch (err) {
      clearInterval(interval)
      setIsSpinning(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8 text-xl font-bold uppercase tracking-widest animate-pulse">Analisando Evidências...</div>

  return (
    <div className="min-h-screen bg-zinc-950 font-sans pb-12">
      <div className="max-w-7xl mx-auto pt-8 px-4">
        
        <div className="mb-6 sm:mb-8 border-b-4 border-neutral-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">
              Painel de Julgamento
            </h2>
            <p className="text-red-500 font-bold uppercase tracking-widest text-xs sm:text-sm">Selecione o Suspeito para a Sentença</p>
          </div>
          <Link href="/hq-admin" className="text-neutral-400 hover:text-white flex items-center gap-2 uppercase text-sm font-bold tracking-widest bg-neutral-900 border border-neutral-800 px-4 py-2 hover:bg-neutral-800 transition-colors">
            <ArrowLeft size={16} /> Voltar ao Painel
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-8 justify-items-center">
          {suspects.map((suspect, index) => {
            const hasDrawn = suspect.draws && suspect.draws.length > 0
            const rotation = index % 2 === 0 ? 'rotate-[-2deg]' : 'rotate-[2deg]'
            
            return (
              <div 
                key={suspect.id}
                onClick={() => handleSelectSuspect(suspect)}
                className={twMerge(
                  "relative bg-[#fdfbf7] p-2 pb-8 sm:p-3 sm:pb-12 shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-neutral-300 cursor-pointer transition-transform hover:scale-105 hover:z-20 w-full max-w-[160px] sm:max-w-none sm:w-48",
                  rotation,
                  hasDrawn ? 'opacity-80' : ''
                )}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md z-10 border border-red-900" 
                     style={{ boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.5), 2px 4px 6px rgba(0,0,0,0.5)' }} />
                
                <div className="w-full aspect-[3/4] bg-neutral-200 overflow-hidden border border-neutral-400">
                  <img 
                    src={suspect.photo_url} 
                    alt={suspect.name} 
                    className={twMerge(
                      "w-full h-full object-cover",
                      hasDrawn ? "grayscale sepia-[0.5]" : "grayscale sepia-[0.2]"
                    )}
                    crossOrigin="anonymous"
                  />
                </div>
                
                <div className="absolute bottom-1 sm:bottom-3 left-0 w-full text-center">
                  <p className="font-bold font-mono text-neutral-900 text-[10px] sm:text-sm uppercase truncate px-1">{suspect.name}</p>
                  <p className="font-mono text-neutral-600 text-[8px] sm:text-[10px] uppercase truncate px-1">{suspect.course}</p>
                </div>

                {hasDrawn && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 sm:border-4 border-red-600 text-red-600 bg-black/60 font-black uppercase text-sm sm:text-lg px-2 py-1 rotate-[-15deg] pointer-events-none shadow-md">
                    SENTENCIADO
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {suspects.length === 0 && (
          <div className="text-center py-20 text-neutral-500 font-bold uppercase tracking-widest border-2 border-dashed border-neutral-800">
            Nenhum caso ativo pendente
          </div>
        )}

        {selectedSuspect && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] w-full max-w-2xl border-2 sm:border-4 border-red-800 shadow-[0_0_30px_rgba(220,38,38,0.3)] p-1 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20" />
              
              <div className="relative bg-neutral-900 p-6 sm:p-8 z-10 flex flex-col items-center">
                {!isSpinning && !result && (
                  <button 
                    onClick={handleCloseModal}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 text-neutral-500 hover:text-white p-2 z-30"
                  >
                    <X size={24} />
                  </button>
                )}

                <div className="flex flex-col items-center mb-6 w-full text-center mt-4 sm:mt-0">
                  <AlertCircle size={32} className="text-red-600 mb-2" />
                  <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-widest mb-1">Julgamento Final</h3>
                  <p className="text-neutral-400 font-mono text-xs sm:text-sm uppercase">Sujeito: {selectedSuspect.name}</p>
                </div>

                <div className="w-full bg-black border-2 border-neutral-700 h-32 sm:h-40 flex items-center justify-center p-6 mb-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_100%)]" />
                  
                  {currentDisplay ? (
                    <p className={twMerge(
                      "text-xl sm:text-3xl font-mono text-center uppercase font-bold text-white relative z-10",
                      result ? "text-red-500 animate-pulse" : "text-green-500"
                    )}>
                      {currentDisplay.description}
                    </p>
                  ) : (
                    <p className="text-neutral-600 font-mono text-base sm:text-xl uppercase tracking-widest">
                      Aguardando Execução...
                    </p>
                  )}
                </div>

                {result ? (
                  <button 
                    onClick={handleCloseModal}
                    className="bg-neutral-800 text-white border border-neutral-600 px-8 py-3 font-bold uppercase tracking-widest hover:bg-neutral-700 w-full sm:w-auto z-30 relative"
                  >
                    Fechar Arquivo
                  </button>
                ) : selectedSuspect.draws?.length > 0 ? (
                  <div className="text-red-500 font-bold uppercase tracking-widest border border-red-900 bg-red-950/50 px-6 py-3 text-center w-full z-30 relative">
                    Sujeito já sentenciado
                  </div>
                ) : (
                  <button 
                    onClick={() => spin(selectedSuspect.id)}
                    disabled={isSpinning}
                    className={twMerge(
                      "bg-red-700 text-white px-6 py-4 font-black uppercase tracking-widest sm:tracking-[0.2em] shadow-[0_0_20px_rgba(185,28,28,0.5)] transition-all flex items-center gap-3 w-full sm:w-auto justify-center z-30 relative",
                      isSpinning ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600 hover:scale-105 active:scale-95"
                    )}
                  >
                    <Gavel size={24} />
                    {isSpinning ? 'Executando...' : 'Executar Sentença'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
