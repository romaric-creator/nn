import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ShieldAlert,
  Terminal,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";

interface Props {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: Props) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(error.stack || error.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-outfit relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="glass-card rounded-[3.5rem] border-slate-200/60 shadow-2xl shadow-indigo-500/5 overflow-hidden">
          {/* Status Header */}
          <div className="bg-slate-900 p-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/20 blur-3xl -mr-20 -mt-20"></div>
             
             <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl flex items-center justify-center shadow-xl shadow-rose-500/20 rotate-3">
                   <ShieldAlert className="text-white" size={32} />
                </div>
                <div>
                   <h1 className="text-3xl font-black text-white tracking-tight italic">Exception Détectée</h1>
                   <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Protocole de protection actif</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="p-12 space-y-10 bg-white/40 backdrop-blur-xl">
             <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                  Une interruption inattendue a été isolée.
                </h2>
                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-lg">
                  Le moteur du registre a rencontré une anomalie structurelle. Pour garantir l'intégrité de vos données, l'interface doit être réinitialisée.
                </p>
             </div>

             {/* Technical Details Console */}
             <div className="bg-slate-900 rounded-[2rem] border border-white/5 shadow-2xl relative group overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                   <div className="flex items-center gap-3 text-indigo-400">
                      <Terminal size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Stack Trace & Logs</span>
                   </div>
                   <button 
                     onClick={handleCopy}
                     className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-widest border border-indigo-500/20"
                   >
                      {copied ? <ClipboardCheck size={12} /> : <ChevronRight size={12} />}
                      <span>{copied ? "Copié" : "Copier"}</span>
                   </button>
                </div>
                
                <div className="p-8 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[11px] text-slate-400 leading-relaxed font-medium">
                   <span className="text-rose-400 font-bold mb-2 block">ReferenceError: {error.message}</span>
                   {error.stack}
                </div>
             </div>

             {/* Actions */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={resetErrorBoundary}
                  className="premium-btn-primary py-5 group"
                >
                   <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                   <span>Réinitialiser la vue</span>
                </button>
                
                <button 
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-3 py-5 bg-white border border-slate-200 text-slate-500 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
                >
                   <Home size={20} />
                   <span>Tableau de Bord</span>
                </button>
             </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100/50 text-center">
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                FLEXY STORE &copy; 2026 • ENGINE RECOVERY CORE
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

