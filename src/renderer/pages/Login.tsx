import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

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
      const res: any = await window.electronAPI.invoke('user:login', login, password);
      if (res.success) {
        localStorage.setItem('user', JSON.stringify(res.user));
        onLogin(res.user);
        navigate('/');
      } else {
        setError(res.message || "Identifiants invalides");
      }
    } catch (err) {
      setError("DÉFAUT DE CONNEXION SYSTÈME");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 font-['Outfit'] relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-blue-600/10 blur-[80px] rounded-full"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-12 md:p-16 shadow-2xl shadow-black/50 overflow-hidden relative">
          {/* Internal Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 opacity-50"></div>
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] mb-8 shadow-2xl shadow-indigo-600/40 rotate-3 group hover:rotate-0 transition-transform duration-500 cursor-default">
              <ShieldCheck className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-4">
              FLEXY<span className="text-indigo-400">STORE</span>
            </h1>
            <div className="flex items-center justify-center gap-2">
               <span className="h-[1px] w-8 bg-white/10"></span>
               <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Accès Agent Sécurisé</p>
               <span className="h-[1px] w-8 bg-white/10"></span>
            </div>
          </div>

          {/* Error FeedBack */}
          {error && (
            <div className="mb-10 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in shake duration-500">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  <p className="text-[11px] font-black text-rose-400 uppercase tracking-wider">
                    {error}
                  </p>
               </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">
                Identifiant Matricule
              </label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all uppercase font-bold text-sm tracking-widest placeholder:text-slate-600 shadow-inner"
                  placeholder="NOM D'UTILISATEUR"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">
                Code de Sécurité
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input
                  type="password"
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm tracking-widest placeholder:text-slate-600 shadow-inner"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full premium-btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-[100%] transition-all duration-1000"></div>
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <span>Authentification</span>
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-14 pt-10 border-t border-white/5 text-center flex flex-col items-center gap-4">
             <div className="flex items-center gap-6 opacity-30">
                <Zap size={14} className="text-white" />
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                <ShieldCheck size={14} className="text-white" />
             </div>
             <p className="text-[10px] text-slate-600 font-extrabold uppercase tracking-[0.3em]">
               Enterprise Control Panel <span className="text-slate-700">© 2026 Admin Solutions</span>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
