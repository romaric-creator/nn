import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  UserX,
  Settings,
  Lock,
  ArrowRight,
  User,
  Fingerprint,
  Activity,
  ShieldCheck,
  CheckCircle2,
  MoreVertical,
  ChevronRight,
  Plus,
  Key,
  BadgeCheck
} from 'lucide-react';
import { useNotify } from '../components/NotificationProvider';

type UserAccount = {
  id: number;
  name: string;
  login: string;
  role: 'admin' | 'vendeur';
  active: number;
};

export default function UsersPage() {
  const { notify } = useNotify();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', login: '', password: '', role: 'vendeur' as 'admin' | 'vendeur' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res: any = await window.electronAPI.invoke('user:getAll');
      if (res.success) setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.login || !form.password) return notify('error', 'Champs requis', 'Veuillez remplir toutes les informations.');
    
    setIsSubmitting(true);
    try {
      const res: any = await window.electronAPI.invoke('user:create', form);
      if (res.success) {
        notify('success', 'Opérateur créé', `L'accès pour ${form.name} est maintenant actif.`);
        setForm({ name: '', login: '', password: '', role: 'vendeur' });
        loadUsers();
      } else {
        notify('error', 'Échec création', res.message || 'Une erreur est survenue.');
      }
    } catch (error) {
      console.error(error);
    }
    setIsSubmitting(false);
  };

  const handleDeactivate = async (id: number) => {
    if (confirm('Voulez-vous révoquer définitivement l\'accès de cet opérateur ?')) {
      try {
        const res: any = await window.electronAPI.invoke('user:deactivate', id);
        if (res.success) {
          notify('warning', 'Accès révoqué', 'L\'opérateur ne peut plus se connecter au système.');
          loadUsers();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div className="p-10 bg-white rounded-[3rem] shadow-xl">
           <Settings size={48} className="text-indigo-200 mb-6 mx-auto" />
           <p className="text-slate-400 font-bold tracking-tight">Configuration des privilèges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 rotate-3">
                 <Settings className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Gestion d'Équipe</h1>
           </div>
           <p className="text-slate-500 font-medium ml-1">Administrez les comptes utilisateurs et les droits d'accès</p>
        </div>

        <div className="px-6 py-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center gap-4">
           <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
             <BadgeCheck size={18} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Session</p>
              <p className="text-xs font-black text-slate-900">Privilèges Administrateur</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        {/* Registration Form Column */}
        <div className="xl:col-span-4 space-y-8 sticky top-10">
          <div className="flex items-center gap-2 px-2">
             <Plus size={16} className="text-indigo-500" />
             <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Nouvelle Habilitation</h2>
          </div>

          <div className="glass-card p-10 rounded-[3rem] border-slate-200/60 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16"></div>
            
            <form onSubmit={handleCreateUser} className="space-y-8 relative z-10">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3 ml-1">Nom Complet</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="Ex: David Mensah"
                      className="premium-input pl-12 uppercase"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3 ml-1">Identifiant Système</label>
                  <div className="relative group">
                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="Identifiant de connexion"
                      className="premium-input pl-12"
                      value={form.login}
                      onChange={(e) => setForm({...form, login: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3 ml-1">Mot De Passe Protegé</label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      className="premium-input pl-12"
                      value={form.password}
                      onChange={(e) => setForm({...form, password: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3 ml-1">Niveau d'Autorité</label>
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50">
                     <button 
                       type="button"
                       onClick={() => setForm({...form, role: 'vendeur'})}
                       className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${form.role === 'vendeur' ? 'bg-white text-slate-900 shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       Vendeur
                     </button>
                     <button 
                       type="button"
                       onClick={() => setForm({...form, role: 'admin'})}
                       className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${form.role === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       Admin
                     </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="premium-btn-primary w-full py-5 group"
              >
                <span>Activer l'Accès</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>

        {/* Users List Column */}
        <div className="xl:col-span-8 space-y-8">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
                <Users size={16} /> Liste des Collaborateurs Active
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                {users.length} Opérateurs enregistrés
              </span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {users.length === 0 ? (
               <div className="col-span-full py-32 bg-white rounded-[3.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-30">
                  <Users size={48} className="mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs">Aucun agent configuré</p>
               </div>
             ) : (
               users.map(u => (
                 <div 
                   key={u.id} 
                   className={`p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm flex flex-col group transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-600/5 hover:-translate-y-1 relative overflow-hidden ${u.active === 0 ? 'opacity-50 grayscale contrast-75' : ''}`}
                 >
                    {/* Header: Identity & Status */}
                    <div className="flex items-start justify-between mb-8">
                       <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl italic shadow-lg ${u.role === 'admin' ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                             <h3 className="font-black text-slate-900 tracking-tight leading-none mb-1.5 uppercase italic">{u.name}</h3>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">ID: {u.login}</p>
                          </div>
                       </div>
                       
                       <div className="flex flex-col items-center gap-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${u.active ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500'}`}></div>
                          <span className="text-[8px] font-black uppercase text-slate-400">{u.active ? 'En Ligne' : 'Bloqué'}</span>
                       </div>
                    </div>

                    {/* Role & Privileges */}
                    <div className="flex-1 space-y-6">
                       <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                             <ShieldCheck size={14} className={u.role === 'admin' ? "text-indigo-600" : "text-slate-400"} />
                             <span className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? "text-indigo-600" : "text-slate-500"}`}>
                               Habilitation: {u.role === 'admin' ? "Full Administrator" : "Limited Seller Account"}
                             </span>
                          </div>
                       </div>
                       
                       <div className="h-px bg-slate-50 w-full"></div>
                       
                       {/* Footer: Actions */}
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                <Activity size={14} />
                             </div>
                             <span className="text-[9px] font-bold text-slate-400 uppercase">Activité tracée</span>
                          </div>
                          
                          {u.active === 1 && u.login !== 'admin' && (
                            <button 
                              onClick={() => handleDeactivate(u.id)}
                              className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              title="Révoquer l'accès"
                            >
                              <UserX size={18} />
                            </button>
                          )}
                       </div>
                    </div>
                 </div>
               ))
             )}
           </div>
           
           {/* System Information Box */}
           <div className="p-8 bg-slate-900 rounded-[3rem] shadow-2xl shadow-indigo-600/10 flex items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16"></div>
              <div className="p-4 bg-white/5 rounded-[2rem] border border-white/5 relative z-10">
                 <Shield className="text-indigo-400" size={32} />
              </div>
              <div className="relative z-10">
                 <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-1 italic">Vérification d'accès cryptographique</h4>
                 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                   Tous les mots de passe sont hachés via Argon2ID avant stockage local. <br />
                   La révocation prend effet instantanément sur toutes les sessions actives.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
