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
  CheckCircle2
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
  const [form, setForm] = useState({ name: '', login: '', password: '', role: 'vendeur' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const res = await window.electronAPI.invoke('user:getAll');
    if (res.success) setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.login || !form.password) return notify('error', 'Champs requis', 'Veuillez remplir toutes les informations.');
    
    setIsSubmitting(true);
    const res = await window.electronAPI.invoke('user:create', form);
    if (res.success) {
      notify('success', 'Opérateur créé', `L'accès pour ${form.name} est maintenant actif.`);
      setForm({ name: '', login: '', password: '', role: 'vendeur' });
      loadUsers();
    } else {
      notify('error', 'Échec création', res.message || 'Une erreur est survenue.');
    }
    setIsSubmitting(false);
  };

  const handleDeactivate = async (id: number) => {
    if (confirm('Voulez-vous révoquer définitivement l\'accès de cet opérateur ?')) {
      const res = await window.electronAPI.invoke('user:deactivate', id);
      if (res.success) {
        notify('warning', 'Accès révoqué', 'L\'opérateur ne peut plus se connecter au système.');
        loadUsers();
      }
    }
  };

  return (
    <div className="space-y-16 pb-32 max-w-7xl mx-auto pt-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-8 border-[#1A1A1A] pb-12">
        <div>
          <div className="flex items-center gap-4 mb-4">
             <div className="p-4 bg-[#1A1A1A] text-white shadow-[8px_8px_0px_#FF5F1F]">
                <Settings size={32} />
             </div>
             <h1 className="text-6xl font-black tracking-tighter text-[#1A1A1A] uppercase italic">Personnel</h1>
          </div>
          <p className="text-3xl font-serif italic font-black text-[#1A1A1A] opacity-80 leading-tight">
             Contrôle des accès et habilitations de sécurité.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* FORMULAIRE (Gauche) */}
        <div className="lg:col-span-5 space-y-10 sticky top-10">
          <div className="flex items-center gap-4">
             <div className="h-1.5 w-12 bg-[#FF5F1F]"></div>
             <h2 className="text-xl font-black uppercase tracking-[0.4em] text-[#1A1A1A]">Nouvel Agent</h2>
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] p-10 shadow-[16px_16px_0px_#1A1A1A] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#1A1A1A]/5 -rotate-45 translate-x-12 -translate-y-12"></div>
            
            <form onSubmit={handleCreateUser} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/40 ml-1">Nom de l'Opérateur</label>
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 group-focus-within:text-[#FF5F1F]" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Samuel Eto'o"
                    className="w-full bg-[#FDFCF0] border-4 border-[#1A1A1A] p-4 pl-12 font-black placeholder:text-[#1A1A1A]/10 focus:shadow-[6px_6px_0px_#1A1A1A] outline-none transition-all uppercase"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/40 ml-1">Identifiant (Login)</label>
                <div className="relative group">
                  <Fingerprint size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 group-focus-within:text-[#FF5F1F]" />
                  <input
                    type="text"
                    required
                    placeholder="matricule"
                    className="w-full bg-[#FDFCF0] border-4 border-[#1A1A1A] p-4 pl-12 font-black placeholder:text-[#1A1A1A]/10 focus:shadow-[6px_6px_0px_#1A1A1A] outline-none transition-all"
                    value={form.login}
                    onChange={(e) => setForm({...form, login: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/40 ml-1">Clé d'accès (Password)</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 group-focus-within:text-[#FF5F1F]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#FDFCF0] border-4 border-[#1A1A1A] p-4 pl-12 font-black placeholder:text-[#1A1A1A]/10 focus:shadow-[6px_6px_0px_#1A1A1A] outline-none transition-all"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/40 ml-1">Rôle Système</label>
                <div className="grid grid-cols-2 gap-4">
                   <button 
                     type="button"
                     onClick={() => setForm({...form, role: 'vendeur'})}
                     className={`py-4 border-4 border-[#1A1A1A] font-black uppercase text-[10px] tracking-widest transition-all ${form.role === 'vendeur' ? 'bg-[#1A1A1A] text-white shadow-[6px_6px_0px_#FF5F1F]' : 'bg-white text-[#1A1A1A]'}`}
                   >
                     Vendeur
                   </button>
                   <button 
                     type="button"
                     onClick={() => setForm({...form, role: 'admin'})}
                     className={`py-4 border-4 border-[#1A1A1A] font-black uppercase text-[10px] tracking-widest transition-all ${form.role === 'admin' ? 'bg-[#1A1A1A] text-white shadow-[6px_6px_0px_#FF5F1F]' : 'bg-white text-[#1A1A1A]'}`}
                   >
                     Admin
                   </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1A1A1A] text-white py-6 border-4 border-[#1A1A1A] shadow-[10px_10px_0px_#FF5F1F] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-4 active:scale-95"
              >
                <UserPlus size={24} />
                <span className="text-xs font-black uppercase tracking-[0.4em]">Créer l'accès</span>
              </button>
            </form>
          </div>
        </div>

        {/* LISTE (Droite) */}
        <div className="lg:col-span-7 space-y-10">
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-black uppercase tracking-[0.4em] text-[#1A1A1A] shrink-0">Collaborateurs</h2>
             <div className="h-1.5 flex-1 bg-[#1A1A1A]"></div>
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] shadow-[20px_20px_0px_#1A1A1A] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-[#1A1A1A] text-white">
                  <tr>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.3em]">Agent</th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-center">Habilitation</th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-center">État</th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-[#1A1A1A]/10">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs">
                        Aucun collaborateur enregistré
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className={`group hover:bg-[#FDFCF0] transition-colors ${u.active === 0 ? 'opacity-40 grayscale' : ''}`}>
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-[#1A1A1A] text-white border-2 border-[#1A1A1A] flex items-center justify-center italic font-black shadow-[4px_4px_0px_#FF5F1F]">
                                {u.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <div className="text-sm font-black text-[#1A1A1A] uppercase tracking-tighter leading-tight">{u.name}</div>
                                <div className="text-[10px] font-mono text-[#1A1A1A]/40">ID: {u.login}</div>
                             </div>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-center">
                          <span className={`px-3 py-1 border-2 border-[#1A1A1A] text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-[#FF5F1F] text-white' : 'bg-[#1A1A1A] text-white'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-6 px-8 text-center">
                          <div className="flex flex-col items-center gap-1">
                             <div className={`w-2 h-2 rounded-full ${u.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-600'}`}></div>
                             <span className="text-[8px] font-black uppercase tracking-tighter">{u.active ? 'Actif' : 'Révoqué'}</span>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-right">
                          {u.active === 1 && u.login !== 'admin' && (
                            <button 
                              onClick={() => handleDeactivate(u.id)}
                              className="p-3 bg-white border-2 border-[#1A1A1A] text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-[3px_3px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                              <UserX size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="p-8 bg-[#1A1A1A] text-white border-4 border-[#1A1A1A] flex items-center gap-6">
             <ShieldCheck size={32} className="text-[#FF5F1F]" />
             <div>
                <div className="text-xs font-black uppercase tracking-[0.3em]">Protection Active</div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mt-1 italic">Tous les accès sont tracés dans le journal de sécurité.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
