import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, AlertCircle, X } from 'lucide-react';
import { useRoulette } from '../hooks/useRoulette';
import { twMerge } from 'tailwind-merge';

interface Suspect {
  id: string;
  name: string;
  course: string;
  photo_url: string;
  draws: any[];
}

export default function Judgement() {
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  
  const navigate = useNavigate();
  const { isSpinning, currentDisplay, result, spin, setResult } = useRoulette(sentences);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [suspRes, sentRes] = await Promise.all([
        fetch('/api/suspects'),
        fetch('/api/sentences')
      ]);

      if (suspRes.status === 401 || sentRes.status === 401) {
        navigate('/hq-admin/login');
        return;
      }

      const suspData = await suspRes.json();
      const sentData = await sentRes.json();
      
      setSuspects(suspData);
      setSentences(sentData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuspect = (suspect: Suspect) => {
    setSelectedSuspect(suspect);
    setResult(null); // Reset previous result for UI
  };

  const handleCloseModal = () => {
    if (isSpinning) return; // Don't close while spinning
    setSelectedSuspect(null);
    if (result) {
      // Re-fetch to update suspect's drawn status
      fetchData();
    }
  };

  if (loading) return <div className="p-8 text-xl font-bold uppercase tracking-widest animate-pulse">Analisando Evidências...</div>;

  return (
    <div className="relative">
      <div className="mb-6 sm:mb-8 border-b-4 border-neutral-800 pb-2 text-center sm:text-left">
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-neutral-800">
          Painel de Julgamento
        </h2>
        <p className="text-neutral-600 font-bold uppercase tracking-widest text-xs sm:text-sm">Selecione o Suspeito para a Sentença</p>
      </div>

      {/* Corkboard items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8 justify-items-center">
        {suspects.map((suspect, index) => {
          const hasDrawn = suspect.draws && suspect.draws.length > 0;
          const rotation = index % 2 === 0 ? 'rotate-[-2deg]' : 'rotate-[2deg]';
          
          return (
            <div 
              key={suspect.id}
              onClick={() => handleSelectSuspect(suspect)}
              className={twMerge(
                "relative bg-[#fdfbf7] p-2 pb-8 sm:p-3 sm:pb-12 shadow-[0_4px_10px_rgba(0,0,0,0.3)] sm:shadow-[0_8px_20px_rgba(0,0,0,0.4)] border border-neutral-300 cursor-pointer transition-transform hover:scale-105 hover:z-20 w-full max-w-[160px] sm:max-w-none sm:w-56",
                rotation,
                hasDrawn ? 'opacity-80' : ''
              )}
            >
              {/* Red pin at the top */}
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
                <p className="font-bold font-mono text-neutral-900 text-sm sm:text-lg uppercase truncate px-2">{suspect.name}</p>
                <p className="font-mono text-neutral-600 text-[10px] sm:text-xs uppercase truncate px-2">{suspect.course}</p>
              </div>

              {hasDrawn && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 sm:border-4 border-red-600 text-red-600 font-black uppercase text-sm sm:text-2xl px-2 py-1 rotate-[-15deg] opacity-90 pointer-events-none shadow-md">
                  SENTENCIADO
                </div>
              )}
            </div>
          );
        })}
      </div>

      {suspects.length === 0 && (
        <div className="text-center py-20 text-neutral-500 font-bold uppercase tracking-widest border-2 border-dashed border-neutral-400">
          Nenhum caso ativo pendente
        </div>
      )}

      {/* Sentencing Modal Overlay */}
      {selectedSuspect && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] w-full max-w-2xl border-2 sm:border-4 border-red-800 shadow-[0_0_30px_rgba(220,38,38,0.3)] p-1 relative overflow-hidden">
            {/* CRT overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20" />
            
            <div className="relative bg-neutral-900 p-4 sm:p-8 z-10 flex flex-col items-center">
              {!isSpinning && !result && (
                <button 
                  onClick={handleCloseModal}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 text-neutral-500 hover:text-white p-2"
                >
                  <X size={24} />
                </button>
              )}

              <div className="flex flex-col items-center mb-6 sm:mb-8 w-full text-center mt-4 sm:mt-0">
                <AlertCircle size={32} className="text-red-600 mb-2 sm:w-10 sm:h-10" />
                <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-widest mb-1">Julgamento Final</h3>
                <p className="text-neutral-400 font-mono text-xs sm:text-sm uppercase">Sujeito: {selectedSuspect.name}</p>
              </div>

              {/* Roulette Display Area */}
              <div className="w-full bg-black border-2 border-neutral-700 h-28 sm:h-40 flex items-center justify-center p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_100%)]" />
                
                {currentDisplay ? (
                  <p className={twMerge(
                    "text-xl sm:text-2xl md:text-3xl font-mono text-center uppercase font-bold",
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

              {/* Action Button */}
              {result ? (
                <button 
                  onClick={handleCloseModal}
                  className="bg-neutral-800 text-white border border-neutral-600 px-8 py-3 font-bold uppercase tracking-widest hover:bg-neutral-700 w-full sm:w-auto"
                >
                  Fechar Arquivo
                </button>
              ) : selectedSuspect.draws?.length > 0 ? (
                <div className="text-red-500 font-bold uppercase tracking-widest border border-red-900 bg-red-950/50 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-center w-full">
                  Sujeito já sentenciado
                </div>
              ) : (
                <button 
                  onClick={() => spin(selectedSuspect.id)}
                  disabled={isSpinning}
                  className={twMerge(
                    "bg-red-700 text-white px-4 py-3 sm:px-8 sm:py-4 font-black uppercase tracking-widest sm:tracking-[0.2em] shadow-[0_0_20px_rgba(185,28,28,0.5)] transition-all flex items-center gap-2 sm:gap-3 text-sm sm:text-base w-full sm:w-auto justify-center",
                    isSpinning ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600 hover:scale-105 active:scale-95"
                  )}
                >
                  <Gavel size={20} className="sm:w-6 sm:h-6" />
                  {isSpinning ? 'Executando...' : 'Executar Sentença'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
