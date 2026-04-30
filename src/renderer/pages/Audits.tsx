import { useState, useEffect } from "react";
import { ShieldAlert, Search, ShieldCheck, Activity, CalendarClock, ArrowUp, ArrowDown, XOctagon, Wrench, PlusCircle, PencilLine, Undo } from "lucide-react";
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
                const response = await window.electronAPI.invoke<any[]>("audit:getAll", 300);
                if (response.success) {
                    setLogs(response.data || []);
                } else {
                    notify("error", "Erreur de chargement", response.message || "Erreur inconnue");
                }
            }
        } catch (err: any) {
            notify("error", "Erreur", err.message);
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
        // Check all relevant fields for the search term
        return action.toLowerCase().includes(term) ||
            name.toLowerCase().includes(term) ||
            entity.toLowerCase().includes(term) ||
            reason.toLowerCase().includes(term) ||
            (log.newValue && typeof log.newValue === 'string' && log.newValue.toLowerCase().includes(term)) ||
            (log.oldValue && typeof log.oldValue === 'string' && log.oldValue.toLowerCase().includes(term));
    });

    const getLogIcon = (type: string, action: string) => {
        if (type === "user") {
            return <Activity size={18} className="text-blue-500" />;
        }
        if (type === "price") {
            return <ShieldAlert size={18} className="text-amber-500" />;
        }
        // Stock movements
        if (action === "STOCK_IN") {
            return <ArrowUp size={18} className="text-emerald-500" />;
        }
        if (action === "STOCK_OUT") {
            return <ArrowDown size={18} className="text-red-500" />;
        }
        // Defective reporting
        if (action === "REPORT_DEFECTIVE") {
            return <XOctagon size={18} className="text-red-500" />;
        }
        // Repair actions
        if (action.startsWith("MARK_REPAIRED") || action.startsWith("MARK_UNIT_REPAIRED") || action.startsWith("MARK_QUANTITY_REPAIRED") || action === "STOCK_INCREMENT_REPAIR") {
            return <Wrench size={18} className="text-indigo-500" />;
        }
        // Standard actions
        if (action === "DELETE" || action === "CANCEL") {
            return <ShieldAlert size={18} className="text-red-500" />;
        }
        if (action === "CREATE") {
            return <PlusCircle size={18} className="text-emerald-500" />;
        }
        if (action === "UPDATE") {
            return <PencilLine size={18} className="text-indigo-500" />;
        }
        if (action === "RESTORE") {
            return <Undo size={18} className="text-cyan-500" />;
        }
        return <ShieldCheck size={18} className="text-emerald-500" />; // Default icon
    };

    const getLogBadge = (type: string, action: string) => {
        let bg = "bg-slate-100";
        let text = "text-slate-600";
        let label = action || type;

        if (type === "user") {
            bg = "bg-blue-50"; text = "text-blue-600"; label = action;
        } else if (type === "price") {
            bg = "bg-amber-50"; text = "text-amber-600"; label = "REMISE EXCEPTIONNELLE";
        } else {
            // Stock movements
            if (action === "STOCK_IN") {
                bg = "bg-emerald-50"; text = "text-emerald-600"; label = "STOCK ENTRANT";
            } else if (action === "STOCK_OUT") {
                bg = "bg-red-50"; text = "text-red-600"; label = "STOCK SORTANT";
            }
            // Defective reporting
            else if (action === "REPORT_DEFECTIVE") {
                bg = "bg-red-100"; text = "text-red-700"; label = "SIGNALÉ DÉFECTUEUX";
            }
            // Repair actions
            else if (action.startsWith("MARK_REPAIRED") || action.startsWith("MARK_UNIT_REPAIRED") || action.startsWith("MARK_QUANTITY_REPAIRED") || action === "STOCK_INCREMENT_REPAIR") {
                bg = "bg-indigo-50"; text = "text-indigo-600"; label = "RÉPARÉ / RESTAURÉ";
            }
            // Standard actions
            else if (action === "CREATE") { bg = "bg-emerald-50"; text = "text-emerald-600"; }
            else if (action === "UPDATE") { bg = "bg-indigo-50"; text = "text-indigo-600"; }
            else if (action === "DELETE" || action === "CANCEL") { bg = "bg-red-50"; text = "text-red-600"; }
            else if (action === "RESTORE") { bg = "bg-cyan-50"; text = "text-cyan-600"; }
            else { // Default for generic audit logs if not covered above
                bg = "bg-slate-100"; text = "text-slate-600"; label = action;
            }
        }

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${bg} ${text}`}>
                {label}
            </span>
        );
    };
const formatFieldName = (field: string): string => {
    const translations: Record<string, string> = {
        brand: "Marque",
        model: "Modèle",
        category: "Catégorie",
        state: "État",
        purchase_price: "Prix d'achat",
        sale_price: "Prix de vente",
        min_sale_price: "Prix de vente minimum",
        stock: "Stock",
        min_stock: "Stock minimum",
        cpu: "Processeur",
        ram: "Mémoire RAM",
        gpu: "Carte graphique",
        storage: "Stockage",
        entry_date: "Date d'entrée",
        login: "Identifiant",
        name: "Nom",
        hash: "Mot de passe",
        role: "Rôle",
        active: "Actif",
        commission_percent: "Pourcentage de commission",
        phone: "Téléphone",
        email: "Email",
        address: "Adresse",
        total_amount: "Montant total",
        date: "Date",
    };
    return translations[field] || field;
};

const formatMessage = (log: any) => {
    // Specific formatting for price audit logs
    if (log.log_type === "price") {
        return `Baisse de prix sur produit (Raison: ${log.reason || 'Non spécifiée'}) : ${log.original_price || '—'} CFA → ${log.modified_price || '—'} CFA`;
    }
    // Specific formatting for user logs (generic message for now)
    if (log.log_type === "user") {
        return "Interaction système ou connexion utilisateur";
    }

    let message = "Action enregistrée"; // Default message

    try {
        const newValue = log.new_value ? JSON.parse(log.new_value) : null;
        const oldValue = log.old_value ? JSON.parse(log.old_value) : null;

        // Handle different actions and entities
        if (log.action === "STOCK_IN") {
            message = `✓ Entrée en stock: Produit #${newValue?.productId || log.entity_id} | Quantité: ${newValue?.quantity} | Note: ${newValue?.note || '—'}`;
        } else if (log.action === "STOCK_OUT") {
            message = `✗ Sortie de stock: Produit #${newValue?.productId || log.entity_id} | Quantité: ${newValue?.quantity} | Note: ${newValue?.note || '—'}`;
        } else if (log.action === "REPORT_DEFECTIVE") {
            message = `⚠ Produit #${newValue?.productId || log.entity_id} signalé défectueux | Quantité: ${newValue?.quantity} | Note: ${newValue?.note || '—'}`;
        } else if (log.action === "MARK_UNIT_REPAIRED") {
            message = `🔧 Unité #${newValue?.unitId || log.entity_id} réparée | Produit #${newValue?.productId} | État: ${newValue?.previousStatus} → ${newValue?.newStatus}`;
        } else if (log.action === "MARK_QUANTITY_REPAIRED") {
            message = `🔧 Lot de ${newValue?.quantity} unité(s) réparé(es) | Produit #${newValue?.productId} | ${newValue?.unitsDeleted?.length || 0} unité(s) défectueuse(s) supprimée(s)`;
        } else if (log.action === "STOCK_INCREMENT_REPAIR") {
            message = `📈 Stock produit #${newValue?.productId || log.entity_id} augmenté de ${newValue?.quantityIncremented} | Raison: ${newValue?.reason || 'Réparation'}`;
        } else if (log.action === "UPDATE" && log.entity === "products") {
            if (oldValue && newValue) {
                let changes = [];
                const ignoredFields = ["_user_id"];
                for (const key in newValue) {
                    if (newValue.hasOwnProperty(key) && !ignoredFields.includes(key) && oldValue.hasOwnProperty(key) && newValue[key] !== oldValue[key]) {
                        changes.push(`${formatFieldName(key)}: ${oldValue[key]} → ${newValue[key]}`);
                    }
                }
                for (const key in oldValue) {
                    if (oldValue.hasOwnProperty(key) && !ignoredFields.includes(key) && !newValue.hasOwnProperty(key)) {
                        changes.push(`${formatFieldName(key)}: ${oldValue[key]} → SUPPRIMÉ`);
                    }
                }
                message = changes.length > 0
                    ? `Produit #${log.entity_id} modifié | ${changes.join(" | ")}`
                    : `Produit #${log.entity_id} modifié (aucun changement détecté)`;
            } else if (newValue && !oldValue) {
                message = `Produit #${log.entity_id} mis à jour avec de nouvelles informations`;
            } else {
                message = `Produit #${log.entity_id} modifié`;
            }
        } else if (log.entity === "products" && log.action === "CREATE") {
            if (newValue && newValue.model) message = `✨ Nouveau produit: ${newValue.brand} ${newValue.model} (ID: #${log.entity_id})`;
            else if (newValue && newValue.brand) message = `✨ Nouveau produit: ${newValue.brand} (ID: #${log.entity_id})`;
            else message = `✨ Nouveau produit créé (ID: #${log.entity_id})`;
        } else if (log.entity === "purchases" && log.action === "CREATE") {
            message = `📦 Nouvel achat créé (ID: #${log.entity_id})`;
        } else if (log.entity === "customers" && log.action === "CREATE") {
            if (newValue && newValue.name) message = `👤 Nouveau client: ${newValue.name}`;
            else message = `👤 Nouveau client créé (ID: #${log.entity_id})`;
        } else if (log.entity === "customers" && log.action === "UPDATE") {
            if (newValue && newValue.name) message = `👤 Client modifié: ${newValue.name}`;
            else message = `👤 Client #${log.entity_id} modifié`;
        } else if (log.entity === "customers" && log.action === "DELETE") {
            message = `👤 Client #${log.entity_id} supprimé`;
        } else if (log.entity === "users" && log.action === "CREATE") {
            if (newValue && newValue.name) message = `👥 Nouvel utilisateur: ${newValue.name} (Rôle: ${newValue.role || 'vendeur'})`;
            else message = `👥 Nouvel utilisateur créé (ID: #${log.entity_id})`;
        } else if (log.entity === "users" && log.action === "DEACTIVATE") {
            message = `🚫 Compte utilisateur #${log.entity_id} désactivé`;
        } else if (log.action === "DELETE" && log.entity === "products") {
            message = `🗑 Produit #${log.entity_id} marqué comme supprimé`;
        } else if (log.action === "RESTORE" && log.entity === "products") {
            message = `↩ Produit #${log.entity_id} restauré`;
        } else if (log.action === "CANCEL" && log.entity === "sales") {
            message = `❌ Vente #${log.entity_id} annulée`;
        }
        // Add more specific formatting for other entities/actions as needed
    } catch (e) {
        // Fallback for unparseable JSON or if new_value is not JSON
        console.error("Failed to parse log new_value or apply specific formatting:", e);
        if (log.new_value && typeof log.new_value === 'string') {
            message = log.new_value.length > 100 ? log.new_value.substring(0, 100) + "..." : log.new_value;
        } else if (log.action) {
            message = `Action: ${log.action}`;
        }
    }
    return message;
};

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Journal d'Audit</h1>
                    <p className="text-sm text-ink-500 mt-1">
                        Traçabilité complète des actions critiques et de la sécurité du système.
                    </p>
                </div>
            </div>

            <div className="card">
                <div className="p-4 border-b border-surface-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher par utilisateur, action ou raison..."
                            className="input-field pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-ink-400">
                            <ShieldCheck size={40} className="mb-2 opacity-50" />
                            <p>Aucun journal d'audit trouvé.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-50/50 border-b border-surface-200 text-xs font-semibold text-ink-500 uppercase tracking-wider">
                                    <th className="py-3 px-4 w-12 text-center"></th>
                                    <th className="py-3 px-4">Date & Heure</th>
                                    <th className="py-3 px-4">Utilisateur</th>
                                    <th className="py-3 px-4">Type / Entité</th>
                                    <th className="py-3 px-4">Action</th>
                                    <th className="py-3 px-4">Détails de l'événement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-200">
                                {filteredLogs.map((log, index) => (
                                    <tr key={index} className="hover:bg-surface-50/30 transition-colors">
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex justify-center">
                                                {getLogIcon(log.log_type, log.action)}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2 text-sm text-ink-700 whitespace-nowrap">
                                                <CalendarClock size={14} className="text-ink-400" />
                                                {new Date(log.timestamp).toLocaleString("fr-FR")}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-medium text-ink-900 text-sm">{log.user_name || "Système ou Inconnu"}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm font-medium text-ink-600 capitalize">
                                                {log.entity || log.log_type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {getLogBadge(log.log_type, log.action)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-ink-600 whitespace-normal" title={formatMessage(log)}>
                                            {formatMessage(log)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
