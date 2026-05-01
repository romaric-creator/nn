import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Search, 
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
  Database
} from "lucide-react";
import { useNotify } from "../components/NotificationProvider";

export default function Audits() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
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
        
        const matchesTerm = action.toLowerCase().includes(term) ||
            name.toLowerCase().includes(term) ||
            entity.toLowerCase().includes(term) ||
            reason.toLowerCase().includes(term);
            
        const matchesDate = dateFilter ? (log.timestamp && log.timestamp.substring(0, 10) === dateFilter) : true;

        return matchesTerm && matchesDate;
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
            cpu: "Processeur",
            ram: "Mémoire vive",
            gpu: "Carte graphique",
            storage: "Stockage",
            entry_date: "Date d'entrée",
        };
        return translations[field] || field;
    };

    const formatValue = (field: string, value: any): string => {
        if (value === null || value === undefined) return "—";
        if (field === "active") return value ? "Actif" : "Inactif";
        if (field === "purchase_price" || field === "sale_price" || field === "min_sale_price") {
            return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value);
        }
        return String(value);
    };

    const formatMessage = (log: any) => {
        if (log.log_type === "price") {
            return `Ajustement tarifaire manuel : ${log.original_price?.toLocaleString()} → ${log.modified_price?.toLocaleString()} CFA (Raison: ${log.reason || 'N/A'})`;
        }

        try {
            const newValue = log.new_value ? JSON.parse(log.new_value) : null;
            const oldValue = log.old_value ? JSON.parse(log.old_value) : null;
            const target = log.target_name || "l'entité";

            if (log.action === "STOCK_IN") {
                const qty = newValue?.quantity || 0;
                const note = newValue?.note ? ` | Note : ${newValue.note}` : "";
                return `Réapprovisionnement de ${qty} unité(s) pour "${target}"${note}.`;
            }

            if (log.action === "STOCK_OUT") {
                const qty = newValue?.quantity || 0;
                const note = newValue?.note ? ` | Motif : ${newValue.note}` : "";
                return `Retrait de ${qty} unité(s) du stock pour "${target}"${note}.`;
            }

            if (log.action === "REPORT_DEFECTIVE") {
                return `Signalement de ${newValue?.quantity} unité(s) comme défectueuse(s) pour "${target}".`;
            }

            if (log.action === "MARK_UNIT_REPAIRED") {
                return `L'unité #${newValue?.unitId} de "${target}" a été remise en stock après réparation.`;
            }
            
            if (log.action === "UPDATE") {
                if (oldValue && newValue) {
                    let changes = [];
                    for (const key in newValue) {
                        // Skip system fields and fields that haven't changed
                        if (["id", "_user_id", "created_at", "updated_at", "is_deleted"].includes(key)) continue;
                        
                        if (newValue[key] !== oldValue[key]) {
                            changes.push(`${formatFieldName(key)} : ${formatValue(key, oldValue[key])} ➔ ${formatValue(key, newValue[key])}`);
                        }
                    }
                     return changes.length > 0 
                         ? `Modification de "${target}" : ${changes.join(" | ")}` 
                         : `Mise à jour des paramètres de "${target}" (sans changement de valeur)`;
                }
                return `Mise à jour effectuée sur "${target}".`;
            }

            if (log.action === "CREATE") {
                const type = log.entity === 'products' ? 'produit' : log.entity === 'customers' ? 'client' : 'élément';
                return `Création du nouveau ${type} "${target}" dans le système.`;
            }

            if (log.action === "CANCEL") {
                return `ANNULATION CRITIQUE : La transaction ${target} a été annulée et les stocks ont été restaurés.`;
            }

            if (log.action === "CHECKOUT") {
                const total = newValue?.total ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(newValue.total) : "0 CFA";
                const itemCount = newValue?.items?.length || 0;
                return `Vente réalisée (${total}). ${itemCount} article(s) facturé(s).`;
            }

            if (log.log_type === "user") {
                if (log.action === "LOGIN") return `Connexion de l'utilisateur "${log.user_name}" au système.`;
                if (log.action === "LOGOUT") return `Déconnexion de l'utilisateur "${log.user_name}".`;
                return `Action utilisateur : ${log.action}`;
            }
            
            return log.new_value ? (typeof log.new_value === 'string' ? log.new_value.substring(0, 120) : "Action système sur " + target) : `Événement d'audit sur ${target}`;
        } catch (e) {
            return "Traitement de l'événement système : " + (log.action || "Inconnu");
        }
    };

    return (
        <div className="animate-in fade-in duration-700 space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                         <Shield className="text-indigo-600" size={28} />
                      </div>
                      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Audit Système</h1>
                   </div>
                   <p className="text-slate-500 text-sm ml-1">Journalisation des accès et modifications</p>
                </div>

                <div className="flex items-center gap-4">
                   <div className="bg-white px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-200 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Enregistrement Actif</span>
                   </div>
                   <button 
                     onClick={fetchLogs}
                     className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm group"
                   >
                      <RotateCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
                   </button>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2">
               <div className="relative group flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Rechercher par action, utilisateur ou entité..."
                    className="w-full bg-transparent border-none py-3 pl-12 pr-4 text-sm font-medium placeholder:text-slate-400 outline-none focus:ring-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 flex items-center px-4">
                  <input 
                     type="date"
                     className="bg-transparent border-none text-[11px] font-black uppercase text-slate-700 outline-none"
                     value={dateFilter}
                     onChange={(e) => setDateFilter(e.target.value)}
                  />
               </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
               {loading ? (
                  <div className="p-32 flex flex-col items-center justify-center animate-pulse">
                     <Fingerprint size={48} className="text-indigo-100 mb-4" />
                     <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Chargement des événements...</p>
                  </div>
               ) : (
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Heure</th>
                              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Utilisateur</th>
                              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Type d'Action</th>
                              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Cible</th>
                              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Détails de l'événement</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {filteredLogs.map((log, index) => {
                              const config = getLogConfig(log.log_type, log.action);
                              return (
                                 <tr key={index} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-6">
                                       <div className="flex items-center gap-3">
                                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                             <CalendarClock size={16} />
                                          </div>
                                          <div>
                                             <p className="text-sm font-bold text-slate-900">
                                                {new Date(log.timestamp).toLocaleDateString("fr-FR")}
                                             </p>
                                             <p className="text-xs font-medium text-slate-500">
                                                {new Date(log.timestamp).toLocaleTimeString("fr-FR")}
                                             </p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-4 px-6">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-sm text-indigo-600">
                                             {(log.user_name || "S").charAt(0).toUpperCase()}
                                          </div>
                                          <span className="font-semibold text-slate-800 text-sm">{log.user_name || "Système"}</span>
                                       </div>
                                    </td>
                                    <td className="py-4 px-6">
                                       <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-${config.color}-200 bg-${config.color}-50 text-${config.color}-700`}>
                                          <config.icon size={14} strokeWidth={2.5} />
                                          <span className="text-xs font-bold uppercase tracking-wide">{config.label}</span>
                                       </div>
                                    </td>
                                    <td className="py-4 px-6">
                                       <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                          <Database size={14} className="text-slate-400" />
                                          <span>{log.entity || log.log_type}</span>
                                       </div>
                                    </td>
                                    <td className="py-4 px-6">
                                       <div className="flex items-center justify-between gap-4">
                                          <p className="text-sm text-slate-700 leading-relaxed max-w-xl break-words whitespace-pre-wrap">
                                             {formatMessage(log)}
                                          </p>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                     
                     {filteredLogs.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                           <div className="p-6 bg-slate-50 rounded-full mb-4">
                              <ShieldAlert size={40} className="text-slate-300" />
                           </div>
                           <h4 className="text-slate-900 font-bold text-lg mb-1">Aucun événement</h4>
                           <p className="text-slate-500 text-sm">Aucun log trouvé correspondant à ces critères.</p>
                        </div>
                     )}
                  </div>
               )}

               {/* Table Footer */}
               <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{filteredLogs.length} Entrées</span>
               </div>
            </div>
        </div>
    );
}
