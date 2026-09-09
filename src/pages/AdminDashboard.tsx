import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Save, X, EyeOff, Eye, Users, FileText, AlertCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface Sentence {
  id: string;
  description: string;
  is_active: boolean;
}

interface Suspect {
  id: string;
  name: string;
  course: string;
  photo_url: string;
  draws: any[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'suspects' | 'sentences'>('suspects');
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean, type: 'suspect'|'sentence', id: string, label: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sentRes, suspRes] = await Promise.all([
        fetch('/api/sentences'),
        fetch('/api/suspects')
      ]);
      
      if (sentRes.status === 401 || suspRes.status === 401) {
        navigate('/hq-admin/login');
        return;
      }
      
      const sentData = await sentRes.json();
      const suspData = await suspRes.json();
      
      setSentences(sentData);
      setSuspects(suspData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSentence = async () => {
    if (!newDesc) return;
    try {
      const res = await fetch('/api/sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDesc, is_active: true })
      });
      if (res.ok) {
        setNewDesc('');
        setIsAdding(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSentence = async (id: string, is_active?: boolean) => {
    const target = sentences.find(s => s.id === id);
    if (!target) return;
    
    try {
      const res = await fetch(`/api/sentences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: editingId === id ? editDesc : target.description, 
          is_active: is_active !== undefined ? is_active : target.is_active 
        })
      });
      if (res.ok) {
        setEditingId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const promptDeleteSentence = (sentence: Sentence) => {
    setDeleteConfig({ isOpen: true, type: 'sentence', id: sentence.id, label: sentence.description });
  };

  const promptDeleteSuspect = (suspect: Suspect) => {
    setDeleteConfig({ isOpen: true, type: 'suspect', id: suspect.id, label: suspect.name });
  };

  const confirmDelete = async () => {
    if (!deleteConfig) return;
    try {
      const endpoint = deleteConfig.type === 'suspect' ? `/api/suspects/${deleteConfig.id}` : `/api/sentences/${deleteConfig.id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfig(null);
    }
  };

  if (loading) return <div className="p-8 text-xl font-bold uppercase tracking-widest animate-pulse">Acessando Banco de Dados...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-4 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-4 border-neutral-800 pb-4 mb-6 sm:mb-8 gap-4 sm:gap-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-neutral-800">
            Painel de Administração
          </h2>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-neutral-600">Central de Controle do HQ</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setActiveTab('suspects')}
          className={twMerge(
            "flex items-center gap-2 px-6 py-3 font-bold uppercase tracking-widest border-2 border-b-0 rounded-t-lg transition-colors",
            activeTab === 'suspects' 
              ? "bg-[#e4d5b7] border-neutral-800 text-neutral-900 shadow-[inset_0_-2px_0_#e4d5b7] z-10 -mb-[2px]" 
              : "bg-[#d4c5a7] border-neutral-400 text-neutral-600 hover:bg-[#e4d5b7]"
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
              : "bg-[#d4c5a7] border-neutral-400 text-neutral-600 hover:bg-[#e4d5b7]"
          )}
        >
          <FileText size={18} /> Penas
        </button>
      </div>

      <div className="bg-[#e4d5b7] border-2 border-neutral-800 p-4 sm:p-6 shadow-xl relative z-0">
        {activeTab === 'suspects' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold uppercase tracking-widest border-b-2 border-neutral-800 pb-2 mb-4">Lista de Suspeitos Registrados</h3>
            
            {suspects.map(suspect => (
              <div key={suspect.id} className="bg-[#fdfbf7] p-4 border border-neutral-300 shadow-sm flex flex-col sm:flex-row items-center gap-4">
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
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b-2 border-neutral-800 pb-2 mb-4">
              <h3 className="text-xl font-bold uppercase tracking-widest">Penas Disponíveis</h3>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-neutral-900 text-[#fdfbf7] px-3 py-1 font-bold uppercase text-sm hover:bg-neutral-800 flex items-center gap-2"
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
                className={`bg-[#fdfbf7] p-4 border border-neutral-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${!sentence.is_active ? 'opacity-50 grayscale' : ''}`}
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
                    <p className={`font-mono text-lg ${!sentence.is_active ? 'line-through' : ''}`}>
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
                        onClick={() => handleUpdateSentence(sentence.id, !sentence.is_active)} 
                        className="p-2 text-neutral-600 hover:bg-neutral-200"
                        title="Alternar Status Ativo"
                      >
                        {sentence.is_active ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingId(sentence.id);
                          setEditDesc(sentence.description);
                        }} 
                        className="p-2 text-blue-700 hover:bg-blue-100"
                        disabled={!sentence.is_active}
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
          <div className="bg-[#1a1a1a] w-full max-w-md border-2 sm:border-4 border-red-800 shadow-[0_0_30px_rgba(220,38,38,0.3)] p-1 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20" />
            
            <div className="relative bg-neutral-900 p-6 sm:p-8 z-10 flex flex-col items-center text-center">
              <AlertCircle size={48} className="text-red-600 mb-4" />
              <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-widest mb-2">Alerta de Exclusão</h3>
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
  );
}
