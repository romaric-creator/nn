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
  ArrowUpRight,
  Search,
  Bell,
  Calendar,
} from "lucide-react";

function isValidNumber(val: any) {
  return typeof val === "number" && !isNaN(val);
}

function StatCard({
  title,
  value,
  loading,
  icon: Icon,
  trend,
  color = "indigo",
}: {
  title: string;
  value: string | number;
  loading: boolean;
  icon: any;
  trend?: string;
  color?: string;
}) {
  const colorMap: any = {
    indigo: "from-indigo-600 to-blue-500 shadow-indigo-100 text-indigo-600 bg-indigo-50",
    emerald: "from-emerald-600 to-teal-500 shadow-emerald-100 text-emerald-600 bg-emerald-50",
    rose: "from-rose-600 to-pink-500 shadow-rose-100 text-rose-600 bg-rose-50",
    amber: "from-amber-600 to-orange-500 shadow-amber-100 text-amber-600 bg-amber-50",
  };

  const style = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className={`p-4 rounded-2xl ${style.split(' ').slice(4).join(' ')} group-hover:scale-110 transition-transform duration-500`}>
            <Icon size={28} />
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl text-[11px] font-black tracking-tight">
              <TrendingUp size={14} />
              <span>{trend}</span>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">
            {title}
          </p>
          {loading ? (
            <div className="h-10 w-3/4 bg-slate-100 animate-pulse rounded-xl"></div>
          ) : (
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
              {value}
            </h3>
          )}
        </div>
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

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

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
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Navigation / Search area */}
      <div className="flex items-center justify-between gap-6">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un produit, une facture..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium placeholder:text-slate-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3.5 bg-white rounded-2xl shadow-sm hover:bg-slate-50 transition-colors relative">
            <Bell size={20} className="text-slate-600" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
          </button>
          <div className="hidden md:flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">
            <Calendar size={18} className="text-indigo-600" />
            <span className="text-sm font-bold text-slate-700">
              {new Date().toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 md:p-14 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-600/30 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6">
            <Activity size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Système Opérationnel</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Bonjour, <span className="text-indigo-400">{user.name?.split(' ')[0] || "Admin"}</span> 👋
          </h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10 max-w-lg">
            Bienvenue sur votre espace de gestion. Suivez vos performances en temps réel et gérez votre stock en toute simplicité.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/sales")}
              className="premium-btn-primary py-4 px-8 rounded-2xl group shadow-indigo-900/40"
            >
              <PlusCircle size={20} />
              <span>Nouvelle Transaction</span>
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/stock")}
              className="premium-btn bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white py-4 px-8 rounded-2xl transition-all"
            >
              <Box size={20} />
              <span>Consulter l'Inventaire</span>
            </button>
          </div>
        </div>
        
        {/* Animated Visual Component */}
        <div className="absolute right-14 bottom-14 hidden lg:block animate-float">
           <div className="w-56 h-56 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                    <TrendingUp className="text-indigo-400" size={24} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">+14.2%</span>
              </div>
              <div>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Croissance</p>
                 <h4 className="text-2xl font-black">Performance</h4>
              </div>
           </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard
          title="Stock Total"
          value={productCount}
          loading={loading}
          icon={Package}
          trend="+12%"
          color="indigo"
        />
        <StatCard
          title="Base Clients"
          value={customerCount}
          loading={loading}
          icon={Users}
          trend="+5%"
          color="emerald"
        />
        <StatCard
          title="Recettes (Mois)"
          value={`${monthlySalesTotal.toLocaleString()} CFA`}
          loading={loading}
          icon={Banknote}
          trend="+8.4%"
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-10">
          {/* Weekly Performance Graph */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-12">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Activity size={20} />
                   </div>
                   <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                     Activité des Ventes
                   </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.25em]">Volume transactionnel (7 derniers jours)</p>
              </div>
              <select className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20">
                 <option>Cette Semaine</option>
                 <option>Mois Dernier</option>
              </select>
            </div>

            <div className="relative h-72 flex items-end gap-5 border-b border-slate-100 pb-4">
              {weeklyData.length > 0 ? (
                weeklyData.map((day, idx) => {
                  const maxVal = Math.max(...weeklyData.map((d) => d.daily_total)) || 1;
                  const height = (day.daily_total / maxVal) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group/bar h-full justify-end">
                      <div
                        style={{ height: `${Math.max(height, 8)}%` }}
                        className="w-full bg-indigo-100 rounded-2xl group-hover/bar:bg-indigo-600 transition-all duration-500 relative flex items-start justify-center pt-2"
                      >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold py-2 px-3 rounded-xl opacity-0 group-hover/bar:opacity-100 group-hover/bar:-translate-y-1 transition-all whitespace-nowrap shadow-xl z-20 pointer-events-none">
                          {Number(day.daily_total).toLocaleString()} CFA
                        </div>
                        <div className="w-1 h-3/4 bg-white/20 rounded-full"></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 mt-5 uppercase tracking-tighter">
                        {day.sale_day.split("-")[2]}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 text-sm gap-4">
                  <Activity size={40} className="opacity-10" />
                  <p className="font-bold uppercase tracking-widest opacity-30">Initialisation des données...</p>
                </div>
              )}
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-6 mt-8">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase">Volume Ventes</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-100"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase">Projection</span>
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar Style Right Column */}
        <div className="lg:col-span-4 space-y-10">
          {/* Critical Stock Alerts */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group">
            <div className="p-8 bg-rose-50/50 border-b border-rose-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} className="text-rose-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Alertes Stocks</h3>
              </div>
              <span className="bg-rose-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black">
                {lowStockProducts.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto custom-scrollbar">
              {lowStockProducts.length === 0 ? (
                <div className="p-16 text-center text-slate-300">
                  <Package size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Inventaire en règle</p>
                </div>
              ) : (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                        <Box size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tighter leading-tight">
                          {product.model}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          {product.brand}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-rose-600 leading-none">{product.stock}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase mt-1">Unités</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-slate-50">
               <button 
                onClick={() => navigate("/stock")}
                className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
              >
                 Gérer le Réapprovisionnement
               </button>
            </div>
          </div>

          {/* Recent Audit Logs */}
          {isAdmin && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History size={24} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Activités</h3>
                </div>
                <button 
                  onClick={() => navigate("/audits")} 
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors"
                >
                  Historique
                </button>
              </div>
              <div className="p-8 space-y-6">
                {auditLogs.length === 0 ? (
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] text-center py-4 italic">Aucun mouvement détecté</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex gap-4 group">
                      <div className="relative pt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50 group-hover:scale-125 transition-transform"></div>
                        <div className="absolute top-6 left-1.25 w-[1px] h-full bg-slate-100 last:hidden"></div>
                      </div>
                      <div className="pb-2">
                        <p className="text-slate-900 text-xs font-black uppercase leading-tight group-hover:text-indigo-600 transition-colors">
                          {log.action}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 font-bold uppercase tracking-widest text-[9px]">
                           <span className="text-slate-500">{log.user_name}</span>
                           <span className="text-slate-300">•</span>
                           <span className="text-slate-400">{log.timestamp?.slice(11, 16)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
