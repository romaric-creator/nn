// src/renderer/App.tsx
import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Stock from "./pages/Stock";
import Receive from "./pages/Receive";
import Sales from "./pages/Sales";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
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
        <div className="flex h-screen bg-[#FDFCF0] font-sans antialiased text-[#1A1A1A] overflow-hidden selection:bg-[#1A1A1A] selection:text-[#FDFCF0]">
          <Sidebar onLogout={handleLogout} user={user} />
          <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
            {/* Texture Papier */}
            <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]"></div>

            <div className="max-w-7xl mx-auto relative z-10">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/stock"
                  element={user?.role === "admin" ? <Stock /> : <Home />}
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
                  path="/users"
                  element={user?.role === "admin" ? <Users /> : <Home />}
                />
                <Route
                  path="*"
                  element={
                    <div className="text-center py-32 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">
                      Système: Page Non Reconnue
                    </div>
                  }
                />
              </Routes>
            </div>
          </main>
        </div>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
