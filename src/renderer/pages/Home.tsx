import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Users,
  Banknote,
  PlusCircle,
  Box,
  AlertCircle,
  ArrowRight,
  LayoutDashboard,
  TrendingUp,
  History,
  Activity,
} from "lucide-react";

function isValidNumber(val: any) {
  return typeof val === "number" && !isNaN(val);
}

function StatCard({
  title,
  value,
  loading,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  loading: boolean;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white border-[4px] border-[#1A1A1A] p-8 shadow-[12px_12px_0px_#1A1A1A] group transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[16px_16px_0px_#1A1A1A] relative overflow-hidden">
      {/* Accent de couleur discret en coin */}
      <div
        className={`absolute top-0 right-0 w-16 h-16 ${color} opacity-10 -rotate-45 translate-x-8 -translate-y-8`}
      ></div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div
          className={`p-4 border-4 border-[#1A1A1A] ${color} shadow-[4px_4px_0px_#1A1A1A]`}
        >
          <Icon size={28} className="text-[#1A1A1A]" />
        </div>
        <div className="flex items-center gap-2 bg-[#1A1A1A] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_#FF5F1F]">
          <TrendingUp size={12} className="text-[#FF5F1F]" />
          <span>Actif</span>
        </div>
      </div>

      <div className="relative z-10">
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1A1A1A] opacity-60 block mb-2">
          {title}
        </span>
        {loading ? (
          <div className="h-12 w-40 bg-[#1A1A1A]/5 animate-pulse"></div>
        ) : (
          <div className="text-4xl font-black text-[#1A1A1A] tracking-tighter">
            {value}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [monthlySalesTotal, setMonthlySalesTotal] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const isAdmin =
    JSON.parse(localStorage.getItem("user") || "{}").role === "admin";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          productsRes,
          customersRes,
          lowStockRes,
          monthlySalesRes,
          weeklyStatsRes,
          auditRes,
        ] = await Promise.all([
          window.electronAPI.invoke("stock:getAll"),
          window.electronAPI.invoke("customer:getAll"),
          window.electronAPI.invoke("stock:low"),
          window.electronAPI.invoke("sale:getMonthlyTotal"),
          window.electronAPI.invoke(
            "sale:getCumulative",
            new Date().toISOString().slice(0, 7),
          ),
          isAdmin
            ? window.electronAPI.invoke("audit:getLogs", 10)
            : Promise.resolve({ success: true, data: [] }),
        ]);

        if (productsRes.success && Array.isArray(productsRes.data))
          setProductCount(productsRes.data.length);
        if (customersRes.success && Array.isArray(customersRes.data))
          setCustomerCount(customersRes.data.length);
        if (lowStockRes.success && Array.isArray(lowStockRes.data))
          setLowStockProducts(lowStockRes.data);
        if (monthlySalesRes.success && isValidNumber(monthlySalesRes.data))
          setMonthlySalesTotal(monthlySalesRes.data);
        if (weeklyStatsRes?.success && Array.isArray(weeklyStatsRes.data)) {
          setWeeklyData(weeklyStatsRes.data.slice(-7));
        }
        if (auditRes?.success) setAuditLogs(auditRes.data);
      } catch (error) {
        console.error("Erreur dashboard");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16 max-w-7xl mx-auto pb-32 pt-8">
      {/* Header Style Registre */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-8 border-[#1A1A1A] pb-12 relative">
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#FF5F1F] -z-10 opacity-20"></div>
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-[#1A1A1A] text-white shadow-[8px_8px_0px_#FF5F1F]">
              <LayoutDashboard size={32} />
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-[#1A1A1A] uppercase">
              Tableau de bord
            </h1>
          </div>
          <p className="text-3xl font-serif italic font-black text-[#1A1A1A] opacity-80 leading-tight">
            Bienvenue sur votre registre numérique de gestion.
          </p>
        </div>
        <div className="text-right bg-white border-4 border-[#1A1A1A] p-6 shadow-[8px_8px_0px_#1A1A1A]">
          <div className="text-[11px] font-black uppercase text-[#1A1A1A] tracking-[0.3em] mb-2 opacity-50">
            État du Registre
          </div>
          <div className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tighter">
            {new Date().toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <StatCard
          title="Produits en Inventaire"
          value={productCount}
          loading={loading}
          icon={Package}
          color="bg-white"
        />
        <StatCard
          title="Base Clients"
          value={customerCount}
          loading={loading}
          icon={Users}
          color="bg-[#FF5F1F]"
        />
        <StatCard
          title="Chiffre d'Affaires"
          value={`${monthlySalesTotal.toLocaleString()} CFA`}
          loading={loading}
          icon={Banknote}
          color="bg-white"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Actions Rapides - Colonne Gauche */}
        <div className="lg:col-span-7 space-y-10">
          <div className="flex items-center gap-4">
            <div className="h-1.5 flex-1 bg-[#1A1A1A]"></div>
            <h2 className="text-xl font-black uppercase tracking-[0.4em] text-[#1A1A1A] shrink-0">
              Opérations
            </h2>
            <div className="h-1.5 w-12 bg-[#FF5F1F]"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <button
              onClick={() => navigate("/sales")}
              className="group p-10 bg-[#1A1A1A] text-white border-4 border-[#1A1A1A] shadow-[12px_12px_0px_#FF5F1F] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all text-left relative overflow-hidden"
            >
              <div className="p-4 bg-white text-[#1A1A1A] w-fit mb-8 group-hover:bg-[#FF5F1F] transition-colors">
                <PlusCircle size={32} />
              </div>
              <div className="font-black text-2xl uppercase tracking-tighter mb-2">
                Nouvelle Vente
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                Sortie de stock immédiate
              </div>
              <ArrowRight
                className="absolute top-10 right-10 text-white/20 group-hover:text-white group-hover:translate-x-2 transition-all"
                size={32}
              />
            </button>

            <button
              onClick={() => navigate("/stock")}
              className="group p-10 bg-white text-[#1A1A1A] border-4 border-[#1A1A1A] shadow-[12px_12px_0px_#1A1A1A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all text-left relative overflow-hidden"
            >
              <div className="p-4 bg-[#1A1A1A] text-white w-fit mb-8 group-hover:bg-[#FF5F1F] transition-colors">
                <Box size={32} />
              </div>
              <div className="font-black text-2xl uppercase tracking-tighter mb-2">
                Inventaire
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                Contrôle des entrées
              </div>
              <ArrowRight
                className="absolute top-10 right-10 text-[#1A1A1A]/10 group-hover:text-[#1A1A1A] group-hover:translate-x-2 transition-all"
                size={32}
              />
            </button>
          </div>

          {/* Historique Rapide - Admin Only */}
          {isAdmin && (
            <div className="bg-white border-4 border-[#1A1A1A] p-8 shadow-[12px_12px_0px_#1A1A1A]">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <History size={18} /> Journal d'Audit Système
              </h3>
              <div className="space-y-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {auditLogs.length === 0 ? (
                  <div className="flex items-center justify-between text-xs py-2 border-b-2 border-[#1A1A1A]/5 italic">
                    <span className="font-serif font-black">
                      -- Aucun mouvement récent enregistré --
                    </span>
                    <span className="opacity-40">00:00</span>
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between text-[10px] py-3 border-b-2 border-[#1A1A1A]/5 group hover:bg-[#FDFCF0] transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-black uppercase text-[#FF5F1F]">
                          {log.action}
                        </span>
                        <span className="font-serif italic text-[#1A1A1A]/60">
                          {log.entity} #{log.entity_id} par {log.user_name}
                        </span>
                      </div>
                      <span className="font-mono opacity-40 group-hover:opacity-100">
                        {log.timestamp?.slice(11, 16)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Alertes - Colonne Droite */}
        <div className="lg:col-span-5 space-y-10">
          <div className="flex items-center gap-4">
            <div className="h-1.5 w-12 bg-[#FF5F1F]"></div>
            <h2 className="text-xl font-black uppercase tracking-[0.4em] text-[#1A1A1A] shrink-0 text-red-600">
              Alertes
            </h2>
            <div className="h-1.5 flex-1 bg-[#1A1A1A]"></div>
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] shadow-[16px_16px_0px_#1A1A1A] overflow-hidden">
            <div className="bg-red-600 p-6 border-b-4 border-[#1A1A1A] flex items-center gap-4">
              <AlertCircle size={28} className="text-white" />
              <span className="text-white font-black uppercase tracking-[0.2em] text-xs">
                Ruptures & Stocks Critiques
              </span>
            </div>
            <div className="divide-y-4 divide-[#1A1A1A]/10">
              {lowStockProducts.length === 0 ? (
                <div className="p-20 text-center space-y-4 opacity-30">
                  <Package size={64} className="mx-auto" strokeWidth={1} />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em]">
                    Tout est conforme
                  </p>
                </div>
              ) : (
                lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-8 hover:bg-[#FDFCF0] transition-colors group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 border-4 border-[#1A1A1A] bg-[#FDFCF0] flex items-center justify-center group-hover:bg-[#FF5F1F] transition-colors">
                        <AlertCircle size={24} className="text-[#1A1A1A]" />
                      </div>
                      <div>
                        <div className="text-lg font-black text-[#1A1A1A] uppercase tracking-tighter leading-none">
                          {product.model}
                        </div>
                        <div className="text-[10px] text-[#1A1A1A]/50 font-black uppercase tracking-[0.2em] mt-1">
                          {product.brand}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-red-600 tracking-tighter">
                        {product.stock} pcs
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-tighter text-[#1A1A1A]/40 mt-1">
                        Niveau critique
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {lowStockProducts.length > 0 && (
              <div className="p-8 bg-[#1A1A1A] text-white text-center text-[10px] font-black uppercase tracking-[0.4em]">
                Urgence de réapprovisionnement
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Graphique de Performance Explicite */}
      <div className="bg-white border-4 border-[#1A1A1A] p-10 shadow-[16px_16px_0px_#1A1A1A] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-[0.2em] flex items-center gap-3">
              <Activity size={24} className="text-[#FF5F1F]" />
              Volume des Ventes (7j)
            </h3>
            <p className="text-[10px] font-black uppercase opacity-40 mt-1 tracking-widest italic">
              Analyse des flux financiers par jour d'opération
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#1A1A1A] border-2 border-[#1A1A1A]"></div>
              <span className="text-[9px] font-black uppercase">
                Ventes du jour
              </span>
            </div>
          </div>
        </div>

        <div className="relative h-80 flex items-end gap-4 md:gap-10 border-l-4 border-b-4 border-[#1A1A1A] pl-4 pb-2 ml-16 mt-8">
          {/* Label Axe Y (Vertical) */}
          <div className="absolute -left-20 top-1/2 -rotate-90 origin-center text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/30 whitespace-nowrap">
            Montant (CFA)
          </div>

          {/* Échelle Axe Y */}
          <div className="absolute -left-16 inset-y-0 flex flex-col justify-between text-[9px] font-black text-[#1A1A1A]/40 pr-4 py-2 text-right w-14">
            <span>
              {Math.max(
                ...weeklyData.map((d) => d.daily_total || 0),
                1000,
              ).toLocaleString()}
            </span>
            <span>
              {(
                Math.max(...weeklyData.map((d) => d.daily_total || 0), 1000) / 2
              ).toLocaleString()}
            </span>
            <span>0</span>
          </div>

          {/* Lignes de repère horizontales */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-2">
            <div className="border-t-2 border-[#1A1A1A]/5 w-full"></div>
            <div className="border-t-2 border-[#1A1A1A]/5 w-full"></div>
            <div className="h-0 w-full"></div>
          </div>

          {weeklyData.length > 0 ? (
            weeklyData.map((day, idx) => {
              const maxVal =
                Math.max(...weeklyData.map((d) => d.daily_total)) || 1;
              const height = (day.daily_total / maxVal) * 100;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end z-10"
                >
                  <div
                    style={{ height: `${Math.max(height, 4)}%` }}
                    className="w-full bg-[#1A1A1A] border-2 border-[#1A1A1A] group-hover:bg-[#FF5F1F] transition-all relative flex items-center justify-center"
                  >
                    {/* Tooltip amélioré */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white p-3 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30 shadow-[6px_6px_0px_#FF5F1F] min-w-[120px] border-2 border-[#FF5F1F]">
                      <div className="text-[8px] font-black uppercase opacity-60 mb-1">
                        {day.sale_day}
                      </div>
                      <div className="text-xs font-black text-[#FF5F1F]">
                        {Number(day.daily_total).toLocaleString()} CFA
                      </div>
                      <div className="text-[7px] font-mono mt-1 pt-1 border-t border-white/10 italic">
                        Cumul: {Number(day.cumulative_total).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase mt-4 tracking-tighter whitespace-nowrap bg-white px-1">
                    {day.sale_day.split("-").slice(1).reverse().join("/")}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center italic opacity-20 text-xs font-black uppercase text-center p-8">
              En attente de données système...
            </div>
          )}

          {/* Label Axe X (Horizontal) */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/30">
            Dates d'Opérations
          </div>
        </div>
      </div>
    </div>
  );
}
