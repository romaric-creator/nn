import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Terminal, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await window.electronAPI.invoke('user:login', login, password);
      if (res.success) {
        localStorage.setItem('user', JSON.stringify(res.user));
        onLogin(res.user);
        navigate('/');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("DÉFAUT DE CONNEXION SYSTÈME");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF0] p-6 selection:bg-[#1A1A1A] selection:text-[#FDFCF0]">
      {/* Texture Papier */}
      <div className="fixed inset-0 pointer-events-none opacity-10 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]"></div>

      <div className="w-full max-w-lg relative">
        {/* Décoration Brutaliste Orange */}
        <div className="absolute -top-8 -left-8 w-24 h-24 bg-[#FF5F1F] -z-10 border-4 border-[#1A1A1A]"></div>
        
        <div className="bg-white border-[6px] border-[#1A1A1A] shadow-[16px_16px_0px_#1A1A1A] p-12 relative overflow-hidden">
          {/* Header Identité */}
          <div className="mb-12 border-b-4 border-[#1A1A1A] pb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#1A1A1A] text-white p-4 shadow-[4px_4px_0px_#FF5F1F]">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-serif italic font-black text-[#1A1A1A] tracking-tighter">FLEXY STORE</h1>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A] opacity-60 mt-1">Habilitation Requise</p>
              </div>
            </div>
          </div>

          {/* Message d'Erreur Style Tampon */}
          {error && (
            <div className="mb-10 p-6 bg-[#1A1A1A] text-white border-l-[12px] border-[#FF5F1F] animate-in slide-in-from-left-4 duration-300">
               <p className="text-[10px] font-mono font-black uppercase tracking-widest leading-relaxed text-[#FF5F1F]">
                  ALERTE : {error}
               </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-[0.3em] text-[#1A1A1A] flex items-center gap-2 italic">
                <User size={14} className="text-[#FF5F1F]" /> Matricule Agent
              </label>
              <input
                type="text"
                required
                className="w-full bg-[#FDFCF0] border-4 border-[#1A1A1A] p-5 text-xl font-black placeholder:text-[#1A1A1A]/10 focus:outline-none focus:shadow-[8px_8px_0px_#FF5F1F] transition-all uppercase"
                placeholder="EX: ADMIN"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-[0.3em] text-[#1A1A1A] flex items-center gap-2 italic">
                <Lock size={14} className="text-[#FF5F1F]" /> Clé de Sécurité
              </label>
              <input
                type="password"
                required
                className="w-full bg-[#FDFCF0] border-4 border-[#1A1A1A] p-5 text-xl font-black placeholder:text-[#1A1A1A]/10 focus:outline-none focus:shadow-[8px_8px_0px_#FF5F1F] transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] text-white py-6 flex items-center justify-center gap-4 hover:bg-[#FF5F1F] transition-colors group border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <span className="text-sm font-black uppercase tracking-[0.4em]">Ouvrir Session</span>
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          {/* Footer Ledger */}
          <div className="mt-16 pt-8 border-t-4 border-[#1A1A1A]/5 flex justify-between items-center opacity-40 font-mono text-[9px] font-black uppercase tracking-widest">
             <span>Propriété FLEXY STORE</span>
             <span>Registre Ver. 2026.03</span>
          </div>
        </div>
        
        {/* Accent Brutaliste droit */}
        <div className="absolute -bottom-6 -right-6 w-32 h-8 bg-[#1A1A1A] -z-10"></div>
      </div>
    </div>
  );
}
