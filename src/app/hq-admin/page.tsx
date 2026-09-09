'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, EyeOff, Eye, Users, FileText, AlertCircle, LogOut, Gavel } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { 
  getDashboardData, 
  addSentenceAction, 
  updateSentenceAction, 
  deleteSentenceAction, 
  deleteSuspectAction 
} from '@/app/actions/dashboard'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'suspects' | 'sentences'>('suspects')
  const [sentences, setSentences] = useState<any[]>([])
  const [suspects, setSuspects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean, type: 'suspect'|'sentence', id: string, label: string } | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getDashboardData()
      setSentences(data.sentences || [])
      setSuspects(data.suspects || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/hq-admin/login')
  }

  const handleAddSentence = async () => {
    if (!newDesc) return
    const res = await addSentenceAction(newDesc)
    if (res.success) {
      setNewDesc('')
      setIsAdding(false)
      fetchData()
    }
  }

  const handleUpdateSentence = async (id: string) => {
    const target = sentences.find(s => s.id === id)
    if (!target) return
    const res = await updateSentenceAction(id, editingId === id ? editDesc : target.description, true)
    if (res.success) {
      setEditingId(null)
      fetchData()
    }
  }

  const promptDeleteSentence = (sentence: any) => {
    setDeleteConfig({ isOpen: true, type: 'sentence', id: sentence.id, label: sentence.description })
  }

  const promptDeleteSuspect = (suspect: any) => {
    setDeleteConfig({ isOpen: true, type: 'suspect', id: suspect.id, label: suspect.name })
  }

  const confirmDelete = async () => {
    if (!deleteConfig) return
    if (deleteConfig.type === 'suspect') {
      await deleteSuspectAction(deleteConfig.id)
    } else {
      await deleteSentenceAction(deleteConfig.id)
    }
    setDeleteConfig(null)
    fetchData()
  }

  if (loading) return <div className="p-8 text-xl font-bold uppercase tracking-widest animate-pulse min-h-screen bg-zinc-950 text-white flex items-center justify-center">Acessando Banco de Dados...</div>

  return (
    <div className="min-h-screen bg-zinc-950 font-sans pb-12">
      <div className="max-w-5xl mx-auto pt-8 px-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-4 border-neutral-800 pb-4 mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-neutral-200">
              Painel de Administração
            </h2>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-red-500">Central de Controle do HQ</p>
          </div>
          <div className="flex gap-4">
            <Link 
              href="/hq-admin/judgement"
              className="bg-red-700 text-white font-bold uppercase tracking-widest px-4 py-2 hover:bg-red-600 transition-colors flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(185,28,28,0.3)]"
            >
              <Gavel size={18} /> Modo Julgamento
            </Link>
            <button 
              onClick={handleLogout}
              className="bg-neutral-800 text-white font-bold uppercase px-4 py-2 hover:bg-neutral-700 transition-colors flex items-center gap-2 text-sm border border-neutral-700"
            >
              <LogOut size={18} /> Sair
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('suspects')}
            className={twMerge(
              "flex items-center gap-2 px-6 py-3 font-bold uppercase tracking-widest border-2 border-b-0 rounded-t-lg transition-colors",
              activeTab === 'suspects' 
                ? "bg-[#e4d5b7] border-neutral-800 text-neutral-900 shadow-[inset_0_-2px_0_#e4d5b7] z-10 -mb-[2px]" 
                : "bg-zinc-900 border-neutral-700 text-neutral-400 hover:bg-zinc-800"
            )}
          >
            <Users size={18} /> Suspeitos
          </button>
          <button 
            onClick={() => setActiveTab('sentences')}
            className={twMerge(
              "flex items-center gap-2 px-6 py-3 font-bold uppercase tracking-widest border-2 border-b-0 rounded-t-lg transition-colors",
              activeTab === 'sentences' 
                ? "bg-[#e4d5b7] border-neutral-800 text-neutral-900 shadow-[inset_0_-2px_0_#e4d5b7] z-10 -mb-[2px]" 
                : "bg-zinc-900 border-neutral-700 text-neutral-400 hover:bg-zinc-800"
            )}
          >
            <FileText size={18} /> Penas
          </button>
        </div>

        <div className="bg-[#e4d5b7] border-2 border-neutral-800 p-4 sm:p-8 shadow-2xl relative z-0">
          {activeTab === 'suspects' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold uppercase tracking-widest border-b-2 border-neutral-800 pb-2 mb-4 text-black">Lista de Suspeitos Registrados</h3>
              
              {suspects.map(suspect => (
                <div key={suspect.id} className="bg-[#fdfbf7] p-4 border border-neutral-300 shadow-sm flex flex-col sm:flex-row items-center gap-4 text-black">
                  <div className="w-16 h-20 bg-neutral-200 shrink-0 border border-neutral-400">
                    <img src={suspect.photo_url} alt={suspect.name} className="w-full h-full object-cover grayscale sepia-[0.3]" crossOrigin="anonymous" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="font-mono text-xl font-bold uppercase">{suspect.name}</p>
                    <p className="font-mono text-sm uppercase text-neutral-600">Curso: {suspect.course}</p>
                    
                    {suspect.draws && suspect.draws.length > 0 ? (
                      <p className="font-mono text-sm text-red-600 font-bold mt-1 uppercase border border-red-200 bg-red-50 inline-block px-2">Sentenciado: {suspect.draws[0].sentence.description}</p>
                    ) : (
                      <p className="font-mono text-sm text-green-700 font-bold mt-1 uppercase border border-green-200 bg-green-50 inline-block px-2">Aguardando Julgamento</p>
                    )}
                  </div>
                  <button 
                    onClick={() => promptDeleteSuspect(suspect)} 
                    className="p-3 text-red-700 hover:bg-red-100 flex items-center gap-2 font-bold uppercase border-2 border-red-700 sm:border-0"
                  >
                    <Trash2 size={20} /> <span className="sm:hidden">Remover</span>
                  </button>
                </div>
              ))}

              {suspects.length === 0 && (
                <div className="text-center py-12 text-neutral-500 font-bold uppercase tracking-widest border-2 border-dashed border-neutral-400">
                  Nenhum suspeito encontrado
                </div>
              )}
            </div>
          )}

          {activeTab === 'sentences' && (
            <div className="space-y-4 text-black">
              <div className="flex justify-between items-center border-b-2 border-neutral-800 pb-2 mb-4">
                <h3 className="text-xl font-bold uppercase tracking-widest">Penas Disponíveis</h3>
                <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="bg-neutral-900 text-[#fdfbf7] px-3 py-2 font-bold uppercase text-sm hover:bg-neutral-800 flex items-center gap-2"
                >
                  {isAdding ? <X size={16} /> : <Plus size={16} />}
                  {isAdding ? 'Cancelar' : 'Nova Pena'}
                </button>
              </div>

              {isAdding && (
                <div className="bg-[#fdfbf7] p-4 sm:p-6 mb-6 border-2 border-dashed border-neutral-400 shadow-md">
                  <label className="block text-sm font-bold uppercase tracking-wider text-neutral-600 mb-2">
                    Descrição da Nova Pena
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="flex-1 bg-transparent border-b-2 border-neutral-800 outline-none p-2 font-mono text-base sm:text-lg"
                      autoFocus
                    />
                    <button 
                      onClick={handleAddSentence}
                      className="bg-green-700 text-white px-6 py-3 sm:py-2 font-bold uppercase hover:bg-green-600 flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> Salvar
                    </button>
                  </div>
                </div>
              )}

              {sentences.map(sentence => (
                <div 
                  key={sentence.id} 
                  className={`bg-[#fdfbf7] p-4 border border-neutral-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
                >
                  <div className="flex-1 w-full">
                    {editingId === sentence.id ? (
                      <input 
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full bg-transparent border-b border-neutral-800 outline-none font-mono text-lg"
                        autoFocus
                      />
                    ) : (
                      <p className={`font-mono text-lg`}>
                        {sentence.description}
                      </p>
                    )}
                    <p className="text-xs font-bold uppercase text-neutral-500 mt-1">ID: {sentence.id.split('-')[0]}</p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-0 border-neutral-200 pt-2 sm:pt-0">
                    {editingId === sentence.id ? (
                      <>
                        <button onClick={() => handleUpdateSentence(sentence.id)} className="p-2 text-green-700 hover:bg-green-100"><Save size={20} /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 text-neutral-600 hover:bg-neutral-200"><X size={20} /></button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setEditingId(sentence.id)
                            setEditDesc(sentence.description)
                          }} 
                          className="p-2 text-blue-700 hover:bg-blue-100"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button onClick={() => promptDeleteSentence(sentence)} className="p-2 text-red-700 hover:bg-red-100"><Trash2 size={20} /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {sentences.length === 0 && (
                <div className="text-center py-12 text-neutral-500 font-bold uppercase tracking-widest border-2 border-dashed border-neutral-300">
                  Nenhuma pena encontrada
                </div>
              )}
            </div>
          )}
        </div>

        {deleteConfig?.isOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] w-full max-w-md border-2 sm:border-4 border-red-800 shadow-[0_0_30px_rgba(220,38,38,0.3)] p-1 relative overflow-hidden text-white">
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20" />
              
              <div className="relative bg-neutral-900 p-6 sm:p-8 z-10 flex flex-col items-center text-center">
                <AlertCircle size={48} className="text-red-600 mb-4" />
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest mb-2">Alerta de Exclusão</h3>
                <p className="text-neutral-400 font-mono text-sm uppercase mb-8 leading-relaxed">
                  Deseja realmente eliminar o registro permanentemente?
                  <br /><br />
                  <span className="text-white font-bold bg-neutral-800 px-3 py-1 border border-neutral-700 inline-block">{deleteConfig.label}</span>
                </p>
                
                <div className="flex flex-col sm:flex-row w-full gap-4">
                  <button 
                    onClick={() => setDeleteConfig(null)}
                    className="flex-1 bg-neutral-800 text-white border border-neutral-600 px-4 py-3 font-bold uppercase tracking-widest hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 bg-red-700 text-white px-4 py-3 font-black uppercase tracking-widest shadow-[0_0_15px_rgba(185,28,28,0.3)] hover:bg-red-600 hover:scale-105 transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
