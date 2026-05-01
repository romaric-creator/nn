import { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  User,
  ChevronDown,
  X,
  Plus,
  Edit2,
  Check,
  Package,
  Zap,
  CreditCard,
  PlusCircle,
} from "lucide-react";
import { useNotify } from "../components/NotificationProvider";

type Product = {
  id: number;
  model: string;
  brand: string;
  category: string;
  sale_price: number;
  min_sale_price: number;
  purchase_price: number;
  stock: number;
  state: string;
};

type SaleItem = {
  product_id: number;
  quantity: number;
  price: number;
  original_price?: number;
  selling_price?: number;
  model: string;
};

type Customer = { id: number; name: string; phone: string };

export default function Sales() {
  const { notify } = useNotify();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    "fixed",
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [search, setSearch] = useState("");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setShowCustomerDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, custRes]: any = await Promise.all([
        window.electronAPI.invoke("stock:getAll"),
        window.electronAPI.invoke("customer:getAll"),
      ]);
      if (prodRes.success) {
        setProducts(prodRes.data);
        const cats = [...new Set((prodRes.data || []).map((p: any) => p.category).filter(Boolean))] as string[];
        setAllCategories(cats);
      }
      if (custRes.success) setCustomers(custRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((i) => i.product_id === product.id);
    if (existing) {
      if (existing.quantity + 1 > product.stock)
        return notify(
          "error",
          "Stock insuffisant",
          `Il ne reste que ${product.stock} unités.`
        );
      setCart(
        cart.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          quantity: 1,
          price: product.sale_price ?? 0,
          original_price: product.sale_price ?? 0,
          selling_price: product.sale_price ?? 0,
          model: product.model,
        },
      ]);
    }
  };

  const updateQty = (id: number, qty: number) => {
    const product = products.find((p) => p.id === id);
    if (product && qty > product.stock)
      return notify(
        "error",
        "Limite atteinte",
        `Stock maximum: ${product.stock}`
      );
    if (qty < 1) return setCart(cart.filter((i) => i.product_id !== id));
    setCart(
      cart.map((i) => (i.product_id === id ? { ...i, quantity: qty } : i))
    );
  };

  const updatePrice = (productId: number, newPrice: number) => {
    setCart(
      cart.map((i) =>
        i.product_id === productId
          ? {
              ...i,
              selling_price: newPrice,
              price: newPrice,
            }
          : i
      )
    );
    setEditingPriceId(null);
  };

  const totalBeforeDiscount = cart.reduce(
    (sum, item) => sum + (item.selling_price || item.price) * item.quantity,
    0
  );

  const discountAmount =
    discountType === "percentage"
      ? (totalBeforeDiscount * discountValue) / 100
      : discountValue;

  const total = Math.max(0, totalBeforeDiscount - discountAmount);

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      return notify("error", "Erreur", "Nom client requis");
    }

    const res: any = await window.electronAPI.invoke("customer:add", {
      name: newCustomerName,
      phone: newCustomerPhone,
    });

    if (res?.success) {
      notify("success", "Client créé", newCustomerName);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setShowAddCustomerModal(false);
      loadData();
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const res: any = await window.electronAPI.invoke(
      "sale:checkout",
      {
        customer_id: customerId,
        user_id: user.id || 1,
        total,
        payment_method: "cash",
        discount_type: discountType,
        discount_amount: discountAmount,
      },
      cart
    );

    if (res?.success) {
      notify(
        "success",
        "Vente Validée",
        `Vente #${res.saleId} | Total: ${total.toLocaleString()} CFA`
      );

      if (res.html) {
        const win = window.open("about:blank", "", "width=600,height=800");
        if (win) {
          win.document.write(res.html);
          setTimeout(() => {
            win.print();
            win.close();
          }, 250);
        }
      }

      setCart([]);
      setDiscountValue(0);
      setCustomerId(null);
      loadData();
    } else {
      notify("error", "Erreur de Vente", res?.message || "Une erreur inconnue est survenue.");
    }
  };

  const filteredProducts = products.filter(
    (p) => {
      const matchesSearch = (p.model || '').toLowerCase().includes(search.toLowerCase()) ||
                            (p.brand || '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "Toutes" || 
                              p.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      return matchesSearch && matchesCategory;
    }
  );

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] animate-in fade-in duration-700">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 rotate-3">
               <ShoppingCart className="text-white" size={24} />
             </div>
             Point de Vente
          </h1>
          <p className="text-slate-500 font-medium mt-1 ml-14 text-sm hidden sm:block">Gérez vos transactions avec fluidité</p>
        </div>

        <div className="flex items-center gap-4">
           {/* Global Search */}
           <div className="relative group w-48 sm:w-64 max-w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Scanner ou rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="premium-input pl-12 py-3.5 text-sm"
              />
           </div>
           
           <button 
             onClick={loadData}
             className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
           >
              <Zap size={20} className={loading ? "animate-pulse" : ""} />
           </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden pb-4">
        {/* Left Section: Product Grid */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
           <div className="flex items-center justify-between gap-6 px-2">
             <div className="flex flex-col gap-1">
               <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                 <Package size={14} /> Catalogue
               </h2>
               <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full w-fit">
                 {filteredProducts.length} items
               </span>
             </div>

             <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                {["Toutes", ...allCategories].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                      selectedCategory === cat 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200" 
                      : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
           </div>

           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0 || p.sale_price == null}
                className="group flex flex-col items-start p-4 md:p-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:grayscale relative overflow-hidden min-h-[160px]"
              >
                {/* Stock Tag */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  p.stock <= 2 ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                }`}>
                  Stock: {p.stock}
                </div>

                <div className="mb-4 p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                   <Package size={24} className="text-slate-400 group-hover:text-indigo-500" />
                </div>

                <div className="w-full text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">{p.category}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-500 mb-1">{p.brand}</p>
                  <h3 className="font-black text-slate-800 text-sm leading-tight mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2 h-10">
                    {p.model}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 w-full">
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                      {p.sale_price != null ? p.sale_price.toLocaleString() : <span className="text-sm text-slate-400 italic">Prix non défini</span>} <span className="text-xs text-slate-400 ml-0.5">{p.sale_price != null ? 'CFA' : ''}</span>
                    </span>
                    <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20 scale-90 group-hover:scale-100 transition-transform">
                      <Plus size={18} />
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                 <div className="p-5 bg-white rounded-3xl shadow-sm mb-4">
                   <Search size={40} className="text-slate-300" />
                 </div>
                 <p className="text-slate-400 font-bold tracking-tight">Aucun produit ne correspond à votre recherche</p>
              </div>
            )}
           </div>
        </div>

        {/* Right Section: Cart / Summary */}
        <div className="w-[320px] md:w-[360px] lg:w-[420px] flex flex-col gap-6 relative shrink-0">
           <div className="flex-1 glass-card rounded-[1.5rem] flex flex-col overflow-hidden border-slate-200/60 shadow-2xl shadow-slate-200/50">
              {/* Cart Header */}
              <div className="p-6 bg-slate-900 text-white rounded-b-[2rem] relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-500/10 blur-2xl -ml-10 -mb-10"></div>
                
                <div className="flex items-center justify-between relative z-10">
                   <div>
                     <h2 className="text-xl font-black tracking-tight mb-1">Panier Client</h2>
                     <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{cart.length} articles sélectionnés</p>
                   </div>
                   <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                      <ShoppingCart size={22} className="text-indigo-400" />
                   </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20 grayscale">
                     <ShoppingCart size={64} className="mb-4" />
                     <p className="font-black uppercase tracking-widest text-xs">Le panier est vide</p>
                  </div>
                ) : (
                  cart.map((i) => (
                    <div key={i.product_id} className="p-5 bg-white border border-slate-100 rounded-3xl flex flex-col gap-4 group hover:border-indigo-100 transition-all">
                      <div className="flex items-start justify-between gap-3">
                         <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-slate-800 text-sm truncate uppercase tracking-tight">{i.model}</h4>
                           {(i.original_price || 0) !== (i.selling_price || i.price) && (
                             <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                               <Zap size={8} /> Prix Manuel
                             </span>
                           )}
                         </div>
                         <button 
                           onClick={() => updateQty(i.product_id, 0)}
                           className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
                           <button 
                             onClick={() => updateQty(i.product_id, i.quantity - 1)}
                             className="w-8 h-8 flex items-center justify-center font-black text-slate-400 hover:text-indigo-600 transition-colors"
                           > - </button>
                           <span className="w-8 text-center font-black text-slate-800 text-sm">{i.quantity}</span>
                           <button 
                             onClick={() => updateQty(i.product_id, i.quantity + 1)}
                             className="w-8 h-8 flex items-center justify-center font-black text-slate-400 hover:text-indigo-600 transition-colors"
                           > + </button>
                        </div>

                        <div className="flex items-center gap-2">
                           {editingPriceId === i.product_id ? (
                             <div className="flex gap-1">
                               <input 
                                 type="number"
                                 autoFocus
                                 value={editingPriceValue}
                                 onChange={(e) => setEditingPriceValue(parseFloat(e.target.value) || 0)}
                                 className="w-24 px-2 py-1 border border-indigo-400 rounded-lg text-right font-black text-sm outline-none"
                               />
                               <button onClick={() => updatePrice(i.product_id, editingPriceValue)} className="p-1 bg-indigo-600 text-white rounded-lg shadow-md"><Check size={14} /></button>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2">
                               <span className="font-black text-slate-800 tracking-tight">
                                 {((i.selling_price || i.price) * i.quantity).toLocaleString()} <span className="text-[10px] text-slate-400 uppercase">CFA</span>
                               </span>
                               <button 
                                 onClick={() => {
                                   setEditingPriceId(i.product_id);
                                   setEditingPriceValue(i.selling_price || i.price);
                                 }}
                                 className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                               >
                                 <Edit2 size={14} />
                               </button>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer / Checkout */}
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                 {/* Customer Selector */}
                 <div className="relative mb-6" ref={dropdownRef}>
                   <div 
                    onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all shadow-sm"
                   >
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                           <User size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Client Destinataire</p>
                          <p className="text-xs font-black text-slate-800 truncate">
                            {customerId ? customers.find(c => c.id === customerId)?.name : "-- Client de Passage --"}
                          </p>
                        </div>
                     </div>
                     <ChevronDown size={16} className={`text-slate-400 transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} />
                   </div>
                   
                   {showCustomerDropdown && (
                     <div className="absolute bottom-full left-0 w-full mb-3 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                          <input 
                            type="text" 
                            placeholder="Chercher un client..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="w-full px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:border-indigo-400 transition-all"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                           <button 
                             onClick={() => { setCustomerId(null); setShowCustomerDropdown(false); }}
                             className="w-full text-left px-6 py-3.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                           >-- Passage --</button>
                           {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                             <button 
                               key={c.id}
                               onClick={() => { setCustomerId(c.id); setShowCustomerDropdown(false); }}
                               className="w-full text-left px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors border-t border-slate-50"
                             >{c.name}</button>
                           ))}
                        </div>
                        <button 
                          onClick={() => { setShowCustomerDropdown(false); setShowAddCustomerModal(true); }}
                          className="w-full py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                           <PlusCircle size={14} /> Nouveau Client
                        </button>
                     </div>
                   )}
                 </div>

                 {/* Totals */}
                 <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                       <span>Sous-total</span>
                       <span className="text-slate-600 tracking-tight">{totalBeforeDiscount.toLocaleString()} CFA</span>
                    </div>

                    {/* Discount Input */}
                    <div className="flex items-center gap-3 py-3 border-y border-slate-200/60">
                       <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                          <button 
                            onClick={() => { setDiscountType("fixed"); setDiscountValue(0); }}
                            className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all ${discountType === 'fixed' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
                          >FIXE</button>
                          <button 
                            onClick={() => { setDiscountType("percentage"); setDiscountValue(0); }}
                            className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all ${discountType === 'percentage' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
                          >%</button>
                       </div>
                       <div className="flex-1 relative">
                         <input 
                           type="number"
                           value={discountValue}
                           onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                           placeholder={discountType === 'percentage' ? "%" : "Montant..."}
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black outline-none focus:border-rose-300 transition-all shadow-sm pr-12 text-right"
                         />
                         {discountAmount > 0 && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-rose-500 uppercase">-{discountAmount.toLocaleString()}</span>}
                       </div>
                    </div>

                    <div className="flex justify-between items-end pt-2">
                       <div>
                         <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Total Net à payer</p>
                         <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none italic">{total.toLocaleString()}</h3>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monnaie: CFA</span>
                       </div>
                    </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex gap-3">
                    <button 
                      onClick={() => setCart([])}
                      className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
                    >
                       <Trash2 size={24} />
                    </button>
                    <button 
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                      className="flex-1 bg-indigo-600 text-white rounded-2xl p-4 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-600/20 hover:bg-slate-900 hover:shadow-indigo-500/10 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                    >
                       <CreditCard size={20} />
                       <span>Encaisser</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Modal: Ajouter Client */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-indigo-600 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
               <div className="flex justify-between items-center relative z-10">
                 <div>
                   <h2 className="text-2xl font-black tracking-tight leading-none mb-2 italic">Nouveau Client</h2>
                   <p className="text-indigo-100/70 text-xs font-bold uppercase tracking-widest">Enregistrement système</p>
                 </div>
                 <button onClick={() => setShowAddCustomerModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X size={24} />
                 </button>
               </div>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3 ml-1">Nom Complet</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="premium-input pl-12 py-3.5"
                      placeholder="Ex: Entreprise Martin"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3 ml-1">Téléphone</label>
                  <div className="relative group">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                      type="text"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      className="premium-input pl-12 py-3.5"
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-4 px-6 bg-slate-50 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-100 transition-colors"
                > Annuler </button>
                <button 
                  onClick={handleAddCustomer} 
                  className="flex-1 py-4 px-6 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95"
                > Confirmer </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
