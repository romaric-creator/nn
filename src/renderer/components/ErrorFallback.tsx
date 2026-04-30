import React from "react";
import {
  AlertOctagon,
  RefreshCw,
  Home,
  ShieldAlert,
  Terminal,
} from "lucide-react";

interface Props {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF0] p-6 selection:bg-[#1A1A1A] selection:text-[#FDFCF0]">
      {/* Texture Papier */}
      <div className="fixed inset-0 pointer-events-none opacity-10 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]"></div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Décoration Brutaliste */}
        <div className="absolute -top-6 -left-6 w-20 h-20 bg-red-600 -z-10 border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A]"></div>

        <div className="bg-white border-[6px] border-[#1A1A1A] shadow-[20px_20px_0px_#1A1A1A] overflow-hidden">
          <div className="bg-red-600 p-8 border-b-4 border-[#1A1A1A] flex items-center gap-6">
            <div className="bg-[#1A1A1A] p-4 text-white shadow-[4px_4px_0px_white]">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                Alerte Système
              </h1>
              <p className="text-[10px] font-black uppercase text-white/60 tracking-[0.3em] mt-1">
                Interruption Critique Détectée
              </p>
            </div>
          </div>

          <div className="p-12 space-y-10">
            <div className="space-y-4">
              <h2 className="text-xl font-black text-[#1A1A1A] uppercase tracking-tighter">
                Une erreur inattendue a bloqué le processus.
              </h2>
              <p className="text-sm font-serif italic font-black text-[#1A1A1A]/60 leading-relaxed">
                Le registre a rencontré une anomalie structurelle. Vos données
                locales restent sécurisées, mais l'interface doit être
                réinitialisée.
              </p>
            </div>

            <div className="bg-[#1A1A1A] p-8 border-l-[12px] border-[#FF5F1F] shadow-[8px_8px_0px_#1A1A1A]/10 max-h-60 overflow-auto custom-scrollbar relative group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-[#FF5F1F]">
                  <Terminal size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Détails Techniques
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(error.stack || error.message);
                    alert("Détails copiés dans le presse-papiers");
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-[#FF5F1F] text-white text-[8px] font-black uppercase px-2 py-1 border border-white/20"
                >
                  Copier
                </button>
              </div>
              <pre className="text-[11px] font-mono text-white/90 font-black leading-relaxed whitespace-pre-wrap">
                {error.stack || error.message || "Erreur de segment indéfinie"}
              </pre>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <button
                onClick={resetErrorBoundary}
                className="btn-brut flex items-center justify-center gap-4 py-6 text-sm"
              >
                <RefreshCw size={20} />
                <span className="tracking-[0.2em]">Relancer</span>
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-white text-[#1A1A1A] border-4 border-[#1A1A1A] py-6 shadow-[6px_6px_0px_#1A1A1A] hover:bg-[#FDFCF0] transition-all flex items-center justify-center gap-4 font-black uppercase text-[10px] tracking-[0.2em] active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <Home size={20} />
                <span>Tableau de Bord</span>
              </button>
            </div>
          </div>

          <div className="bg-[#1A1A1A] p-6 text-center">
            <p className="text-[9px] font-black uppercase text-white/40 tracking-[0.4em]">
              FLEXY STORE : Protocole de Récupération Actif
            </p>
          </div>
        </div>

        {/* Accent Brutaliste bas */}
        <div className="absolute -bottom-4 -right-4 w-40 h-10 bg-[#FF5F1F] -z-10 border-4 border-[#1A1A1A]"></div>
      </div>
    </div>
  );
}
