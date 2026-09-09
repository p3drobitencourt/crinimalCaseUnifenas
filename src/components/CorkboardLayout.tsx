import { Outlet, Link } from 'react-router-dom';
import { Briefcase, Gavel, FileText } from 'lucide-react';

export default function CorkboardLayout() {
  return (
    <div className="min-h-screen bg-[#8b6b4d] relative overflow-x-hidden font-mono text-neutral-800">
      {/* Background Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(#4d3a29 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Header/Nav - Made to look like a manila folder tab */}
      <header className="relative z-10 px-2 sm:px-4 pt-4 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-end gap-3 md:gap-0">
        <div className="bg-[#e4d5b7] px-4 py-3 sm:px-6 sm:py-3 rounded-lg md:rounded-b-none md:rounded-t-lg shadow-lg border-2 md:border-b-0 border-neutral-700 w-full md:w-auto relative overflow-hidden text-center md:text-left">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600/70" />
          <h1 className="text-base sm:text-xl font-bold uppercase tracking-widest text-neutral-900 flex items-center justify-center md:justify-start gap-2">
            <Briefcase size={20} className="sm:w-6 sm:h-6" />
            <span>Arquivos Confidenciais</span>
          </h1>
        </div>

        <nav className="flex w-full md:w-auto gap-1 sm:gap-2 items-end">
          <Link to="/suspect-entry" className="flex-1 md:flex-none justify-center bg-[#e4d5b7] px-1 sm:px-4 py-3 sm:py-2 rounded-t-lg shadow-lg border-2 border-b-0 border-neutral-700 hover:bg-[#d4c5a7] transition-colors flex items-center gap-1 sm:gap-2 font-bold uppercase text-[10px] sm:text-sm text-center">
            <FileText size={14} className="hidden sm:block" /> Registro
          </Link>
          <Link to="/hq-admin" className="flex-1 md:flex-none justify-center bg-[#e4d5b7] px-1 sm:px-4 py-3 sm:py-2 rounded-t-lg shadow-lg border-2 border-b-0 border-neutral-700 hover:bg-[#d4c5a7] transition-colors flex items-center gap-1 sm:gap-2 font-bold uppercase text-[10px] sm:text-sm text-center">
            Admin
          </Link>
          <Link to="/hq-admin/judgement" className="flex-1 md:flex-none justify-center bg-[#e4d5b7] px-1 sm:px-4 py-3 sm:py-2 rounded-t-lg shadow-lg border-2 border-b-0 border-neutral-700 hover:bg-[#d4c5a7] transition-colors flex items-center gap-1 sm:gap-2 font-bold uppercase text-[10px] sm:text-sm text-center">
            <Gavel size={14} className="hidden sm:block" /> Julgamento
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-6xl mx-auto min-h-[calc(100vh-120px)] px-2 sm:px-4 pb-4">
        <div className="bg-[#f0ebd8] w-full min-h-full p-4 sm:p-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] md:shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] border-4 border-neutral-700 rounded-b-xl rounded-t-none relative">
          {/* Tape/Pin effects could go here */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
