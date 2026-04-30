import React, { useState } from "react";
import {
  FileUp,
  DatabaseBackup,
  Trash2,
  HardDriveDownload,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
} from "lucide-react";

interface ResultItem {
  id: string | number;
  note: string;
}

export default function Receive() {
  const [fileData, setFileData] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const res = await (window as any).electronAPI.invoke(
        "stock:bulkReceive",
        purchaseInfo,
        rows,
      );

      if (!res) throw new Error("Aucune réponse du serveur");
      if (!res.success) throw new Error(res.message || "Importation échouée");
      setResults([{ id: res.purchaseId, note: "✅ Importation réussie" }]);
      setFileData(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await (window as any).electronAPI.invoke("db:backup");
      if (!res) throw new Error("Aucune réponse du serveur");
      if (!res.success) throw new Error(res.message || "Sauvegarde échouée");
      setResults([{ id: "backup", note: `💾 Sauvegarde terminée` }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16 max-w-7xl mx-auto pb-32 pt-8 page-fade-in">
      {/* Header Style Registre */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-8 border-[#1A1A1A] pb-12 relative">
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#FF5F1F] -z-10 opacity-20"></div>
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-[#1A1A1A] text-white shadow-[8px_8px_0px_#FF5F1F]">
              <HardDriveDownload size={32} />
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-[#1A1A1A] uppercase italic">
              Réception Flexy Store
            </h1>
          </div>
          <p className="text-3xl font-serif italic font-black text-[#1A1A1A] opacity-80 leading-tight">
            Importation massive et maintenance des données.
          </p>
        </div>
        <div className="bg-white border-4 border-[#1A1A1A] p-6 shadow-[8px_8px_0px_#1A1A1A] flex items-center gap-4">
          <Clock size={24} className="text-[#FF5F1F]" />
          <div className="text-sm font-black uppercase tracking-widest">
            Opérationnel
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Section Import CSV */}
        <div className="lg:col-span-7 space-y-10">
          <div className="flex items-center gap-4">
            <div className="h-1.5 w-12 bg-[#FF5F1F]"></div>
            <h2 className="text-xl font-black uppercase tracking-[0.4em] text-[#1A1A1A]">
              Importation CSV
            </h2>
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] p-10 shadow-[16px_16px_0px_#1A1A1A] space-y-8">
            <div className="p-6 bg-[#FDFCF0] border-2 border-[#1A1A1A] border-dashed space-y-4">
              <div className="flex items-center gap-3 text-[#1A1A1A]/60">
                <FileSpreadsheet size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Structure attendue du fichier
                </span>
              </div>
              <code className="block font-mono text-xs font-black bg-[#1A1A1A] text-white p-4">
                nom_produit, quantite, prix_unitaire
              </code>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-[0.3em] text-[#1A1A1A] block italic">
                Sélectionner le fichier
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept="text/csv"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target && typeof ev.target.result === "string") {
                        setFileData(ev.target.result);
                      }
                    };
                    reader.readAsText(f);
                  }}
                  className="w-full input-brut py-8 cursor-pointer file:hidden"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  {fileData ? (
                    <CheckCircle2 className="text-emerald-500" size={32} />
                  ) : (
                    <FileUp className="text-[#1A1A1A]/20" size={32} />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-6">
              <button
                onClick={handleImportCSV}
                disabled={loading || !fileData}
                className="btn-brut flex-1 flex items-center justify-center gap-4 disabled:opacity-20"
              >
                <FileUp size={24} />
                <span className="text-xs font-black uppercase tracking-[0.4em]">
                  Traiter le fichier
                </span>
              </button>

              <button
                onClick={() => {
                  setFileData(null);
                  setResults(null);
                  setError(null);
                }}
                className="p-6 border-4 border-[#1A1A1A] hover:bg-red-600 hover:text-white transition-all shadow-[6px_6px_0px_#1A1A1A] active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Section Maintenance */}
        <div className="lg:col-span-5 space-y-10">
          <div className="flex items-center gap-4">
            <div className="h-1.5 w-12 bg-[#1A1A1A]"></div>
            <h2 className="text-xl font-black uppercase tracking-[0.4em] text-[#1A1A1A]">
              Maintenance
            </h2>
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] p-10 shadow-[16px_16px_0px_#1A1A1A] space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 leading-relaxed italic">
                Sauvegarder l'intégralité de la base de données Flexy Store dans
                le dossier de sécurité du système.
              </p>
              <button
                onClick={handleBackup}
                disabled={loading}
                className="w-full bg-[#1A1A1A] text-white py-8 flex items-center justify-center gap-4 border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#FF5F1F] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <DatabaseBackup size={28} />
                <span className="text-xs font-black uppercase tracking-[0.4em]">
                  Sauvegarde BD
                </span>
              </button>
            </div>

            {error && (
              <div className="p-6 bg-red-600 text-white border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] flex items-center gap-4">
                <AlertCircle size={24} />
                <div className="text-[10px] font-black uppercase tracking-widest">
                  ERREUR SYSTÈME: {error}
                </div>
              </div>
            )}

            {results && (
              <div className="space-y-4">
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="p-6 bg-emerald-500 text-white border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] flex items-center gap-4 animate-in slide-in-from-right-4"
                  >
                    <CheckCircle2 size={24} />
                    <div className="text-[10px] font-black uppercase tracking-widest">
                      {r.note}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
