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

export default function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

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
        <div className="flex h-screen bg-slate-50 font-['Outfit'] antialiased text-slate-900 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
          {/* Subtle Global Background Overlay */}
          <div className="fixed inset-0 bg-grid opacity-[0.03] pointer-events-none"></div>
          
          <Sidebar onLogout={handleLogout} user={user} />
          
          <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto">
              {/* Page Transition Wrapper can be added here if framer-motion was available */}
              <div className="min-h-full">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/stock"
                    element={user?.role === "admin" || user?.role === "vendeur" ? <Stock /> : <Home />}
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
                        <div className="text-8xl font-black mb-6 text-slate-200 tracking-tighter">404</div>
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
      </NotificationProvider>
    </ErrorBoundary>
  );
}
