'use client'

import { useState } from 'react'
import { Lock, AlertTriangle } from 'lucide-react'
import { loginAction } from '@/app/actions/auth'

export default function AdminLoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch {
      setError('ERRO NO SISTEMA')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center font-sans">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-[#1a1a1a] p-8 border-4 border-neutral-700 shadow-2xl relative overflow-hidden text-neutral-300 font-mono">
          {/* CRT Scanline effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10" />
          
          <div className="flex flex-col items-center mb-8 relative z-20">
            <div className="bg-red-600 p-4 rounded-full mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-white">Acesso à Central</h2>
            <p className="text-red-500 font-bold text-sm mt-1 uppercase">Área Restrita (Supabase Auth)</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6 relative z-20">
            <div className="flex flex-col gap-2">
              <label className="uppercase text-xs font-bold tracking-widest text-neutral-400">E-mail Operacional</label>
              <input 
                type="email" 
                name="email"
                required
                className="bg-black border border-neutral-600 p-3 text-green-500 font-mono outline-none focus:border-green-500 text-center tracking-widest"
                placeholder="agente@departamento.gov"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="uppercase text-xs font-bold tracking-widest text-neutral-400">Senha de Acesso</label>
              <input 
                type="password" 
                name="password"
                required
                className="bg-black border border-neutral-600 p-3 text-green-500 font-mono outline-none focus:border-green-500 text-center tracking-[0.5em]"
                placeholder="••••••••"
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-950/50 p-2 border border-red-900 justify-center font-bold text-sm">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-neutral-800 text-white font-bold uppercase tracking-widest py-3 hover:bg-neutral-700 transition-colors border border-neutral-600 focus:bg-green-700 focus:border-green-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Verificando...' : 'Autenticar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
