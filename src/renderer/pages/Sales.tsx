import { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  AlertCircle,
  User,
  ChevronDown,
  X,
  Calculator,
  Plus,
  FileText,
  Edit2,
  Check,
} from "lucide-react";
import { useNotify } from "../components/NotificationProvider";

type Product = {
  id: number;
  model: string;
  brand: string;
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
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<number>(0);
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
    const [prodRes, custRes] = await Promise.all([
      window.electronAPI.invoke("stock:getAll"),
      window.electronAPI.invoke("customer:getAll"),
    ]);
    if (prodRes.success) setProducts(prodRes.data);
    if (custRes.success) setCustomers(custRes.data);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((i) => i.product_id === product.id);
    if (existing) {
      if (existing.quantity + 1 > product.stock)
        return notify(
          "error",
          "Stock insuffisant",
          `Il ne reste que ${product.stock} unités.`,
        );
      setCart(
        cart.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          quantity: 1,
          price: product.sale_price,
          original_price: product.sale_price,
          selling_price: product.sale_price,
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
        `Stock maximum: ${product.stock}`,
      );
    if (qty < 1) return setCart(cart.filter((i) => i.product_id !== id));
    setCart(
      cart.map((i) => (i.product_id === id ? { ...i, quantity: qty } : i)),
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
          : i,
      ),
    );
    setEditingPriceId(null);
  };

  const totalBeforeDiscount = cart.reduce(
    (sum, item) => sum + (item.selling_price || item.price) * item.quantity,
    0,
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

    const res = await window.electronAPI.invoke("customer:add", {
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

    // Appel unique à la nouvelle fonction de checkout atomique
    const res = await window.electronAPI.invoke(
      "sale:checkout",
      {
        customer_id: customerId,
        user_id: user.id || 1,
        total,
        payment_method: "cash", // ou une autre méthode de paiement dynamique
        discount_type: discountType,
        discount_amount: discountAmount,
      },
      cart,
    );

    if (res?.success) {
      notify(
        "success",
        "Vente Validée",
        `Vente #${res.saleId} | Total: ${total.toLocaleString()} CFA`,
      );

      // La réponse contient maintenant directement le HTML, prêt à être imprimé
      if (res.html) {
        const win = window.open("about:blank", "", "width=600,height=800");
        if (win) {
          win.document.write(res.html);
          setTimeout(() => {
            win.print();
            win.close();
          }, 250); // Un petit délai pour s'assurer que le contenu est bien chargé
        }
      }

      // Réinitialiser l'état de la caisse
      setCart([]);
      setDiscountValue(0);
      setCustomerId(null);
      loadData(); // Recharger les données (ex: stock mis à jour)
    } else {
      // Afficher un message d'erreur plus précis venant du backend
      notify("error", "Erreur de Vente", res?.message || "Une erreur inconnue est survenue.");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.model.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start max-w-7xl mx-auto pt-8 pb-32 page-fade-in">
      <div className="lg:col-span-7 space-y-12">
        <header className="border-b-8 border-[#1A1A1A] pb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-[#1A1A1A] text-white shadow-[8px_8px_0px_#FF5F1F]">
              <Calculator size={32} />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-[#1A1A1A] uppercase italic">
              Caisse Flexy
            </h1>
          </div>
          <div className="relative group">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 group-focus-within:text-[#FF5F1F]"
              size={24}
            />
            <input
              type="text"
              placeholder="SCANNER OU RECHERCHER..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-brut w-full pl-16 py-6 text-lg uppercase"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs border-4 border-dashed border-[#1A1A1A]">
              Aucun produit trouvé
            </div>
          ) : (
            filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className="group p-8 bg-white border-4 border-[#1A1A1A] text-left shadow-[8px_8px_0px_#1A1A1A] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all disabled:opacity-30 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <div className="flex justify-between mb-6">
                  <span className="text-[10px] font-black uppercase opacity-40">
                    {p.brand}
                  </span>
                  <span
                    className={`text-[9px] font-black px-2 py-1 border-2 border-[#1A1A1A] ${p.stock <= 2 ? "bg-red-600 text-white border-red-600" : ""}`}
                  >
                    STK: {p.stock}
                  </span>
                </div>
                <h4 className="font-black text-xl uppercase mb-8 group-hover:text-[#FF5F1F] transition-colors leading-tight">
                  {p.model}
                </h4>
                <div className="flex items-center justify-between pt-6 border-t-4 border-[#1A1A1A]/5">
                  <span className="font-black text-2xl tracking-tighter">
                    {p.sale_price.toLocaleString()}
                  </span>
                  <Plus size={20} className="text-[#FF5F1F]" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-5 sticky top-10">
        <div className="bg-white border-4 border-[#1A1A1A] shadow-[20px_20px_0px_#1A1A1A]">
          <div className="bg-[#1A1A1A] text-white p-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black uppercase tracking-[0.4em]">
                Bon de Sortie
              </span>
              <span className="bg-white text-[#1A1A1A] px-3 py-1 text-[10px] font-black">
                {cart.length} ARTICLES
              </span>
            </div>
            <div className="h-1 w-24 bg-[#FF5F1F]"></div>
          </div>

          <div className="min-h-[300px] max-h-[400px] overflow-y-auto px-8 py-6 divide-y-2 divide-[#1A1A1A]/10">
            {cart.map((i) => {
              const isPriceModified =
                (i.original_price || 0) !== (i.selling_price || i.price);
              return (
                <div key={i.product_id} className="py-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="text-sm font-black uppercase tracking-tighter block">
                        {i.model}
                      </span>
                      {isPriceModified && (
                        <span className="text-[10px] text-red-600 font-black">
                          ⚠️ PRIX MODIFIÉ
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => updateQty(i.product_id, 0)}
                      className="text-red-600 hover:bg-red-100 p-2 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {editingPriceId === i.product_id ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          type="number"
                          value={editingPriceValue}
                          onChange={(e) =>
                            setEditingPriceValue(
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="flex-1 border-2 border-[#1A1A1A] p-2 font-black text-lg"
                          autoFocus
                        />
                        <button
                          onClick={() =>
                            updatePrice(i.product_id, editingPriceValue)
                          }
                          className="bg-green-600 text-white p-2 rounded font-black"
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-lg font-black">
                          {(i.selling_price || i.price).toLocaleString()} CFA
                        </span>
                        <button
                          onClick={() => {
                            setEditingPriceId(i.product_id);
                            setEditingPriceValue(i.selling_price || i.price);
                          }}
                          className="text-[#FF5F1F] hover:bg-orange-100 p-2 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center border-2 border-[#1A1A1A] bg-[#FDFCF0]">
                    <button
                      onClick={() => updateQty(i.product_id, i.quantity - 1)}
                      className="w-10 h-10 font-black"
                    >
                      -
                    </button>
                    <span className="px-4 font-black flex-1 text-center">
                      {i.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(i.product_id, i.quantity + 1)}
                      className="w-10 h-10 font-black"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#FDFCF0] p-8 space-y-6 border-t-4 border-[#1A1A1A]">
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                className="w-full bg-white border-4 border-[#1A1A1A] p-4 flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs font-black uppercase italic">
                  {customerId
                    ? customers.find((c) => c.id === customerId)?.name
                    : "-- Client de passage --"}
                </span>
                <ChevronDown size={18} />
              </div>
              {showCustomerDropdown && (
                <div className="absolute bottom-full left-0 w-full mb-4 bg-white border-4 border-[#1A1A1A] shadow-[12px_12px_0px_#1A1A1A] z-50 max-h-[300px] overflow-y-auto">
                  <div
                    onClick={() => {
                      setCustomerId(null);
                      setShowCustomerDropdown(false);
                    }}
                    className="p-4 hover:bg-[#1A1A1A] hover:text-white cursor-pointer border-b-2 border-[#1A1A1A]/10 font-black uppercase text-[10px] bg-yellow-100"
                  >
                    -- Client de passage --
                  </div>
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setCustomerId(c.id);
                        setShowCustomerDropdown(false);
                      }}
                      className="p-4 hover:bg-[#1A1A1A] hover:text-white cursor-pointer border-b-2 border-[#1A1A1A]/10 font-black uppercase text-[10px]"
                    >
                      {c.name}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setShowCustomerDropdown(false);
                      setShowAddCustomerModal(true);
                    }}
                    className="w-full p-4 bg-[#FF5F1F] text-white font-black uppercase text-[10px] hover:bg-[#FF5F1F]/80"
                  >
                    + AJOUTER CLIENT
                  </button>
                </div>
              )}
            </div>

            {/* Discount Section */}
            <div className="border-4 border-[#1A1A1A] p-4 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDiscountType("fixed");
                    setDiscountValue(0);
                  }}
                  className={`flex-1 py-2 font-black text-[10px] uppercase border-2 ${
                    discountType === "fixed"
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-white border-[#1A1A1A]"
                  }`}
                >
                  Montant
                </button>
                <button
                  onClick={() => {
                    setDiscountType("percentage");
                    setDiscountValue(0);
                  }}
                  className={`flex-1 py-2 font-black text-[10px] uppercase border-2 ${
                    discountType === "percentage"
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-white border-[#1A1A1A]"
                  }`}
                >
                  %
                </button>
              </div>
              <input
                type="number"
                value={discountValue}
                onChange={(e) =>
                  setDiscountValue(parseFloat(e.target.value) || 0)
                }
                placeholder={
                  discountType === "percentage" ? "%" : "Montant CFA"
                }
                className="w-full border-4 border-[#1A1A1A] p-3 font-black text-lg"
              />
              {discountAmount > 0 && (
                <div className="text-right text-sm font-black text-red-600">
                  Remise: -{discountAmount.toLocaleString()} CFA
                </div>
              )}
            </div>

            <div className="pt-6 border-t-4 border-[#1A1A1A] space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black uppercase">Sous-total</span>
                <span className="text-lg font-black">
                  {totalBeforeDiscount.toLocaleString()} CFA
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-black uppercase text-[#1A1A1A]">
                  Total Net
                </span>
                <div className="text-right">
                  <div className="text-4xl font-black">
                    {total.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-black text-[#FF5F1F]">
                    DEVISE: CFA
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="btn-brut w-full flex items-center justify-center gap-4"
            >
              <FileText size={24} />
              <span className="text-sm font-black uppercase tracking-widest">
                Valider & Facture
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Ajouter Client */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white border-4 border-[#1A1A1A] shadow-[20px_20px_0px_#1A1A1A] max-w-sm w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase">Nouveau Client</h2>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-black uppercase block mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full border-4 border-[#1A1A1A] p-3 font-black"
                  placeholder="Ex: Dupont Shop"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase block mb-2">
                  Téléphone (optionnel)
                </label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full border-4 border-[#1A1A1A] p-3 font-black"
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="flex-1 border-4 border-[#1A1A1A] p-4 font-black uppercase"
              >
                Annuler
              </button>
              <button onClick={handleAddCustomer} className="flex-1 btn-brut">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
