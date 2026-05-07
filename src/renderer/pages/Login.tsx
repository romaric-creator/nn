import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

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
      setError("ERREUR DE LIAISON SYSTÈME");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-['Outfit'] relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] right-[15%] w-[15%] h-[15%] bg-indigo-500/5 blur-[80px] rounded-full"></div>
        <div className="absolute inset-0 bg-grid opacity-[0.03]"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white p-10 md:p-14 shadow-[0_20px_50px_rgba(79,70,229,0.12)] relative overflow-hidden">
          
          {/* Header Accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
          
          {/* Business Logo Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-3xl mb-6 shadow-xl shadow-indigo-200 group-hover:scale-105 transition-transform duration-500 cursor-default">
              <ShieldCheck className="text-white" size={36} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 italic">
              FLEXY<span className="text-indigo-600">STORE</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
               <span className="h-[1px] w-6 bg-slate-200"></span>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Point de Vente Certifié</p>
               <span className="h-[1px] w-6 bg-slate-200"></span>
            </div>
          </div>

          {/* Alert Message */}
          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in shake duration-500">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none">
                    {error}
                  </p>
               </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                Identifiant Utilisateur
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 flex justify-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all uppercase font-bold text-xs tracking-widest placeholder:text-slate-300 shadow-sm"
                  placeholder="EX: ADMIN_01"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                Mot de Passe
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 flex justify-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all font-bold text-xs tracking-widest placeholder:text-slate-300 shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-slate-200 active:scale-[0.98] transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-[100%] transition-all duration-1000"></div>
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>Accéder au Système</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-12 pt-8 border-t border-slate-50 text-center flex flex-col items-center gap-4">
             <div className="flex items-center gap-6 opacity-20 group">
                <Zap size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                <Sparkles size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
             </div>
             <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em]">
               Powering Modern Retail <span className="text-slate-200 mx-2">|</span> FlexyStore V3.0
             </p>
          </div>
        </div>
      </div>

      {/* Version Tag */}
      <div className="fixed bottom-6 right-8 opacity-40">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Operational</span>
         </div>
      </div>
    </div>
  );
}
