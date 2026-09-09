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
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-sans">
      <form 
        onSubmit={handleLogin} 
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl flex flex-col gap-6"
      >
        <div className="text-center border-b border-zinc-800 pb-4 mb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-red-600/20 p-4 rounded-full border border-red-900/50">
              <Lock size={32} className="text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-red-600 uppercase tracking-widest">
            Acesso Restrito
          </h1>
          <p className="text-zinc-400 mt-2 text-sm font-bold uppercase tracking-wider">
            Painel do Administrador
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-zinc-300 font-bold uppercase text-sm tracking-wider">
            Identificação (E-mail)
          </label>
          <input 
            type="email" 
            name="email"
            required 
            className="bg-zinc-950 border border-zinc-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-600 focus:outline-none transition-all placeholder:text-zinc-600"
            placeholder="admin@departamento.com"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-zinc-300 font-bold uppercase text-sm tracking-wider">
            Senha de Acesso
          </label>
          <input 
            type="password" 
            name="password"
            required 
            className="bg-zinc-950 border border-zinc-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-600 focus:outline-none transition-all placeholder:text-zinc-600 tracking-[0.3em]"
            placeholder="••••••••"
          />
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-950/50 p-3 rounded-lg border border-red-900 justify-center font-bold text-sm">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="mt-4 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-bold py-4 px-6 rounded-lg uppercase tracking-widest transition-all disabled:cursor-not-allowed flex justify-center items-center shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Autenticando...
            </span>
          ) : (
            'Entrar no Sistema'
          )}
        </button>
      </form>
    </main>
  )
}
