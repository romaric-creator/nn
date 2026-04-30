import React, { useState, useEffect } from "react";
import {
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  X,
  Package,
  ArrowUpCircle,
  Wrench,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
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
  // BUG FIX: typo corrigé — setSupplySupplyQty → setSupplyQty
  const [supplyQty, setSupplyQty] = useState(1);
  const [defectiveQty, setDefectiveQty] = useState(1);
  const [defectiveNote, setDefectiveNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  const isTangible = (category: string) =>
    !["Service", "Logiciel"].includes(category);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.invoke(
        searchQuery ? "stock:search" : "stock:getAll",
        searchQuery,
      );
      if (res?.success) setProducts(res.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadDefective = async () => {
    try {
      const res = await window.electronAPI.invoke("stock:getDefective");
      if (res?.success) setDefectiveUnits(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "inventory") loadProducts();
    else loadDefective();
  }, [searchQuery, activeTab]);

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await window.electronAPI.invoke(
        "stock:update",
        selectedProduct.id,
        { ...selectedProduct, _user_id: user.id },
      );
      if (res.success) {
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
      if (res.success) {
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

  // BUG FIX: handleSupply utilisait stock:update en écrasant le stock directement,
  // ce qui ne créait aucun enregistrement dans stock_movements.
  // Corrigé pour utiliser stock:addMovement qui à la fois enregistre le mouvement
  // ET met à jour le stock via addStockMovement dans stockService.
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
      if (res.success) {
        notify(
          "success",
          "Stock Mis à jour",
          `+${supplyQty} unités pour ${selectedProduct.model}`,
        );
        setIsSupplyModalOpen(false);
        // BUG FIX: utiliser setSupplyQty (plus setSupplySupplyQty qui était le typo)
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
      if (res.success) {
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
      if (res.success) {
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
    <div className="space-y-12 pb-24 max-w-7xl mx-auto pt-8 page-fade-in text-[#1A1A1A]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-8 border-[#1A1A1A] pb-10">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-4 bg-[#1A1A1A] text-white shadow-[8px_8px_0px_#FF5F1F]">
              <Package size={32} />
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">
              Registre de Stock
            </h1>
          </div>
          <p className="text-2xl font-serif italic font-black opacity-80">
            Inventaire général Flexy Store.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white border-4 border-[#1A1A1A] p-1 flex shadow-[6px_6px_0px_#1A1A1A]">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-6 py-3 font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === "inventory" ? "bg-[#1A1A1A] text-white" : "hover:bg-[#FDFCF0]"}`}
            >
              Inventaire
            </button>
            <button
              onClick={() => setActiveTab("maintenance")}
              className={`px-6 py-3 font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === "maintenance" ? "bg-[#FF5F1F] text-white" : "hover:bg-[#FDFCF0]"}`}
            >
              Maintenance{" "}
              {defectiveUnits.length > 0 && (
                <span className="ml-2 bg-white text-black px-1.5 py-0.5 rounded-full text-[8px]">
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
              className="btn-brut flex items-center gap-4"
            >
              <PlusCircle size={24} />
              <span className="text-xs font-black uppercase tracking-widest">
                Nouvel Équipement
              </span>
            </button>
          )}
        </div>
      </header>

      {activeTab === "inventory" ? (
        <>
          <div className="flex-1 relative group">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40 group-focus-within:text-[#FF5F1F]"
              size={24}
            />
            <input
              type="text"
              placeholder="RECHERCHER DANS LE REGISTRE..."
              className="input-brut w-full pl-16 py-6 text-lg uppercase"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] shadow-[16px_16px_0px_#1A1A1A] overflow-hidden flex flex-col max-h-[70vh]">
            <div className="overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-[#1A1A1A] text-white">
                  <tr>
                    <th className="py-6 px-10 text-[11px] font-black uppercase tracking-[0.4em]">
                      Nature & Désignation
                    </th>
                    <th className="py-6 px-10 text-[11px] font-black uppercase tracking-[0.4em] text-center">
                      État
                    </th>
                    <th className="py-6 px-10 text-[11px] font-black uppercase tracking-[0.4em] text-center">
                      En Stock
                    </th>
                    <th className="py-6 px-10 text-[11px] font-black uppercase tracking-[0.4em] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-[#1A1A1A]/5">
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs"
                      >
                        Aucun produit dans le registre
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr
                        key={p.id}
                        className="group hover:bg-[#FDFCF0] transition-colors"
                      >
                        <td className="py-6 px-10">
                          <div className="font-black text-xl tracking-tighter uppercase leading-none mb-1">
                            {p.model}
                          </div>
                          <div className="text-[10px] font-black opacity-40 uppercase">
                            {p.category} | {p.brand}
                          </div>
                        </td>
                        <td className="py-6 px-10 text-center">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-1 border-2 ${p.state === "Neuf" ? "border-emerald-500 text-emerald-600" : "border-amber-500 text-amber-600"}`}
                          >
                            {p.state}
                          </span>
                        </td>
                        <td className="py-6 px-10 text-center">
                          <span
                            className={`inline-block px-4 py-2 font-black text-xl italic border-2 ${p.stock <= (p.min_stock || 2) ? "bg-red-600 text-white border-red-600" : "border-transparent"}`}
                          >
                            {p.stock} Pcs
                          </span>
                        </td>
                        <td className="py-6 px-10 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setSupplyQty(1); // BUG FIX: setSupplyQty (plus setSupplySupplyQty)
                                setIsSupplyModalOpen(true);
                              }}
                              title="Réapprovisionner"
                              className="p-3 bg-[#FDFCF0] border-4 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                              <ArrowUpCircle size={18} />
                            </button>
                            {isTangible(p.category) && (
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setIsDefectiveModalOpen(true);
                                }}
                                title="Signaler Panne"
                                className="p-3 bg-white border-4 border-[#1A1A1A] text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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
                                  title="Modifier Fiche"
                                  className="p-3 bg-white border-4 border-[#1A1A1A] text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (
                                      confirm(
                                        "Supprimer définitivement ce produit ?",
                                      )
                                    ) {
                                      const res =
                                        await window.electronAPI.invoke(
                                          "stock:delete",
                                          p.id,
                                        );
                                      if (res.success) {
                                        notify(
                                          "warning",
                                          "Produit supprimé",
                                          `${p.model} retiré de l'inventaire.`,
                                        );
                                        loadProducts();
                                      }
                                    }
                                  }}
                                  title="Supprimer"
                                  className="p-3 bg-white border-4 border-[#1A1A1A] text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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
          </div>
        </>
      ) : (
        <div className="space-y-8">
          <div className="bg-amber-50 border-4 border-amber-600 p-8 flex items-center gap-6 shadow-[12px_12px_0px_#D97706]/10">
            <AlertTriangle size={40} className="text-amber-600" />
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-amber-900">
                Atelier de Maintenance
              </h3>
              <p className="text-sm font-serif italic font-black text-amber-800/60">
                Unités hors-service en attente de réparation ou diagnostic.
              </p>
            </div>
          </div>

          <div className="bg-white border-4 border-[#1A1A1A] shadow-[16px_16px_0px_#1A1A1A] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1A1A1A] text-white">
                <tr>
                  <th className="py-6 px-10 text-[11px] font-black uppercase tracking-[0.4em]">
                    Équipement
                  </th>
                  <th className="py-6 px-10 text-[11px] font-black uppercase tracking-[0.4em]">
                    Quantité HS
                  </th>
                  <th className="py-6 px-10 text-[11px] font-black uppercase tracking-[0.4em] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-[#1A1A1A]/5">
                {defectiveUnits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs"
                    >
                      Aucune unité en maintenance
                    </td>
                  </tr>
                ) : (
                  defectiveUnits.map((u) => (
                    <tr
                      key={u.product_id}
                      className="hover:bg-[#FDFCF0] transition-colors"
                    >
                      <td className="py-6 px-10">
                        <div className="font-black text-lg uppercase">
                          {u.model}
                        </div>
                        <div className="text-[10px] font-black opacity-40 uppercase">
                          {u.brand}
                        </div>
                      </td>
                      <td className="py-6 px-10 font-mono font-black text-amber-600 text-xl">
                        {u.defective_count} Unités
                      </td>
                      <td className="py-6 px-10 text-right">
                        <button
                          onClick={() => handleMarkRepaired(u)}
                          className="btn-brut py-3 px-6 text-[10px] flex items-center gap-3 ml-auto"
                        >
                          <CheckCircle2 size={16} /> Restaurer / Réparer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALE SIGNALER PANNE */}
      {isDefectiveModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm z-[999] flex items-center justify-center p-6">
          <div className="bg-white border-[6px] border-[#1A1A1A] shadow-[20px_20px_0px_#D97706] w-full max-w-md">
            <div className="p-8 border-b-4 border-[#1A1A1A] bg-amber-50">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-amber-900 flex items-center gap-3">
                <ShieldAlert size={24} /> Mise hors-service
              </h3>
              <p className="text-xs font-bold opacity-60 mt-2 uppercase tracking-widest">
                {selectedProduct.model}
              </p>
            </div>
            <form onSubmit={handleReportDefective} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40 block">
                  Quantité HS
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  className="input-brut w-full uppercase font-mono text-center text-4xl"
                  value={defectiveQty}
                  onChange={(e) => setDefectiveQty(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40 block">
                  Note / Motif (Optionnel)
                </label>
                <input
                  className="input-brut w-full uppercase"
                  value={defectiveNote}
                  onChange={(e) => setDefectiveNote(e.target.value)}
                  placeholder="Ex: Écran cassé..."
                />
              </div>
              <p className="text-[9px] font-black text-amber-700 italic">
                {defectiveQty} unité(s) seront retirées du stock vendable.
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsDefectiveModalOpen(false)}
                  className="flex-1 font-black uppercase text-xs opacity-40"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 text-white border-4 border-[#1A1A1A] py-4 flex-1 shadow-[4px_4px_0px_#1A1A1A] font-black uppercase text-[10px] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Confirmer Panne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE AJOUT PRODUIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm z-[999] flex items-center justify-center p-6">
          <div className="bg-white border-[6px] border-[#1A1A1A] shadow-[20px_20px_0px_#FF5F1F] w-full max-w-4xl">
            <div className="bg-[#1A1A1A] text-white p-8 flex justify-between items-center">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-[#FF5F1F]">
                Nouvelle Entrée
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 border-2 border-white/20 hover:bg-red-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={handleAddProduct}
              className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto max-h-[70vh] custom-scrollbar"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40">
                  Catégorie
                </label>
                <select
                  className="input-brut w-full"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="Ordinateur Portable">
                    ORDINATEUR PORTABLE
                  </option>
                  <option value="Ordinateur Fixe">ORDINATEUR FIXE</option>
                  <option value="Tablette">TABLETTE</option>
                  <option value="Stockage">STOCKAGE (HDD/SSD/USB)</option>
                  <option value="Périphérique">
                    PÉRIPHÉRIQUE (SOURIS/CLAVIER)
                  </option>
                  <option value="Audio">AUDIO (CASQUE/ÉCOUTEUR)</option>
                  <option value="Logiciel">LOGICIEL / ANTIVIRUS</option>
                  <option value="Composant">COMPOSANT</option>
                  <option value="Accessoire">ACCESSOIRE DIVERS</option>
                  <option value="Écran">ÉCRAN</option>
                  <option value="Smartphone">SMARTPHONE</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40">
                  Marque
                </label>
                <input
                  required
                  className="input-brut w-full"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Ex: HP, Apple..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40">
                  Modèle / Désignation
                </label>
                <input
                  required
                  className="input-brut w-full"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Ex: Victus 16..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40">
                  État
                </label>
                <select
                  className="input-brut w-full"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                >
                  <option value="Neuf">NEUF</option>
                  <option value="Occasion">OCCASION</option>
                  <option value="Refurbished">RECONDITIONNÉ</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40">
                  Seuil d'Alerte
                </label>
                <input
                  type="number"
                  required
                  className="input-brut w-full bg-[#FDFCF0]"
                  value={form.min_stock}
                  onChange={(e) =>
                    setForm({ ...form, min_stock: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40">
                  Stock Initial
                </label>
                <input
                  type="number"
                  required
                  className="input-brut w-full"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: Number(e.target.value) })
                  }
                />
              </div>
              <div className="md:col-span-3 h-1 bg-[#1A1A1A]/10 my-4"></div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40 text-emerald-600">
                  Prix d'Achat (Unitaire)
                </label>
                <input
                  type="number"
                  required
                  className="input-brut w-full border-emerald-500"
                  value={form.purchase_price}
                  onChange={(e) =>
                    setForm({ ...form, purchase_price: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40 text-[#FF5F1F]">
                  Prix de Vente Conseillé
                </label>
                <input
                  type="number"
                  required
                  className="input-brut w-full border-[#FF5F1F]"
                  value={form.sale_price}
                  onChange={(e) =>
                    setForm({ ...form, sale_price: Number(e.target.value) })
                  }
                />
              </div>
              <button
                type="submit"
                className="btn-brut md:col-span-3 py-6 mt-4"
              >
                VALIDER L'ENTRÉE EN INVENTAIRE
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE ÉDITION */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm z-[999] flex items-center justify-center p-6">
          <div className="bg-white border-[6px] border-[#1A1A1A] shadow-[20px_20px_0px_#FF5F1F] w-full max-w-4xl">
            <div className="bg-[#1A1A1A] text-white p-8 flex justify-between items-center">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-[#FF5F1F]">
                Modifier Fiche
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 border-2 border-white/20 hover:bg-red-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={handleEditProduct}
              className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto max-h-[70vh] custom-scrollbar"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40">
                  Modèle
                </label>
                <input
                  required
                  className="input-brut w-full"
                  value={selectedProduct.model}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      model: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40">
                  Marque
                </label>
                <input
                  required
                  className="input-brut w-full"
                  value={selectedProduct.brand}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      brand: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40">
                  État
                </label>
                <select
                  className="input-brut w-full"
                  value={selectedProduct.state}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      state: e.target.value,
                    })
                  }
                >
                  <option value="Neuf">NEUF</option>
                  <option value="Occasion">OCCASION</option>
                  <option value="Refurbished">RECONDITIONNÉ</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40 bg-amber-100 px-1">
                  Ajuster Stock Manuel
                </label>
                <input
                  type="number"
                  required
                  className="input-brut w-full bg-amber-50"
                  value={selectedProduct.stock}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      stock: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40">
                  Seuil Alerte
                </label>
                <input
                  type="number"
                  required
                  className="input-brut w-full"
                  value={selectedProduct.min_stock}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      min_stock: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="md:col-span-3 h-1 bg-[#1A1A1A]/10 my-4"></div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40 text-emerald-600">
                  Prix d'Achat
                </label>
                <input
                  type="number"
                  required
                  className="input-brut w-full border-emerald-500"
                  value={selectedProduct.purchase_price}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      purchase_price: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40 text-[#FF5F1F]">
                  Prix de Vente
                </label>
                <input
                  type="number"
                  required
                  className="input-brut w-full border-[#FF5F1F]"
                  value={selectedProduct.sale_price}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      sale_price: Number(e.target.value),
                    })
                  }
                />
              </div>
              <button
                type="submit"
                className="btn-brut md:col-span-3 py-6 mt-4"
              >
                SAUVEGARDER LES MODIFICATIONS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE RÉAPPROVISIONNER */}
      {isSupplyModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm z-[999] flex items-center justify-center p-6">
          <div className="bg-white border-[6px] border-[#1A1A1A] shadow-[20px_20px_0px_#FF5F1F] w-full max-w-md">
            <div className="p-8 border-b-4 border-[#1A1A1A]">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-[#FF5F1F]">
                Entrée Stock
              </h3>
              <p className="text-sm font-bold opacity-60 mt-2">
                {selectedProduct.model}
              </p>
            </div>
            <form onSubmit={handleSupply} className="p-10 space-y-8">
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-black uppercase opacity-40 block">
                  Unités à ajouter
                </label>
                {/* BUG FIX: onChange utilise maintenant setSupplyQty (plus setSupplySupplyQty) */}
                <input
                  type="number"
                  min="1"
                  required
                  className="input-brut w-full text-4xl text-center font-black"
                  value={supplyQty}
                  onChange={(e) => setSupplyQty(Number(e.target.value))}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsSupplyModalOpen(false)}
                  className="flex-1 font-black uppercase text-xs opacity-40"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-brut flex-1 text-[10px]">
                  Valider Entrée
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
