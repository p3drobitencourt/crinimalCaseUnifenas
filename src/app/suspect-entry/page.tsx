'use client'

import { useState } from 'react'
import { addSuspectAction } from '@/app/actions/suspects'
import Link from 'next/link'
import { Lock } from 'lucide-react'

export default function SuspectEntryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await addSuspectAction(formData)
      
      if (result?.error) {
        setMessage({ text: result.error, type: 'error' })
      } else if (result?.success) {
        setMessage({ text: 'Suspeito autuado e fichado com sucesso!', type: 'success' })
        ;(e.target as HTMLFormElement).reset()
      }
    } catch (err) {
      setMessage({ text: 'Erro crítico na comunicação com o servidor.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 font-sans relative">
      
      {/* Botão discreto para o Painel Admin */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <Link 
          href="/hq-admin/login" 
          className="flex items-center gap-2 text-zinc-600 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest border border-zinc-800 hover:border-red-900/50 bg-zinc-900/50 px-3 py-2 rounded-lg backdrop-blur-sm"
        >
          <Lock size={14} />
          Acesso Restrito
        </Link>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl flex flex-col gap-6"
      >
        <div className="text-center border-b border-zinc-800 pb-4 mb-2">
          <h1 className="text-3xl font-extrabold text-red-600 uppercase tracking-widest">
            Ficha Criminal
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Registro oficial do Departamento de Investigações</p>
        </div>
        
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-zinc-300 font-bold uppercase text-sm tracking-wider">
            Nome do Indivíduo
          </label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            required 
            className="bg-zinc-950 border border-zinc-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-600 focus:outline-none transition-all"
            placeholder="Ex: João da Silva"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="course" className="text-zinc-300 font-bold uppercase text-sm tracking-wider">
            Curso
          </label>
          <input 
            type="text" 
            id="course" 
            name="course" 
            required 
            className="bg-zinc-950 border border-zinc-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-600 focus:outline-none transition-all"
            placeholder="Ex: Engenharia de Software"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="photo" className="text-zinc-300 font-bold uppercase text-sm tracking-wider">
            Mugshot (Foto de Evidência)
          </label>
          <input 
            type="file" 
            id="photo" 
            name="photo" 
            accept="image/*" 
            capture="environment"
            required 
            className="bg-zinc-950 border border-zinc-700 text-zinc-400 rounded-lg p-2 
                       file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 
                       file:text-sm file:font-bold file:bg-red-600 file:text-white 
                       hover:file:bg-red-700 file:cursor-pointer file:uppercase file:tracking-wider transition-all"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="mt-4 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-bold py-4 px-6 rounded-lg uppercase tracking-widest transition-all disabled:cursor-not-allowed flex justify-center items-center shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processando Ficha...
            </span>
          ) : (
            'Registrar Suspeito'
          )}
        </button>

        {message && (
          <div className={`p-4 rounded-lg mt-2 font-semibold text-center border ${
            message.type === 'error' 
              ? 'bg-red-950/50 border-red-900 text-red-400' 
              : 'bg-green-950/50 border-green-900 text-green-400'
          }`}>
            {message.text}
          </div>
        )}
      </form>
    </main>
  )
}
