import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  ChevronRight,
  Trash2,
  TrendingUp,
  Award,
  Zap,
  ArrowUpRight,
  PieChart,
  Activity,
  History,
  FileSpreadsheet,
} from "lucide-react";
import { useNotify } from "../components/NotificationProvider";

type DetailRow = {
  sale_id: number;
  date: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  invoice_total: number;
  payment_method: string;
};

type SellerRow = {
  user_id: number;
  user_name: string;
  units_sold: number;
  total_revenue: number;
  approx_margin: number;
  avg_price: number;
  nb_sales: number;
};

type BestSeller = {
  model: string;
  total_sold: number;
  total_revenue: number;
};

export default function Reports() {
  const { notify } = useNotify();

  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [detailedReport, setDetailedReport] = useState<DetailRow[]>([]);
  const [sellerPerf, setSellerPerf] = useState<SellerRow[]>([]);
  const [stats, setStats] = useState({ day: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const loadReports = async () => {
    setLoading(true);
    try {
      const [bsRes, drRes, sellerRes, dayRes, weekRes, monthRes]: any =
        await Promise.all([
          window.electronAPI.invoke("sale:getBestSellers", 5),
          window.electronAPI.invoke(
            "sale:getDetailedReport",
            dateRange.start,
            dateRange.end,
          ),
          window.electronAPI.invoke(
            "sale:getSellerPerformance",
            dateRange.start,
            dateRange.end,
          ),
          window.electronAPI.invoke("sale:getDailyTotal"),
          window.electronAPI.invoke("sale:getWeeklyTotal"),
          window.electronAPI.invoke("sale:getMonthlyTotal"),
        ]);

      if (bsRes?.success) setBestSellers(bsRes.data);
      if (drRes?.success) setDetailedReport(drRes.data);
      if (sellerRes?.success) setSellerPerf(sellerRes.data);
      setStats({
        day: dayRes?.success ? dayRes.data : 0,
        week: weekRes?.success ? weekRes.data : 0,
        month: monthRes?.success ? monthRes.data : 0,
      });
    } catch (error) {
      console.error("Error loading reports:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const totalPeriod = React.useMemo(() => {
    if (!detailedReport || !Array.isArray(detailedReport)) return 0;
    const uniqueSales = new Map<number, number>();
    detailedReport.forEach((item) => {
      if (item.sale_id && item.invoice_total !== undefined) {
        uniqueSales.set(item.sale_id, Number(item.invoice_total));
      }
    });
    let sum = 0;
    uniqueSales.forEach((amount) => (sum += amount));
    return sum;
  }, [detailedReport]);

  const handleExport = async () => {
    try {
      const res: any = await window.electronAPI.invoke(
        "sale:exportReport",
        dateRange.start,
        dateRange.end,
      );
      if (res?.success) {
        notify("success", "Export réussi", `Rapport sauvegardé : ${res.path}`);
      } else {
        notify("error", "Erreur export", res.message || "Exportation échouée");
      }
    } catch (e) {
      console.error(e);
      notify("error", "Erreur système", "Impossible d'exporter le rapport.");
    }
  };

  if (loading && detailedReport.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div className="p-10 bg-white rounded-[3rem] shadow-xl">
           <Activity size={48} className="text-indigo-200 mb-6 mx-auto" />
           <p className="text-slate-400 font-bold tracking-tight italic">Compilation des données analytiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 rotate-3">
                 <BarChart3 className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Analyses & Rapports</h1>
           </div>
           <p className="text-slate-500 font-medium ml-1">Surveillez vos indicateurs de performance en temps réel</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center bg-white border border-slate-200 rounded-[2rem] p-2 shadow-sm">
              <div className="flex items-center px-4 py-2 border-r border-slate-100">
                <Calendar size={16} className="text-indigo-500 mr-3" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="bg-transparent border-none text-[11px] font-black uppercase outline-none text-slate-700"
                />
              </div>
              <div className="px-3">
                 <ChevronRight size={14} className="text-slate-300" />
              </div>
              <div className="flex items-center px-4 py-2">
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="bg-transparent border-none text-[11px] font-black uppercase outline-none text-slate-700"
                />
              </div>
           </div>

           <button
             onClick={handleExport}
             className="px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2.5 group"
           >
              <FileSpreadsheet size={18} className="group-hover:translate-y-[-1px] transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Exporter CSV</span>
           </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="glass-card p-8 rounded-[3rem] border-slate-200/60 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl -mr-12 -mt-12"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">Volume Période</p>
          <div className="flex items-end justify-between">
            <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
              {totalPeriod.toLocaleString()} <span className="text-[10px] text-slate-400">CFA</span>
            </h4>
            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-500">
               <TrendingUp size={14} />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[3rem] border-slate-200/60 transition-all hover:shadow-2xl hover:shadow-emerald-500/5 group">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">Ventes ce Mois</p>
          <div className="flex items-end justify-between">
            <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
              {stats.month.toLocaleString()} <span className="text-[10px] text-slate-400">CFA</span>
            </h4>
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
               <Zap size={14} />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[3rem] border-slate-200/60 transition-all hover:shadow-2xl hover:shadow-amber-500/5 group">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">Performance Semaine</p>
          <div className="flex items-end justify-between">
            <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
              {stats.week.toLocaleString()} <span className="text-[10px] text-slate-400">CFA</span>
            </h4>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors duration-500">
               <PieChart size={14} />
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-900 rounded-[3rem] shadow-2xl shadow-indigo-600/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -mr-16 -mt-16"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 italic">Chiffre d'Affaire Relatif</p>
          <div className="flex items-end justify-between relative z-10">
            <h4 className="text-2xl font-black text-white tracking-tighter leading-none">
              {stats.day.toLocaleString()} <span className="text-[10px] text-slate-600">CFA</span>
            </h4>
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-600/20 group-hover:bg-white group-hover:text-slate-900 transition-colors duration-500">
               <ArrowUpRight size={14} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Seller Performance & Detailed Journal */}
        <div className="lg:col-span-8 space-y-12">
            {/* Seller Performance Table Section */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden p-8">
               <div className="flex items-center justify-between mb-8 px-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
                    <Award size={14} className="text-indigo-500" /> Élite des Vendeurs
                  </h3>
               </div>

               <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[9px] font-black tracking-widest">
                      <th className="px-6 py-3">Collaborateur</th>
                      <th className="px-6 py-3 text-right text-indigo-400">Unités</th>
                      <th className="px-6 py-3 text-right">C.A. Total</th>
                      <th className="px-6 py-3 text-right text-emerald-400">Marge Est.</th>
                      <th className="px-6 py-3 text-right">Panier Avg.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerPerf.map((s, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 bg-slate-50 rounded-l-2xl group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-all border border-transparent">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {s.user_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-800">{s.user_name}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 bg-slate-50 text-right font-black text-indigo-600 group-hover:bg-indigo-50/50 transition-all">
                          {s.units_sold}
                        </td>
                        <td className="px-6 py-4 bg-slate-50 text-right font-bold text-slate-700 group-hover:bg-indigo-50/50 transition-all">
                          {Number(s.total_revenue).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 bg-slate-50 text-right font-black text-emerald-600 group-hover:bg-indigo-50/50 transition-all">
                          {Number(s.approx_margin || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 bg-slate-50 rounded-r-2xl text-right font-bold text-slate-700 group-hover:bg-indigo-50/50 transition-all border border-transparent border-l-0">
                          {Number(s.avg_price || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </div>

            {/* Detailed Sales log */}
            <div className="space-y-6">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <History size={16} /> Historique des Transactions
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                    Journal détaillé du registre
                  </span>
               </div>

               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                     <table className="w-full text-left border-collapse">
                       <thead className="sticky top-0 z-10 bg-slate-900 text-white">
                         <tr>
                           <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.25em]">Détails Vente</th>
                           <th className="py-6 px-6 text-[9px] font-black uppercase tracking-[0.25em]">Référence</th>
                           <th className="py-6 px-6 text-[9px] font-black uppercase tracking-[0.25em] text-center">Quantité</th>
                           <th className="py-6 px-6 text-[9px] font-black uppercase tracking-[0.25em] text-right">Net</th>
                           <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.25em] text-right">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {detailedReport.map((row, idx) => (
                           <tr key={idx} className="group hover:bg-slate-50/80 transition-all">
                             <td className="py-5 px-10">
                                <p className="font-black text-slate-800 text-sm tracking-tight leading-none mb-1 uppercase italic">
                                  {row.customer_name || "Vente Directe"}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">
                                  {new Date(row.date).toLocaleDateString('fr-FR')} • {new Date(row.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                </p>
                             </td>
                             <td className="py-5 px-6">
                               <p className="text-[11px] font-black text-indigo-500 uppercase italic opacity-70 group-hover:opacity-100 transition-opacity">
                                 {row.product_name}
                               </p>
                             </td>
                             <td className="py-5 px-6 text-center">
                               <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black group-hover:bg-slate-900 group-hover:text-white transition-all">
                                {row.quantity}
                               </span>
                             </td>
                             <td className="py-5 px-6 text-right">
                               <p className="font-black text-slate-800 tracking-tighter group-hover:text-emerald-600 transition-colors">
                                 {row.line_total.toLocaleString()} <span className="text-[10px] text-slate-400">CFA</span>
                               </p>
                             </td>
                             <td className="py-5 px-10 text-right">
                               <button
                                 onClick={async () => {
                                   if (confirm("Révoquer cette transaction ? Cette action réintégrera les unités dans le stock.")) {
                                     const res: any = await window.electronAPI.invoke("sale:cancel", row.sale_id);
                                     if (res.success) {
                                       notify("success", "Vente Révoquée", "Les registres et le stock ont été synchronisés.");
                                       loadReports();
                                     } else {
                                       notify("error", "Opération Échouée", res.message || "Impossible d'annuler");
                                     }
                                   }
                                 }}
                                 className="p-3 bg-white border border-slate-200 text-slate-300 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-2xl transition-all shadow-sm group/cancel"
                                 title="Révoquer"
                               >
                                 <Trash2 size={16} className="group-hover/cancel:rotate-12 transition-transform" />
                               </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>
               </div>
            </div>
        </div>

        {/* Right Column: Top Products Leaderboard */}
        <div className="lg:col-span-4 space-y-8">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <TrendingUp size={16} /> Top Performances
              </h3>
           </div>

           <div className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl shadow-indigo-600/5 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-600/20 blur-3xl -mr-20 -mb-20"></div>
              
              <div className="space-y-6 relative z-10">
                {bestSellers.map((product, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg italic shadow-lg ${
                        idx === 0 ? "bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900" :
                        idx === 1 ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900" :
                        idx === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" :
                        "bg-white/10 text-white/50"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-white font-black text-sm uppercase tracking-tight truncate leading-none mb-1.5">{product.model}</h4>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded-full">{product.total_sold} vendus</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-0.5 leading-none">Chiffre d'affaire</p>
                       <p className="text-emerald-400 font-black tracking-tighter">
                         +{product.total_revenue.toLocaleString()}
                       </p>
                    </div>
                  </div>
                ))}

                {bestSellers.length === 0 && (
                   <div className="py-20 text-center opacity-30">
                      <PieChart size={48} className="mx-auto mb-4 text-slate-500" />
                      <p className="font-black uppercase tracking-widest text-[10px]">Données insuffisantes</p>
                   </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 text-center px-4">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                   Calcul basé sur les transactions <br /> effectuées sur la période sélectionnée
                 </p>
              </div>
           </div>
           
           {/* Secondary Info Card */}
           <div className="glass-card p-8 rounded-[3rem] border-slate-200/60 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Activity size={20} />
                 </div>
                 <h4 className="font-black text-slate-800 tracking-tight leading-none italic">Conseil Analytique</h4>
              </div>
              <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                Utilisez l'export CSV pour une analyse approfondie des marges réelles par vendeur dans votre logiciel de gestion fiscale.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
