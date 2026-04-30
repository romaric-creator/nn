import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  Package,
  Clock,
  ChevronRight,
  Trash2,
} from "lucide-react";
// BUG FIX: useNotify n'était pas importé alors que notify() était appelé
// dans le handler d'annulation de vente → ReferenceError au clic
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
  // BUG FIX: destructurer notify depuis le hook
  const { notify } = useNotify();

  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [detailedReport, setDetailedReport] = useState<DetailRow[]>([]);
  const [sellerPerf, setSellerPerf] = useState<SellerRow[]>([]);
  const [stats, setStats] = useState({ day: 0, week: 0, month: 0 });
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const loadReports = async () => {
    try {
      const [bsRes, drRes, sellerRes, dayRes, weekRes, monthRes] =
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
      const res = await window.electronAPI.invoke(
        "sale:exportReport",
        dateRange.start,
        dateRange.end,
      );
      if (res.success) {
        notify("success", "Export réussi", `Rapport sauvegardé : ${res.path}`);
      } else {
        notify("error", "Erreur export", res.message || "Exportation échouée");
      }
    } catch (e) {
      console.error(e);
      notify("error", "Erreur système", "Impossible d'exporter le rapport.");
    }
  };

  return (
    <div className="space-y-16 pb-32 max-w-7xl mx-auto pt-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-8 border-[#1A1A1A] pb-12">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-[#1A1A1A] text-white shadow-[8px_8px_0px_#FF5F1F]">
              <BarChart3 size={32} />
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-[#1A1A1A] uppercase italic">
              Analyses
            </h1>
          </div>
          <p className="text-3xl font-serif italic font-black text-[#1A1A1A] opacity-80 leading-tight">
            Synthèse des performances et flux financiers.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div className="flex items-center bg-white border-4 border-[#1A1A1A] p-4 shadow-[8px_8px_0px_#1A1A1A]">
            <Calendar size={20} className="mr-4 text-[#FF5F1F]" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="bg-transparent border-none text-[11px] font-black uppercase outline-none"
            />
            <ChevronRight size={16} className="mx-4" />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="bg-transparent border-none text-[11px] font-black uppercase outline-none"
            />
          </div>

          <button
            onClick={handleExport}
            className="bg-[#1A1A1A] text-white p-4 border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#FF5F1F] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            title="Exporter en CSV"
          >
            <Download size={20} />
          </button>
        </div>
      </header>

      {/* Cartes de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="bg-white border-4 border-[#1A1A1A] p-8 shadow-[12px_12px_0px_#FF5F1F] relative overflow-hidden">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/40 mb-2 italic">
            Total sur la Période
          </div>
          <div className="text-3xl font-black text-[#1A1A1A] tracking-tighter leading-none">
            {totalPeriod.toLocaleString()}{" "}
            <span className="text-[10px] uppercase ml-1">CFA</span>
          </div>
        </div>
        <div className="bg-white border-4 border-[#1A1A1A] p-8 shadow-[12px_12px_0px_#1A1A1A]">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/40 mb-2 italic">
            Ce Mois
          </div>
          <div className="text-3xl font-black text-[#1A1A1A] tracking-tighter leading-none">
            {stats.month.toLocaleString()}{" "}
            <span className="text-[10px] uppercase ml-1">CFA</span>
          </div>
        </div>
        <div className="bg-white border-4 border-[#1A1A1A] p-8 shadow-[12px_12px_0px_#1A1A1A]">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/40 mb-2 italic">
            Cette Semaine
          </div>
          <div className="text-3xl font-black text-[#1A1A1A] tracking-tighter leading-none">
            {stats.week.toLocaleString()}{" "}
            <span className="text-[10px] uppercase ml-1">CFA</span>
          </div>
        </div>
        <div className="bg-[#1A1A1A] text-white border-4 border-[#1A1A1A] p-8 shadow-[12px_12px_0px_#FF5F1F]">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2 italic">
            Aujourd'hui
          </div>
          <div className="text-3xl font-black text-[#FF5F1F] tracking-tighter leading-none">
            {stats.day.toLocaleString()}{" "}
            <span className="text-[10px] uppercase ml-1">CFA</span>
          </div>
        </div>
      </div>

      {/* Seller Performance */}
      <div className="mt-10 bg-white border-4 border-[#1A1A1A] p-6 shadow-[12px_12px_0px_#1A1A1A]">
        <h3 className="text-xl font-black uppercase tracking-[0.3em] mb-4">
          Performance Vendeurs
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] text-white">
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest">
                  Vendeur
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-right">
                  Unités Vendu
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-right">
                  Chiffre Affaires
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-right">
                  Marge
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-right">
                  Ticket Moyen
                </th>
              </tr>
            </thead>
            <tbody>
              {sellerPerf.map((s, idx) => (
                <tr
                  key={idx}
                  className="border-t hover:bg-[#FDFCF0] transition-colors"
                >
                  <td className="py-3 px-4 font-black">{s.user_name}</td>
                  <td className="py-3 px-4 text-right">{s.units_sold}</td>
                  <td className="py-3 px-4 text-right">
                    {Number(s.total_revenue).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {Number(s.approx_margin || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {Number(s.avg_price || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {sellerPerf.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center opacity-30 font-black uppercase tracking-widest text-xs"
                  >
                    Aucune donnée vendeur pour cette période
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Top Produits */}
        <div className="lg:col-span-4 space-y-10">
          <div className="flex items-center gap-4">
            <div className="h-1.5 w-12 bg-[#FF5F1F]"></div>
            <h2 className="text-xl font-black uppercase tracking-[0.4em] text-[#1A1A1A]">
              Top Produits
            </h2>
          </div>
          <div className="bg-white border-4 border-[#1A1A1A] shadow-[12px_12px_0px_#1A1A1A] overflow-hidden">
            <div className="divide-y-4 divide-[#1A1A1A]/10">
              {bestSellers.length === 0 ? (
                <div className="p-10 text-center opacity-30 font-black uppercase text-xs tracking-widest">
                  Aucune vente enregistrée
                </div>
              ) : (
                bestSellers.map((product, idx) => (
                  <div
                    key={idx}
                    className="p-8 flex items-center justify-between hover:bg-[#FDFCF0] transition-colors group"
                  >
                    <div className="flex items-center gap-6">
                      <span
                        className={`w-12 h-12 border-4 border-[#1A1A1A] flex items-center justify-center text-lg font-black italic ${
                          idx === 0 ? "bg-[#FF5F1F] text-white" : "bg-white"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-lg font-black text-[#1A1A1A] uppercase tracking-tighter leading-none">
                          {product.model}
                        </div>
                        <div className="text-[10px] font-black text-[#1A1A1A]/40 uppercase tracking-[0.2em] mt-1">
                          {product.total_sold} vendus
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-black text-emerald-600 tracking-tighter italic">
                      +{product.total_revenue.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Journal Détaillé */}
        <div className="lg:col-span-8 space-y-10">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-black text-[#1A1A1A] uppercase tracking-[0.4em] flex items-center gap-4">
              <Clock size={24} className="text-[#FF5F1F]" /> Journal des ventes
            </h2>
            <button
              onClick={handleExport}
              className="bg-[#1A1A1A] text-white p-4 border-4 border-[#1A1A1A] shadow-[6px_6px_0px_#FF5F1F] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              title="Exporter"
            >
              <Download size={20} />
            </button>
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] shadow-[16px_16px_0px_#1A1A1A] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-[#1A1A1A] text-white">
                  <tr>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.3em]">
                      Client / Date
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.3em]">
                      Produit
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-center">
                      Prix Unitaire
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-center">
                      Quantité
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-right">
                      Montant
                    </th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-[#1A1A1A]/5">
                  {detailedReport.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs"
                      >
                        Aucune vente enregistrée sur cette période
                      </td>
                    </tr>
                  ) : (
                    detailedReport.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[#FDFCF0] transition-colors"
                      >
                        <td className="py-4 px-8">
                          <div className="text-sm font-black text-[#1A1A1A] uppercase tracking-tighter">
                            {row.customer_name || "Vente Directe"}
                          </div>
                          <div className="text-[10px] font-serif italic text-[#1A1A1A]/40 mt-1">
                            {row.date}
                          </div>
                        </td>
                        <td className="py-4 px-8 text-sm font-black text-[#1A1A1A]/60 uppercase italic">
                          {row.product_name}
                        </td>
                        <td className="py-4 px-8 text-[11px] font-black text-[#1A1A1A] text-center">
                          {row.unit_price?.toLocaleString()}
                        </td>
                        <td className="py-4 px-8 text-lg font-black text-[#1A1A1A] text-center">
                          {row.quantity}
                        </td>
                        <td className="py-4 px-8 text-xl font-black text-emerald-600 text-right tracking-tighter">
                          {row.line_total.toLocaleString()}
                        </td>
                        <td className="py-4 px-8 text-right">
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  "Annuler cette vente ? Le stock sera restauré.",
                                )
                              ) {
                                const res = await window.electronAPI.invoke(
                                  "sale:cancel",
                                  row.sale_id,
                                );
                                if (res.success) {
                                  // BUG FIX: notify est maintenant correctement importé
                                  notify(
                                    "success",
                                    "Vente Annulée",
                                    "Le stock a été remis à jour.",
                                  );
                                  loadReports();
                                } else {
                                  notify(
                                    "error",
                                    "Erreur",
                                    res.message || "Annulation impossible",
                                  );
                                }
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                            title="Annuler Vente"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
