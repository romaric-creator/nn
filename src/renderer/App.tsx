// src/renderer/App.tsx
import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Stock from "./pages/Stock";
import Receive from "./pages/Receive";
import Sales from "./pages/Sales";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Audits from "./pages/Audits";
import Users from "./pages/Users";
import Login from "./pages/Login";
import ErrorBoundary from "./components/ErrorBoundary";
import { NotificationProvider } from "./components/NotificationProvider";
import { Lock, Key, ArrowRight } from "lucide-react";

export default function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogin = (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUser(userData);
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        // Clear corrupted data
        localStorage.removeItem("user");
        handleLogout();
      }
    } else {
      navigate("/login");
    }
  }, []);

  useEffect(() => {
    if (window.electronAPI?.on) {
      const removeListener = window.electronAPI.on("navigate", (path) => {
        if (isAuthenticated) {
          navigate(path);
        } else {
          navigate("/login");
        }
      });
      return () => {
        if (typeof removeListener === "function") {
          removeListener();
        }
      };
    }
  }, [navigate, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Login onLogin={handleLogin} />} />
          </Routes>
        </NotificationProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-['Outfit'] antialiased text-slate-900 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
          {/* Subtle Global Background Overlay */}
          <div className="fixed inset-0 bg-grid opacity-[0.03] pointer-events-none"></div>

          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0 relative z-[60]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <h2 className="text-lg font-black tracking-tighter italic">FLEXY<span className="text-indigo-600">STORE</span></h2>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isSidebarOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
              )}
            </button>
          </header>

          <Sidebar 
            onLogout={handleLogout} 
            user={user} 
            isOpen={isSidebarOpen} 
            closeSidebar={() => setIsSidebarOpen(false)} 
            onChangePassword={() => setShowPasswordModal(true)}
          />

          <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto">
              {/* Page Transition Wrapper can be added here if framer-motion was available */}
              <div className="min-h-full">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/stock"
                    element={
                      user?.role === "admin" || user?.role === "vendeur" ? (
                        <Stock />
                      ) : (
                        <Home />
                      )
                    }
                  />
                  <Route
                    path="/receive"
                    element={user?.role === "admin" ? <Receive /> : <Home />}
                  />
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route
                    path="/reports"
                    element={user?.role === "admin" ? <Reports /> : <Home />}
                  />
                  <Route
                    path="/audits"
                    element={user?.role === "admin" ? <Audits /> : <Home />}
                  />
                  <Route
                    path="/users"
                    element={user?.role === "admin" ? <Users /> : <Home />}
                  />
                  <Route
                    path="*"
                    element={
                      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                        <div className="text-8xl font-black mb-6 text-slate-200 tracking-tighter">
                          404
                        </div>
                        <div className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">
                          Destination Inconnue
                        </div>
                        <button
                          onClick={() => navigate("/")}
                          className="mt-10 premium-btn-secondary px-8"
                        >
                          Retour au Tableau de Bord
                        </button>
                      </div>
                    }
                  />
                </Routes>
              </div>
            </div>
          </main>
        </div>

        {/* Global Password Update Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
               <div className="p-8 bg-slate-900 text-white relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Lock size={20} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Ma Sécurité</h3>
                        <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">Édition de mes accès</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
                  >
                    <ArrowRight size={20} />
                  </button>
               </div>

               <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newPassword) return;
                    setIsUpdating(true);
                    try {
                      const res: any = await window.electronAPI.invoke('user:updatePassword', user.id, newPassword);
                      if (res.success) {
                        alert("Votre mot de passe a été mis à jour avec succès.");
                        setShowPasswordModal(false);
                        setNewPassword("");
                      }
                    } catch (err) {
                      console.error(err);
                    }
                    setIsUpdating(false);
                  }} 
                  className="p-8 space-y-6"
                >
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-3 ml-1">Définir Nouveau Password</label>
                    <div className="relative group">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                      <input 
                        type="password"
                        required
                        autoFocus
                        placeholder="••••••••••••"
                        className="premium-input pl-12"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                     <button 
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all font-bold"
                     >
                       Annuler
                     </button>
                     <button 
                      type="submit"
                      disabled={isUpdating}
                      className="flex-[2] premium-btn-primary py-4 rounded-xl shadow-indigo-100"
                     >
                       {isUpdating ? "Mise à jour..." : "Confirmer"}
                     </button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </NotificationProvider>
    </ErrorBoundary>
  );
}
