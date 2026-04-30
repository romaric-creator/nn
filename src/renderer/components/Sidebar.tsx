import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
  Settings,
  FileText,
  ShieldCheck,
  ChevronRight,
  HardDriveDownload,
} from "lucide-react";

interface SidebarProps {
  onLogout: () => void;
  user: any;
}

export default function Sidebar({ onLogout, user }: SidebarProps) {
  const menuItems = [
    {
      path: "/",
      icon: LayoutDashboard,
      label: "Tableau de bord",
      roles: ["admin", "vendeur"],
    },
    {
      path: "/stock",
      icon: Package,
      label: "Inventaire",
      roles: ["admin"],
    },
    {
      path: "/receive",
      icon: HardDriveDownload,
      label: "Flux Entrants",
      roles: ["admin"],
    },
    {
      path: "/sales",
      icon: ShoppingCart,
      label: "Nouvelle Vente",
      roles: ["admin", "vendeur"],
    },
    {
      path: "/invoices",
      icon: FileText,
      label: "Factures",
      roles: ["admin", "vendeur"],
    },
    {
      path: "/customers",
      icon: Users,
      label: "Clients",
      roles: ["admin", "vendeur"],
    },
    { path: "/reports", icon: BarChart3, label: "Analyses", roles: ["admin"] },
    {
      path: "/audits",
      icon: ShieldCheck,
      label: "Sécurité & Audit",
      roles: ["admin"],
    },
    { path: "/users", icon: Settings, label: "Paramètres Système", roles: ["admin"] },
  ];

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  return (
    <aside className="w-80 h-screen glass-sidebar flex flex-col relative shrink-0 z-50">
      {/* Brand Section */}
      <div className="p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-3">
            <Package className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter leading-none">
              FLEXY<span className="text-indigo-500">STORE</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                V3.0 Enterprise
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-1.5">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 mb-6 px-4">
          Navigation Principale
        </div>
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group relative
              ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }
            `}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3.5">
                  <item.icon
                    size={20}
                    className={`transition-colors duration-300 ${
                      isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400"
                    }`}
                  />
                  <span className="text-[14px] font-medium tracking-tight">
                    {item.label}
                  </span>
                </div>
                <ChevronRight 
                  size={14} 
                  className={`transition-all duration-300 transform ${
                    isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0"
                  }`} 
                />
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Session Section */}
      <div className="p-6 mt-auto border-t border-slate-800/50 bg-slate-900/40">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mb-4 group hover:bg-white/10 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 p-[2px]">
              <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0) || "A"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                {user?.name || "Administrateur"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="badge bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {user?.role || "Admin"}
                </span>
                <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                <span className="text-[10px] text-slate-500 font-medium">En ligne</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all duration-300 font-bold text-xs uppercase tracking-widest shadow-sm group"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Fermer la Session</span>
        </button>
      </div>
    </aside>
  );
}
