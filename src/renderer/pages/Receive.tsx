import React, { useState, useRef } from "react";
import {
  DatabaseBackup,
  Trash2,
  HardDriveDownload,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Zap,
  CloudUpload,
  Database,
  History,
  ShieldCheck,
  ChevronRight,
  FileText,
  Upload,
} from "lucide-react";
import { useNotify } from "../components/NotificationProvider";

interface ResultItem {
  id: string | number;
  note: string;
}

export default function Receive() {
  const { notify } = useNotify();
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target && typeof ev.target.result === "string") {
        setFileData(ev.target.result);
      }
    };
    reader.readAsText(f);
  };

  const handleImportCSV = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!fileData) throw new Error("Aucun fichier sélectionné");
      const lines = fileData
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const header = lines
        .shift()
        ?.split(",")
        .map((h) => h.trim().toLowerCase());

      if (!header) throw new Error("Format CSV invalide");

      const rows = lines.map((line) => {
        const cols = line.split(",");
        const obj: Record<string, string> = {};
        header.forEach((h, i) => (obj[h] = cols[i] ? cols[i].trim() : ""));
        return {
          product_name: obj.nom_produit || obj.product_name || "",
          quantity: Number(obj.quantite || obj.quantity || 1),
          unit_cost: Number(obj.prix_unitaire || obj.unit_cost || 0),
        };
      });

      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const purchaseInfo = {
        supplier_id: null,
        date: new Date().toISOString(),
        total_amount: 0,
        user_id: user?.id || null,
      };

      const res: any = await window.electronAPI.invoke(
        "stock:bulkReceive",
        purchaseInfo,
        rows
      );

      if (!res) throw new Error("Aucune réponse du serveur");
      if (!res.success) throw new Error(res.message || "Importation échouée");
      
      notify("success", "Traitement Massif Terminé", `Le lot a été importé avec succès (ID #${res.purchaseId})`);
      setResults([{ id: res.purchaseId, note: "Importation validée et synchronisée" }]);
      setFileData(null);
      setFileName(null);
    } catch (e: any) {
      setError(e.message);
      notify("error", "Échec d'Importation", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setError(null);
    setLoading(true);
    try {
      const res: any = await window.electronAPI.invoke("db:backup");
      if (!res) throw new Error("Aucune réponse du serveur");
      if (!res.success) throw new Error(res.message || "Sauvegarde échouée");
      
      notify("success", "Coffre-fort Mis à Jour", "La base de données a été sauvegardée avec succès.");
      setResults([{ id: "backup", note: `Dernière sauvegarde effectuée le ${new Date().toLocaleTimeString()}` }]);
    } catch (e: any) {
      setError(e.message);
      notify("error", "Erreur Maintenance", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 rotate-3">
                 <HardDriveDownload className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Flux Entrants & Maintenance</h1>
           </div>
           <p className="text-slate-500 font-medium ml-1">Automatisez vos stocks et sécurisez vos données système</p>
        </div>

        <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
           <div className="p-2.5 bg-slate-100 rounded-xl text-slate-400">
             <Clock size={16} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Processus</p>
              <p className="text-xs font-black text-slate-900 italic uppercase">Optimisé</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* CSV Import Column */}
        <div className="xl:col-span-12 lg:xl:col-span-7 space-y-8">
            <div className="flex items-center gap-2 px-2">
               <FileSpreadsheet size={16} className="text-indigo-500" />
               <h2 className="text-[11px] font-black uppercase tracking-[0.30em] text-slate-400">Assistant d'Importation Massive</h2>
            </div>

            <div className="glass-card p-10 rounded-[3rem] border-slate-200/60 shadow-xl shadow-slate-200/40 space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl -mr-20 -mt-20"></div>
               
               <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group border-dashed hover:border-indigo-200 hover:bg-indigo-50/10 transition-all cursor-pointer relative overflow-hidden"
                 onClick={() => fileInputRef.current?.click()}
               >
                  {/* Internal Glow on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {fileName ? (
                    <div className="relative z-10 animate-in zoom-in-95 duration-500">
                       <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] shadow-xl shadow-emerald-500/20 flex items-center justify-center mx-auto mb-6 rotate-3">
                          <CheckCircle2 size={40} />
                       </div>
                       <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2 truncate max-w-sm">{fileName}</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full inline-block">Fichier prêt pour analyse</p>
                    </div>
                  ) : (
                    <div className="relative z-10">
                       <div className="w-20 h-20 bg-white border border-slate-200 text-slate-300 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-all duration-500 shadow-sm">
                          <Upload size={32} />
                       </div>
                       <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Glissez votre fichier ici</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">ou cliquez pour parcourir vos documents</p>
                       
                       <div className="flex items-center justify-center gap-3">
                         <span className="h-px w-8 bg-slate-200"></span>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Format CSV uniquement</span>
                         <span className="h-px w-8 bg-slate-200"></span>
                       </div>
                    </div>
                  )}
               </div>

               {/* Syntax Reminder */}
               <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-indigo-600/10 flex flex-col md:flex-row items-center gap-6 border border-white/5 group hover:border-indigo-500/50 transition-all">
                  <div className="p-4 bg-white/5 text-indigo-400 rounded-2xl">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                     <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 italic">Structure de colonne requise (Entêtes)</p>
                     <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {['nom_produit', 'quantite', 'prix_unitaire'].map(field => (
                          <code key={field} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-white font-mono text-[10px] font-black group-hover:text-indigo-300 transition-colors">{field}</code>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Action Area */}
               <div className="flex gap-4">
                  <button 
                    onClick={handleImportCSV}
                    disabled={loading || !fileData}
                    className="premium-btn-primary flex-1 py-5 group disabled:grayscale disabled:opacity-50"
                  >
                     <CloudUpload size={20} className="group-hover:translate-y-[-1px] transition-transform" />
                     <span>Démarrer l'Automate</span>
                  </button>
                  <button 
                    onClick={() => { setFileData(null); setFileName(null); setError(null); }}
                    className="p-5 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-[1.5rem] transition-all shadow-sm group/del"
                  >
                     <Trash2 size={24} className="group-hover/del:scale-110 transition-transform" />
                  </button>
               </div>
            </div>
        </div>

        {/* Maintenance Column */}
        <div className="xl:col-span-12 lg:xl:col-span-5 space-y-8">
            <div className="flex items-center gap-2 px-2">
               <Database size={16} className="text-slate-400" />
               <h2 className="text-[11px] font-black uppercase tracking-[0.30em] text-slate-400">Maintenance & Intégrité</h2>
            </div>

            <div className="glass-card p-10 rounded-[3rem] border-slate-200/60 shadow-xl shadow-slate-200/40 space-y-10 relative overflow-hidden group">
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mb-16"></div>
               
               <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <ShieldCheck size={20} />
                     </div>
                     <h3 className="text-xl font-black text-slate-800 tracking-tight italic">Sauvegarde de Sécurité</h3>
                  </div>
                  
                  <p className="text-xs font-bold text-slate-500 leading-relaxed italic pr-4">
                    Instanciez un instantané complet de votre écosystème commercial. Cette archive contient l'intégralité du stock, des transactions et du registre d'audit.
                  </p>
                  
                  <button 
                    onClick={handleBackup}
                    disabled={loading}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2rem] shadow-xl shadow-slate-900/10 hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 group/btn active:scale-95 disabled:opacity-50"
                  >
                     <DatabaseBackup size={24} className="text-indigo-400 group-hover/btn:text-white group-hover/btn:-rotate-12 transition-all" />
                     <span className="text-[11px] font-black uppercase tracking-[0.25em]">Backup Intégral</span>
                  </button>
               </div>

               {/* Feedback area */}
               {(error || results) && (
                 <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
                    {error && (
                      <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-bottom-2">
                        <AlertCircle className="text-rose-500" size={24} />
                        <div>
                         <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Échec Système</p>
                         <p className="text-xs font-bold text-rose-700">{error}</p>
                        </div>
                      </div>
                    )}
                    
                    {results && results.map((r, i) => (
                      <div key={i} className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-bottom-2">
                        <CheckCircle2 className="text-emerald-500" size={24} />
                        <div>
                         <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Confirmation</p>
                         <p className="text-xs font-bold text-emerald-700">{r.note}</p>
                        </div>
                      </div>
                    ))}
                 </div>
               )}

               <div className="pt-4 px-2">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <span className="flex items-center gap-2"><Zap size={10} className="text-indigo-500" /> Latence Zero</span>
                     <span className="flex items-center gap-2">Hétérogène <ChevronRight size={10} /></span>
                  </div>
               </div>
            </div>

            {/* Quick Context Card */}
            <div className="bg-indigo-600 rounded-[3rem] p-10 shadow-2xl shadow-indigo-600/10 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>
               <div className="flex items-center gap-6 relative z-10">
                  <div className="p-4 bg-white/10 rounded-2xl">
                     <History className="text-white" size={28} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-tight leading-none mb-2">Historique d'approvisionnement</h4>
                    <p className="text-indigo-100/60 text-[10px] font-bold uppercase tracking-widest leading-relaxed italic">
                      Retrouvez tous les traitements CSV <br /> dans le journal d'audit de sécurité.
                    </p>
                  </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
