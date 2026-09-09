import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, CheckCircle, Camera, Video, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function SuspectEntry() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      stopCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setPreview(null);
      setFile(null);
    } catch (err) {
      setErrorMessage('Não foi possível acessar a câmera. Verifique as permissões.');
      setStatus('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFile(newFile);
            setPreview(URL.createObjectURL(blob));
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !course || !file) {
      setErrorMessage('Evidência faltando: Nome, Curso e Foto são obrigatórios.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('course', course);
    formData.append('photo', file);

    try {
      const res = await fetch('/api/suspects', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao processar suspeito');
      }

      setStatus('success');
      setFile(null);
      setPreview(null);
      setName('');
      setCourse('');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-4 sm:mt-8">
      <div className="flex flex-col items-center mb-8 sm:mb-12 text-center">
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-neutral-800 border-b-4 border-red-600 pb-2 mb-2 inline-block">
          Novo Arquivo
        </h2>
        <p className="text-neutral-600 font-bold uppercase tracking-widest text-xs sm:text-sm">Caso # {new Date().getFullYear()}-{Math.floor(Math.random() * 9000) + 1000}</p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        {/* Background Paper Stack effect */}
        <div className="absolute inset-0 bg-white shadow-xl rotate-1 rounded-sm border border-neutral-300 hidden sm:block" />
        <div className="absolute inset-0 bg-white shadow-xl -rotate-1 rounded-sm border border-neutral-300 hidden sm:block" />
        
        {/* Main Form Paper */}
        <div className="relative bg-[#fdfbf7] p-5 sm:p-8 md:p-12 shadow-2xl border border-neutral-300 rounded-sm z-10">
          {/* Top Stamp */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 border-2 sm:border-4 border-red-600 text-red-600 font-black uppercase text-sm sm:text-xl px-2 py-1 rotate-[15deg] opacity-80 pointer-events-none">
            Confidencial
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mt-8 sm:mt-0">
            {/* Left Col: Photo Upload */}
            <div className="flex flex-col gap-4 items-center w-full">
              <label className="text-sm font-bold uppercase tracking-wider text-neutral-600 self-start border-b-2 border-neutral-800 pb-1 w-full flex justify-between items-end">
                <span>Foto de Identificação</span>
                {preview && (
                  <button 
                    type="button" 
                    onClick={() => { setPreview(null); setFile(null); }}
                    className="text-xs text-red-600 flex items-center gap-1 hover:text-red-800"
                  >
                    <X size={14} /> Descartar
                  </button>
                )}
              </label>
              
              <div 
                className={twMerge(
                  "relative w-full aspect-[3/4] bg-neutral-200 border-4 border-dashed border-neutral-400 flex flex-col items-center justify-center transition-all overflow-hidden",
                  preview ? "border-solid border-white shadow-[0_4px_10px_rgba(0,0,0,0.3)] bg-white p-2 pb-12 rotate-[-2deg]" : "hover:bg-neutral-300",
                  isCameraActive ? "border-solid border-red-600 bg-black" : ""
                )}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Suspect" className="w-full h-full object-cover grayscale sepia-[0.3]" />
                    <div className="absolute bottom-2 left-0 w-full text-center font-bold font-mono text-neutral-800 text-lg uppercase">
                      Exibição A
                    </div>
                  </>
                ) : isCameraActive ? (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-full object-cover scale-x-[-1]" 
                    />
                    <div className="absolute inset-0 border-[8px] border-red-600/30 pointer-events-none" />
                    <div className="absolute bottom-4 w-full px-4">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="w-full bg-red-600 text-white font-black uppercase tracking-widest py-3 hover:bg-red-500 shadow-lg border-2 border-red-800"
                      >
                        Capturar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-6 w-full px-4 z-10">
                    <Camera size={48} className="text-neutral-500" />
                    <div className="flex flex-col gap-3 w-full">
                      <button 
                        type="button"
                        onClick={startCamera}
                        className="w-full bg-neutral-800 text-white font-bold uppercase tracking-widest py-3 text-sm hover:bg-neutral-700 flex items-center justify-center gap-2"
                      >
                        <Video size={18} /> Usar Câmera
                      </button>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-transparent border-2 border-neutral-500 text-neutral-600 font-bold uppercase tracking-widest py-3 text-sm hover:border-neutral-700 hover:text-neutral-800 flex items-center justify-center gap-2"
                      >
                        <Upload size={18} /> Escolher Arquivo
                      </button>
                    </div>
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </div>
            </div>

            {/* Right Col: Details */}
            <div className="flex flex-col gap-8 justify-center">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold uppercase tracking-wider text-neutral-600 border-b-2 border-neutral-800 pb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent text-xl font-medium outline-none border-b border-neutral-400 focus:border-red-600 font-mono py-1 uppercase"
                  placeholder="DESCONHECIDO"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold uppercase tracking-wider text-neutral-600 border-b-2 border-neutral-800 pb-1">
                  Curso / Departamento
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="bg-transparent text-xl font-medium outline-none border-b border-neutral-400 focus:border-red-600 font-mono py-1 uppercase"
                  placeholder="EX: ENG. SOFTWARE"
                />
              </div>

              {status === 'error' && (
                <div className="bg-red-100 text-red-800 p-3 rounded font-bold text-sm border-l-4 border-red-600 uppercase">
                  Erro: {errorMessage}
                </div>
              )}

              {status === 'success' && (
                <div className="bg-green-100 text-green-800 p-3 rounded font-bold text-sm border-l-4 border-green-600 uppercase flex items-center gap-2">
                  <CheckCircle size={18} /> Arquivo Salvo com Sucesso
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="mt-auto bg-neutral-900 text-[#fdfbf7] py-4 px-6 font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors flex justify-center items-center gap-2 shadow-[4px_4px_0_rgba(0,0,0,0.2)] active:translate-y-1 active:translate-x-1 active:shadow-none"
              >
                {status === 'submitting' ? 'Processando...' : 'Registrar no Sistema'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
