import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Search, 
  ShieldCheck, 
  Activity, 
  CalendarClock, 
  ArrowUp, 
  ArrowDown, 
  XOctagon, 
  Wrench, 
  PlusCircle, 
  PencilLine, 
  Undo,
  Fingerprint,
  RotateCcw,
  Shield,
  Eye,
  Archive,
  AlertTriangle,
  ChevronRight,
  Database
} from "lucide-react";
import { useNotify } from "../components/NotificationProvider";

export default function Audits() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { notify } = useNotify();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            if (window.electronAPI) {
                const response: any = await window.electronAPI.invoke("audit:getLogs", 300);
                if (response.success) {
                    setLogs(response.data || []);
                } else {
                    notify("error", "Échec de synchronisation", response.message || "Impossible d'accéder aux journaux");
                }
            }
        } catch (err: any) {
            notify("error", "Violation de flux", err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const term = searchTerm.toLowerCase();
        const action = log.action || "";
        const name = log.user_name || "Système";
        const entity = log.entity || "";
        const reason = log.reason || "";
        return action.toLowerCase().includes(term) ||
            name.toLowerCase().includes(term) ||
            entity.toLowerCase().includes(term) ||
            reason.toLowerCase().includes(term);
    });

    const getLogConfig = (type: string, action: string) => {
        // Default
        let config = { icon: Shield, color: "slate", label: action || type };

        if (type === "user") {
            config = { icon: Activity, color: "indigo", label: action };
        } else if (type === "price") {
            config = { icon: ShieldAlert, color: "amber", label: "REMISE EXCEPTIONNELLE" };
        } else if (action === "STOCK_IN") {
            config = { icon: ArrowUp, color: "emerald", label: "ENTRÉE STOCK" };
        } else if (action === "STOCK_OUT") {
            config = { icon: ArrowDown, color: "rose", label: "SORTIE STOCK" };
        } else if (action === "REPORT_DEFECTIVE") {
            config = { icon: XOctagon, color: "rose", label: "UNITÉ HS" };
        } else if (action.startsWith("MARK_REPAIRED") || action.startsWith("MARK_UNIT_REPAIRED") || action === "STOCK_INCREMENT_REPAIR") {
            config = { icon: Wrench, color: "indigo", label: "RÉPARATION" };
        } else if (action === "UPDATE") {
            config = { icon: PencilLine, color: "sky", label: "MODIFICATION" };
        } else if (action === "CREATE") {
            config = { icon: PlusCircle, color: "emerald", label: "CRÉATION" };
        } else if (action === "DELETE" || action === "CANCEL") {
            config = { icon: ShieldAlert, color: "rose", label: "ANNULATION" };
        } else if (action === "RESTORE") {
            config = { icon: Undo, color: "sky", label: "RESTAURATION" };
        }

        return config;
    };

    const formatFieldName = (field: string): string => {
        const translations: Record<string, string> = {
            brand: "Marque",
            model: "Modèle",
            category: "Catégorie",
            state: "État",
            purchase_price: "Prix d'achat",
            sale_price: "Prix de vente",
            min_sale_price: "Prix de vente min",
            stock: "Stock",
            min_stock: "Seuil stock",
            phone: "Téléphone",
            name: "Nom",
            role: "Rôle",
            active: "Statut",
        };
        return translations[field] || field;
    };

    const formatMessage = (log: any) => {
        if (log.log_type === "price") {
            return `Ajustement tarifaire manuel : ${log.original_price?.toLocaleString()} → ${log.modified_price?.toLocaleString()} CFA (Raison: ${log.reason || 'N/A'})`;
        }

        try {
            const newValue = log.new_value ? JSON.parse(log.new_value) : null;
            const oldValue = log.old_value ? JSON.parse(log.old_value) : null;

            if (log.action === "STOCK_IN") return `Réception de ${newValue?.quantity} unités | Note: ${newValue?.note || '—'}`;
            if (log.action === "STOCK_OUT") return `Sortie forcée de ${newValue?.quantity} unités | Motif: ${newValue?.note || '—'}`;
            if (log.action === "REPORT_DEFECTIVE") return `Mise au rebut de ${newValue?.quantity} unités défectueuses`;
            if (log.action === "MARK_UNIT_REPAIRED") return `Unité #${newValue?.unitId} remise en état fonctionnel`;
            
            if (log.action === "UPDATE" && oldValue && newValue) {
                let changes = [];
                for (const key in newValue) {
                    if (newValue[key] !== oldValue[key]) {
                        changes.push(`${formatFieldName(key)}: ${oldValue[key]} ➔ ${newValue[key]}`);
                    }
                }
                return changes.length > 0 ? changes.join(" | ") : "Mise à jour des métadonnées";
            }

            if (log.action === "CREATE") return `Enregistrement initial : ${newValue?.name || newValue?.model || 'Entité ID ' + log.entity_id}`;
            if (log.action === "CANCEL") return `Révocation de la transaction #${log.entity_id}`;
            
            return log.new_value ? (typeof log.new_value === 'string' ? log.new_value.substring(0, 80) : "Action système") : "Événement d'audit";
        } catch {
            return "Traitement de l'événement système";
        }
    };

    return (
        <div className="animate-in fade-in duration-700 space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                   <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-slate-900 rounded-xl shadow-2xl shadow-indigo-500/20 rotate-3 border border-slate-800">
                         <Shield className="text-indigo-400" size={24} />
                      </div>
                      <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Audit de Sécurité</h1>
                   </div>
                   <p className="text-slate-500 font-medium ml-1">Surveillance cryptographique des événements système</p>
                </div>

                <div className="flex items-center gap-4">
                   <div className="glass-card px-6 py-3 rounded-2xl flex items-center gap-3 border-indigo-100/50">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Système Intègre</span>
                   </div>
                   <button 
                     onClick={fetchLogs}
                     className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm group"
                   >
                      <RotateCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
                   </button>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="glass-card p-6 rounded-[2.5rem] border-slate-200/60 shadow-xl shadow-slate-200/40">
               <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Filtrer par identifiant, action ou entité spécifique..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 transition-all focus:ring-4 focus:ring-indigo-500/5 shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
               {loading ? (
                  <div className="p-40 flex flex-col items-center justify-center animate-pulse">
                     <Fingerprint size={64} className="text-indigo-100 mb-6" />
                     <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Authentification des flux...</p>
                  </div>
               ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-slate-900 text-white">
                              <th className="py-7 px-10 text-[9px] font-black uppercase tracking-[0.25em]">Estampille</th>
                              <th className="py-7 px-6 text-[9px] font-black uppercase tracking-[0.25em]">Opérateur</th>
                              <th className="py-7 px-6 text-[9px] font-black uppercase tracking-[0.25em]">Signalement</th>
                              <th className="py-7 px-6 text-[9px] font-black uppercase tracking-[0.25em]">Entité</th>
                              <th className="py-7 px-10 text-[9px] font-black uppercase tracking-[0.25em]">Transcription de l'événement</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {filteredLogs.map((log, index) => {
                              const config = getLogConfig(log.log_type, log.action);
                              return (
                                 <tr key={index} className="group hover:bg-slate-50/80 transition-all">
                                    <td className="py-6 px-10">
                                       <div className="flex items-center gap-3">
                                          <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                                             <CalendarClock size={16} className="text-slate-500" />
                                          </div>
                                          <div className="min-w-0">
                                             <p className="text-[10px] font-black text-slate-900 leading-none mb-1">
                                                {new Date(log.timestamp).toLocaleDateString("fr-FR")}
                                             </p>
                                             <p className="text-[10px] font-bold text-slate-400 font-mono italic">
                                                {new Date(log.timestamp).toLocaleTimeString("fr-FR")}
                                             </p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-6 px-6">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                             {(log.user_name || "S").charAt(0).toUpperCase()}
                                          </div>
                                          <span className="font-extrabold text-slate-700 text-xs uppercase tracking-tight">{log.user_name || "Système"}</span>
                                       </div>
                                    </td>
                                    <td className="py-6 px-6">
                                       <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-${config.color}-100 bg-${config.color}-50 text-${config.color}-600`}>
                                          <config.icon size={14} strokeWidth={3} />
                                          <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
                                       </div>
                                    </td>
                                    <td className="py-6 px-6">
                                       <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                          <Database size={10} />
                                          <span>{log.entity || log.log_type}</span>
                                       </div>
                                    </td>
                                    <td className="py-6 px-10">
                                       <div className="flex items-center justify-between gap-4">
                                          <p className="text-xs font-bold text-slate-600 leading-relaxed italic truncate max-w-md" title={formatMessage(log)}>
                                             {formatMessage(log)}
                                          </p>
                                          <button className="p-2 text-slate-200 hover:text-indigo-400 transition-colors">
                                             <Eye size={16} />
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                     
                     {filteredLogs.length === 0 && (
                        <div className="py-32 flex flex-col items-center justify-center text-center">
                           <div className="p-8 bg-slate-50 rounded-full mb-6">
                              <ShieldAlert size={48} className="text-slate-200" />
                           </div>
                           <h4 className="text-slate-900 font-black text-lg mb-1 tracking-tight italic">Journal Vierge</h4>
                           <p className="text-slate-400 font-medium text-xs tracking-widest uppercase">Aucun événement ne correspond aux paramètres</p>
                        </div>
                     )}
                  </div>
               )}

               {/* Table Footer */}
               <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredLogs.length} Entrées affichées</span>
                     <div className="h-4 w-px bg-slate-200"></div>
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Temps réel actif</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all opacity-50"><ChevronRight size={16} className="rotate-180" /></button>
                     <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><ChevronRight size={16} /></button>
                  </div>
               </div>
            </div>
        </div>
    );
}
