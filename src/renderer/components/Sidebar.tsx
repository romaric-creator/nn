import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
  Settings,
  FileText,
} from "lucide-react";

export default function Sidebar({ onLogout, user }) {
  const menuItems = [
    {
      path: "/",
      icon: Home,
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
      icon: Package,
      label: "Réception",
      roles: ["admin"],
    },
    {
      path: "/sales",
      icon: ShoppingCart,
      label: "Ventes",
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
    { path: "/users", icon: Settings, label: "Système", roles: ["admin"] },
  ];

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  return (
    <aside className="w-72 h-screen bg-[#FDFCF0] border-r-[6px] border-[#1A1A1A] flex flex-col relative shrink-0 z-50 overflow-hidden">
      {/* Texture Papier */}
      <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]"></div>

      {/* Brand Section */}
      <div className="p-8 pb-0 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#FF5F1F] border-[3px] border-[#1A1A1A] flex items-center justify-center rotate-[-3deg] shadow-[4px_4px_0px_#1A1A1A]">
            <span className="text-white font-black text-2xl italic uppercase">
              F
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter leading-none">
              Fely
            </h2>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]/40 mt-1">
              Electronique
            </p>
          </div>
        </div>
        <div className="h-1 w-full bg-[#1A1A1A]/10"></div>
      </div>

      {/* Navigation scrollable */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8 space-y-3 relative z-10 pr-2">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/30 mb-4 px-2 italic">
          Menu Principal
        </div>
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex items-center gap-4 px-4 py-3.5 transition-all border-2 border-transparent group
              ${
                isActive
                  ? "bg-[#1A1A1A] text-[#FDFCF0] border-[#1A1A1A] shadow-[6px_6px_0px_#FF5F1F] translate-x-[-2px] translate-y-[-2px]"
                  : "text-[#1A1A1A] hover:bg-[#1A1A1A]/5 hover:translate-x-1"
              }
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  className={`${isActive ? "text-[#FF5F1F]" : "text-[#1A1A1A]/60"}`}
                />
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Session Fixe */}
      <div className="p-6 pt-4 border-t-4 border-[#1A1A1A] relative z-10 bg-[#FDFCF0]/80 backdrop-blur-sm">
        <div className="mb-5 bg-white border-2 border-[#1A1A1A] p-4 shadow-[4px_4px_0px_#1A1A1A]/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/40">
              Agent Connecté
            </span>
          </div>
          <p className="text-sm font-black text-[#1A1A1A] truncate uppercase italic">
            {user?.name || "Session Admin"}
          </p>
          <div className="mt-2 text-[7px] font-black uppercase bg-[#1A1A1A] text-white px-2 py-0.5 inline-block tracking-widest">
            Rôle: {user?.role || "Indéfini"}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-[#1A1A1A] text-white border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#FF5F1F] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-[#FF5F1F] transition-all font-black text-[9px] uppercase tracking-[0.2em]"
        >
          <LogOut size={16} />
          <span>Fermer Session</span>
        </button>
      </div>
    </aside>
  );
}
