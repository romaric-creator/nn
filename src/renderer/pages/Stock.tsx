import React, { useState, useEffect } from "react";
import {
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  X,
  Package,
  Box,
  ArrowUpCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Filter,
} from "lucide-react";
import { useNotify } from "../components/NotificationProvider";

type Product = {
  id: number;
  category: string;
  brand: string;
  model: string;
  state: string;
  purchase_price: number;
  sale_price: number;
  min_sale_price: number;
  entry_date: string;
  cpu: string;
  ram: string;
  gpu: string;
  storage: string;
  stock: number;
  min_stock?: number;
};

type DefectiveUnit = {
  product_id: number;
  model: string;
  brand: string;
  defective_count: number;
};

export default function Stock() {
  const { notify } = useNotify();
  const [activeTab, setActiveTab] = useState<"inventory" | "maintenance">(
    "inventory",
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [defectiveUnits, setDefectiveUnits] = useState<DefectiveUnit[]>([]);
  const [form, setForm] = useState<any>({
    category: "Accessoire",
    brand: "",
    model: "",
    state: "Neuf",
    purchase_price: 0,
    sale_price: 0,
    stock: 0,
    min_stock: 2,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isDefectiveModalOpen, setIsDefectiveModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [supplyQty, setSupplyQty] = useState(1);
  const [defectiveQty, setDefectiveQty] = useState(1);
  const [defectiveNote, setDefectiveNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  const isTangible = (category: string) =>
    !["Service", "Logiciel"].includes(category);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res: any = await window.electronAPI.invoke(
        searchQuery ? "stock:search" : "stock:getAll",
        searchQuery,
      );
      if (res?.success) {
        const fullData = res.data || [];
        // Only update allCategories if we are not searching, to keep the full list available
        if (!searchQuery) {
          const cats = [...new Set(fullData.map((p: any) => p.category).filter(Boolean))] as string[];
          setAllCategories(cats);
        }
        
        let data = fullData;
        if (selectedCategory !== "Toutes") {
          data = data.filter((p: any) => 
            p.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
          );
        }
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadDefective = async () => {
    try {
      const res: any = await window.electronAPI.invoke("stock:getDefective");
      if (res?.success) setDefectiveUnits(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "inventory") loadProducts();
    else loadDefective();
  }, [searchQuery, activeTab, selectedCategory]);

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await window.electronAPI.invoke(
        "stock:update",
        selectedProduct.id,
        { ...selectedProduct, _user_id: user.id },
      );
      if (res?.success) {
        notify("success", "Mise à jour", `${selectedProduct.model} modifié.`);
        setIsEditModalOpen(false);
        loadProducts();
      }
    } catch (err) {
      notify(
        "error",
        "Erreur Système",
        "Impossible de mettre à jour le produit",
      );
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await window.electronAPI.invoke("stock:add", {
        ...form,
        _user_id: user.id,
      });
      if (res?.success) {
        notify(
          "success",
          "Produit Ajouté",
          `${form.model} est prêt à la vente.`,
        );
        setIsModalOpen(false);
        loadProducts();
      } else {
        notify("error", "Erreur", res.message || "Échec de l'ajout");
      }
    } catch (err) {
      notify(
        "error",
        "Erreur Système",
        "Impossible de contacter le service de stock",
      );
    }
  };

  const handleSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await window.electronAPI.invoke("stock:addMovement", {
        product_id: selectedProduct.id,
        type: "in",
        quantity: supplyQty,
        user_id: user.id,
        note: "Réapprovisionnement manuel",
        date: new Date().toISOString(),
      });
      if (res?.success) {
        notify(
          "success",
          "Stock Mis à jour",
          `+${supplyQty} unités pour ${selectedProduct.model}`,
        );
        setIsSupplyModalOpen(false);
        setSupplyQty(1);
        loadProducts();
      } else {
        notify(
          "error",
          "Erreur",
          res.message || "Impossible de mettre à jour le stock",
        );
      }
    } catch (err) {
      notify("error", "Erreur Système", "Impossible de mettre à jour le stock");
    }
  };

  const handleReportDefective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await window.electronAPI.invoke(
        "stock:reportDefectiveQuantity",
        {
          productId: selectedProduct.id,
          quantity: defectiveQty,
          note: defectiveNote,
          userId: user.id,
        },
      );
      if (res?.success) {
        notify(
          "warning",
          "Matériel Isolé",
          `${defectiveQty} unités retirées du stock.`,
        );
        setIsDefectiveModalOpen(false);
        setDefectiveQty(1);
        setDefectiveNote("");
        loadProducts();
      } else {
        notify("error", "Erreur", res.message || "Impossible de signaler");
      }
    } catch (err) {
      notify("error", "Erreur", "Signalement impossible");
    }
  };

  const handleMarkRepaired = async (item: DefectiveUnit) => {
    const qtyStr = prompt(
      `Combien d'unités de ${item.model} voulez-vous restaurer ? (Max: ${item.defective_count})`,
      "1",
    );
    if (!qtyStr) return;
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0 || qty > item.defective_count) {
      notify("error", "Erreur", "Quantité invalide");
      return;
    }
    try {
      const res = await window.electronAPI.invoke(
        "stock:markRepairedQuantity",
        { productId: item.product_id, quantity: qty, userId: user.id },
      );
      if (res?.success) {
        notify(
          "success",
          "Réparation Validée",
          `${qty} unités remises en stock.`,
        );
        loadDefective();
      } else {
        notify("error", "Erreur", res.message || "Action impossible");
      }
    } catch (e) {
      notify("error", "Erreur Système", "Action impossible");
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                <Package size={28} />
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
               Inventaire
             </h1>
          </div>
          <p className="text-slate-500 font-medium text-lg ml-1">
            Gestion centrale des équipements et consommables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white p-1.5 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-1">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === "inventory" 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
              }`}
            >
              Stock Actif
            </button>
            <button
              onClick={() => setActiveTab("maintenance")}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative ${
                activeTab === "maintenance" 
                ? "bg-rose-600 text-white shadow-lg shadow-rose-200" 
                : "text-slate-500 hover:bg-slate-50 hover:text-rose-600"
              }`}
            >
              Maintenance
              {defectiveUnits.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] border-2 border-white ${
                  activeTab === "maintenance" ? "bg-white text-rose-600" : "bg-rose-600 text-white"
                }`}>
                  {defectiveUnits.length}
                </span>
              )}
            </button>
          </div>

          {isAdmin && activeTab === "inventory" && (
            <button
              onClick={() => {
                setForm({
                  category: "Accessoire",
                  brand: "",
                  model: "",
                  state: "Neuf",
                  purchase_price: 0,
                  sale_price: 0,
                  stock: 0,
                  min_stock: 2,
                });
                setIsModalOpen(true);
              }}
              className="premium-btn-primary py-4 px-8 rounded-2xl"
            >
              <PlusCircle size={20} />
              <span className="text-sm font-black uppercase tracking-widest">
                Nouvel Article
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[60vh] flex flex-col">
        {activeTab === "inventory" ? (
          <>
            {/* Search and Filters Bar */}
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 relative group w-full">
                <Search
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Rechercher par référence, modèle ou marque..."
                  className="w-full pl-16 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold uppercase placeholder:text-slate-400 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 group">
                <Filter size={20} className="group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>

            {/* Category Quick Filter */}
            <div className="px-8 pb-6 flex items-center gap-3 overflow-x-auto custom-scrollbar no-scrollbar">
               {["Toutes", ...allCategories].map((cat) => (
                 <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                      selectedCategory === cat 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200" 
                      : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600"
                    }`}
                 >
                    {cat}
                 </button>
               ))}
            </div>

            {/* Premium Table */}
            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 text-slate-400">
                    <th className="py-6 px-10 text-[10px] font-black uppercase tracking-[0.3em]">Article & Détails</th>
                    <th className="py-6 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-center">État</th>
                    <th className="py-6 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-center">Disponibilité</th>
                    <th className="py-6 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-right">Pilotage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    Array(6).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-8 px-10"><div className="h-6 w-48 bg-slate-100 rounded-lg"></div></td>
                        <td className="py-8 px-10"><div className="h-4 w-16 bg-slate-100 rounded-full mx-auto"></div></td>
                        <td className="py-8 px-10"><div className="h-8 w-24 bg-slate-100 rounded-lg mx-auto"></div></td>
                        <td className="py-8 px-10"><div className="h-10 w-32 bg-slate-100 rounded-xl ml-auto"></div></td>
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                           <Package size={64} />
                           <p className="text-xs font-black uppercase tracking-[0.3em]">Aucun résultat trouvé</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                        <td className="py-7 px-10">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-all border border-transparent group-hover:border-slate-100">
                                <Box size={22} />
                             </div>
                             <div>
                                <div className="font-black text-lg text-slate-900 tracking-tighter uppercase leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                                  {p.model}
                                </div>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.brand}</span>
                                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                   <span className="text-[10px] font-bold text-indigo-500 group-hover:bg-indigo-50 px-1.5 rounded py-0.5 transition-all">{p.category}</span>
                                </div>
                             </div>
                          </div>
                        </td>
                        <td className="py-7 px-10 text-center">
                          <span className={`badge ${
                            p.state === "Neuf" 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {p.state}
                          </span>
                        </td>
                        <td className="py-7 px-10 text-center">
                           <div className="inline-flex flex-col items-center">
                              <span className={`text-xl font-black italic tracking-tighter ${
                                p.stock <= (p.min_stock || 2) ? "text-rose-600 underline decoration-rose-200 decoration-4 underline-offset-4" : "text-slate-900"
                              }`}>
                                {p.stock}
                              </span>
                              <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] mt-1">Unités</span>
                           </div>
                        </td>
                        <td className="py-7 px-10 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setSupplyQty(1);
                                setIsSupplyModalOpen(true);
                              }}
                              className="p-3 bg-white text-slate-600 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm"
                              title="Réapprovisionner"
                            >
                              <ArrowUpCircle size={18} />
                            </button>
                            {isTangible(p.category) && (
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setIsDefectiveModalOpen(true);
                                }}
                                className="p-3 bg-white text-slate-600 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 transition-all shadow-sm"
                                title="Signaler Panne"
                              >
                                <ShieldAlert size={18} />
                              </button>
                            )}
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedProduct(p);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="p-3 bg-white text-slate-600 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                                  title="Modifier"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("Supprimer définitivement ce produit ?")) {
                                      const res = await window.electronAPI.invoke("stock:delete", p.id);
                                      if (res?.success) {
                                        notify("warning", "Produit supprimé", `${p.model} retiré.`);
                                        loadProducts();
                                      }
                                    }
                                  }}
                                  className="p-3 bg-white text-slate-600 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
                                  title="Supprimer"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-10 bg-rose-50/50 border-b border-rose-100 flex items-center gap-6">
               <div className="w-16 h-16 rounded-[2rem] bg-white text-rose-600 flex items-center justify-center shadow-lg shadow-rose-100 border border-rose-100">
                  <AlertTriangle size={32} />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-rose-900 tracking-tighter uppercase italic">Maintenance & Logistique</h3>
                  <p className="text-rose-700/60 font-serif italic text-lg">Suivi des unités non-opérationnelles.</p>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {defectiveUnits.length === 0 ? (
                <div className="py-40 text-center opacity-20 flex flex-col items-center gap-4">
                   <CheckCircle2 size={64} />
                   <p className="font-black uppercase tracking-[0.3em]">Tout le stock est fonctionnel</p>
                </div>
              ) : (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {defectiveUnits.map((u) => (
                    <div key={u.product_id} className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-[4rem] -z-0 transition-transform group-hover:scale-125"></div>
                      <div className="relative z-10 flex flex-col justify-between h-full">
                         <div className="mb-6">
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-rose-600 transition-colors leading-tight">{u.model}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{u.brand}</p>
                         </div>
                         <div className="flex items-end justify-between">
                            <div>
                               <span className="text-3xl font-black text-rose-600">{u.defective_count}</span>
                               <span className="text-[10px] font-black uppercase text-slate-400 ml-2">HS</span>
                            </div>
                            <button
                              onClick={() => handleMarkRepaired(u)}
                              className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
                            >
                              <RotateCcw size={14} /> Restaurer
                            </button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALS REDESIGN - I will implement them more compactly below following logic */}
      
      {/* Supply Modal */}
      {isSupplyModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                 <div className="relative z-10">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Approvisionnement</h3>
                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-2">{selectedProduct.model}</p>
                 </div>
                 <button onClick={() => setIsSupplyModalOpen(false)} className="relative z-10 p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors">
                    <X size={24} />
                 </button>
              </div>
              <form onSubmit={handleSupply} className="p-12 space-y-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Quantité à ajouter</label>
                    <input 
                      type="number" min="1" required 
                      className="premium-input text-4xl font-black text-center text-indigo-600 h-24"
                      value={supplyQty}
                      onChange={(e) => setSupplyQty(Number(e.target.value))}
                    />
                 </div>
                 <div className="bg-slate-50 p-6 rounded-[1.5rem] flex items-center gap-4 border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                       <ArrowUpCircle />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Nouveau Total après validation</p>
                       <p className="text-lg font-black text-slate-900">{selectedProduct.stock + supplyQty} Unités</p>
                    </div>
                 </div>
                 <button type="submit" className="premium-btn-primary w-full py-5 rounded-2xl text-[14px]">
                    Valider le Réapprovisionnement
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* NEW/EDIT Modal logic matches original - Simplified UI follows same logic */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
              <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative shrink-0">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]"></div>
                 <div className="relative z-10 flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isModalOpen ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
                       {isModalOpen ? <PlusCircle size={32} /> : <Edit3 size={30} />}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                        {isModalOpen ? "Nouvelle Entrée" : "Modification Fiche"}
                      </h3>
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 px-1">Enregistrement dans le registre central</p>
                    </div>
                 </div>
                 <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="relative z-10 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10">
                    <X size={24} />
                 </button>
              </div>
              
              <form 
                onSubmit={isModalOpen ? handleAddProduct : handleEditProduct} 
                className="p-12 overflow-y-auto custom-scrollbar bg-slate-50/30"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   {/* Core Identity */}
                   <div className="md:col-span-3">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Identité Produit</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Catégorie</label>
                            <select
                              className="premium-input bg-white"
                              value={isModalOpen ? form.category : selectedProduct?.category}
                              onChange={(e) => isModalOpen ? setForm({ ...form, category: e.target.value }) : setSelectedProduct({...selectedProduct!, category: e.target.value})}
                            >
                              {["Ordinateur Portable", "Ordinateur Fixe", "Tablette", "Stockage", "Périphérique", "Audio", "Logiciel", "Composant", "Accessoire", "Écran", "Smartphone"].map(cat => (
                                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                              ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Marque</label>
                            <input
                              required className="premium-input bg-white"
                              placeholder="Ex: HP, DELL, APPLE..."
                              value={isModalOpen ? form.brand : selectedProduct?.brand}
                              onChange={(e) => isModalOpen ? setForm({ ...form, brand: e.target.value }) : setSelectedProduct({...selectedProduct!, brand: e.target.value})}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Modèle / Désignation</label>
                            <input
                              required className="premium-input bg-white"
                              placeholder="Fiche technique..."
                              value={isModalOpen ? form.model : selectedProduct?.model}
                              onChange={(e) => isModalOpen ? setForm({ ...form, model: e.target.value }) : setSelectedProduct({...selectedProduct!, model: e.target.value})}
                            />
                        </div>
                      </div>
                   </div>

                   {/* Specs and State */}
                   <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">État de l'Article</label>
                        <select
                          className="premium-input bg-white"
                          value={isModalOpen ? form.state : selectedProduct?.state}
                          onChange={(e) => isModalOpen ? setForm({ ...form, state: e.target.value }) : setSelectedProduct({...selectedProduct!, state: e.target.value})}
                        >
                          <option value="Neuf">Produit Neuf</option>
                          <option value="Occasion">Occasion / Seconde main</option>
                          <option value="Refurbished">Reconditionné</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stock {isModalOpen ? "Initial" : "Actuel"}</label>
                        <input
                          type="number" required className="premium-input bg-white"
                          value={isModalOpen ? form.stock : selectedProduct?.stock}
                          onChange={(e) => isModalOpen ? setForm({ ...form, stock: Number(e.target.value) }) : setSelectedProduct({...selectedProduct!, stock: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seuil Critique</label>
                        <input
                          type="number" required className="premium-input bg-white font-black text-rose-600"
                          value={isModalOpen ? form.min_stock : selectedProduct?.min_stock}
                          onChange={(e) => isModalOpen ? setForm({ ...form, min_stock: Number(e.target.value) }) : setSelectedProduct({...selectedProduct!, min_stock: Number(e.target.value)})}
                        />
                      </div>
                   </div>

                   {/* Finance Section */}
                   <div className="md:col-span-3 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 mt-4">
                      <div className="flex items-center gap-3 mb-8">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Configuration Financière (CFA)</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 opacity-60">Prix d'Achat Unitaire (PA)</label>
                            <input
                              type="number" required className="premium-input border-emerald-100 bg-emerald-50/20 text-emerald-700"
                              value={isModalOpen ? form.purchase_price : selectedProduct?.purchase_price}
                              onChange={(e) => isModalOpen ? setForm({ ...form, purchase_price: Number(e.target.value) }) : setSelectedProduct({...selectedProduct!, purchase_price: Number(e.target.value)})}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 opacity-60">Prix de Vente Conseillé (PV)</label>
                            <input
                              type="number" required className="premium-input border-indigo-100 bg-indigo-50/20 text-indigo-700 font-bold"
                              value={isModalOpen ? form.sale_price : selectedProduct?.sale_price}
                              onChange={(e) => isModalOpen ? setForm({ ...form, sale_price: Number(e.target.value) }) : setSelectedProduct({...selectedProduct!, sale_price: Number(e.target.value)})}
                            />
                        </div>
                      </div>
                   </div>
                </div>

                <div className="mt-12">
                   <button type="submit" className="premium-btn-primary w-full py-6 rounded-[1.5rem] shadow-indigo-200">
                      {isModalOpen ? "VALIDER L'INSCRIPTION EN STOCK" : "METTRE À JOUR LA FICHE ARTICLE"}
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* HS Modal */}
      {isDefectiveModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-10 bg-rose-600 text-white flex justify-between items-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                 <div className="relative z-10 flex items-center gap-4">
                    <ShieldAlert size={32} />
                    <div>
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Isolement HS</h3>
                      <p className="text-rose-200 text-[10px] font-bold uppercase tracking-widest mt-2">{selectedProduct.model}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsDefectiveModalOpen(false)} className="relative z-10 p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors">
                    <X size={24} />
                 </button>
              </div>
              <form onSubmit={handleReportDefective} className="p-12 space-y-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Quantité défectueuse</label>
                    <input 
                      type="number" min="1" max={selectedProduct.stock} required 
                      className="premium-input text-4xl font-black text-center text-rose-600 h-24"
                      value={defectiveQty}
                      onChange={(e) => setDefectiveQty(Number(e.target.value))}
                    />
                    <p className="text-[10px] text-center font-bold text-rose-400 uppercase mt-2">Maximum disponible: {selectedProduct.stock} Unités</p>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Note de diagnostic (Optionnel)</label>
                    <textarea 
                      className="premium-input h-32 py-4 resize-none"
                      placeholder="Nature de la panne ou du défaut constaté..."
                      value={defectiveNote}
                      onChange={(e) => setDefectiveNote(e.target.value)}
                    />
                 </div>
                 <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95">
                    Confirmer l'Isolement
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
