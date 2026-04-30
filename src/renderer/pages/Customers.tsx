import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  Edit3,
  Trash2,
  X,
  History,
  Printer,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { useNotify } from "../components/NotificationProvider";

type Customer = { id: number; name: string; phone: string };
type Invoice = {
  id: number;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
};

export default function Customers() {
  const { notify } = useNotify();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoicesModal, setInvoicesModal] = useState<{
    isOpen: boolean;
    customerId: number | null;
    customerName: string;
    invoices: Invoice[];
  }>({ isOpen: false, customerId: null, customerName: "", invoices: [] });
  const [form, setForm] = useState({ name: "", phone: "" });
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res: any = await window.electronAPI.invoke("customer:getAll");
      if (res?.success) setCustomers(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleViewInvoices = async (customerId: number, customerName: string) => {
    try {
      const res: any = await window.electronAPI.invoke(
        "invoice:getByCustomerId",
        customerId
      );
      if (res?.success) {
        setInvoicesModal({ 
          isOpen: true, 
          customerId, 
          customerName,
          invoices: res.data || [] 
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrintInvoice = async (invoiceId: number) => {
    try {
      const htmlRes: any = await window.electronAPI.invoke(
        "invoice:generateHTML",
        invoiceId
      );
      if (htmlRes?.success) {
        const win = window.open("about:blank", "", "width=600,height=800");
        if (win) {
          win.document.write(htmlRes.data.html);
          setTimeout(() => {
            win.print();
            win.close();
          }, 250);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = editingId
        ? await window.electronAPI.invoke("customer:update", editingId, form)
        : await window.electronAPI.invoke("customer:add", form);

      if (res?.success) {
        notify(
          "success",
          editingId ? "Fiche mise à jour" : "Client enregistré",
          `${form.name} a été ajouté au répertoire.`
        );
        setIsModalOpen(false);
        setForm({ name: "", phone: "" });
        setEditingId(null);
        loadCustomers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Supprimer ce client du répertoire ?")) {
      try {
        const res: any = await window.electronAPI.invoke("customer:delete", id);
        if (res?.success) {
          notify("warning", "Client retiré", "La fiche a été supprimée.");
          loadCustomers();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div className="p-8 bg-white rounded-[3rem] shadow-xl">
           <Users size={48} className="text-indigo-200 mb-6 mx-auto" />
           <p className="text-slate-400 font-bold tracking-tight">Récupération des contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 rotate-3">
                 <Users className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Carnet d'Adresses</h1>
           </div>
           <p className="text-slate-500 font-medium ml-1">Gérez votre base de clientèle et l'historique des achats</p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingId(null);
            setForm({ name: "", phone: "" });
          }}
          className="premium-btn-primary group"
        >
          <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-6 rounded-[2.5rem] border-slate-200/60 shadow-xl shadow-slate-200/40">
         <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou numéro de téléphone..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 transition-all focus:ring-4 focus:ring-indigo-500/5 shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* Customers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
             <div className="p-6 bg-slate-50 rounded-full mb-4">
               <Users size={40} className="text-slate-200" />
             </div>
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aucun contact enregistré pour le moment</p>
          </div>
        ) : (
          filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="group p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-600/5 hover:-translate-y-1.5 transition-all duration-500 relative flex flex-col"
            >
              {/* Profile Bar */}
              <div className="flex items-start justify-between mb-8">
                <div className="relative">
                   <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 rounded-[2rem] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform">
                     {c.name.charAt(0).toUpperCase()}
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                </div>
                
                <div className="flex flex-col gap-2">
                   <button 
                     onClick={() => {
                        setForm({ name: c.name, phone: c.phone });
                        setEditingId(c.id);
                        setIsModalOpen(true);
                     }}
                     className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                   >
                     <Edit3 size={16} />
                   </button>
                   <button 
                     onClick={() => handleDelete(c.id)}
                     className="p-2.5 bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>

              {/* Information */}
              <div className="flex-1">
                 <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase mb-4">
                   {c.name}
                 </h3>
                 <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl w-fit group-hover:bg-white group-hover:border-indigo-100 transition-all">
                    <Phone size={14} className="text-indigo-400" />
                    <span className="text-xs font-black text-slate-600 font-mono tracking-wider">{c.phone}</span>
                 </div>
              </div>

              {/* Action Area */}
              <button 
                onClick={() => handleViewInvoices(c.id, c.name)}
                className="mt-8 flex items-center justify-between px-6 py-4 bg-slate-900 rounded-2xl group/btn hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
              >
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/btn:text-white transition-colors">Historique</span>
                 <History size={16} className="text-indigo-400 group-hover/btn:text-white transition-all transform group-hover/btn:rotate-12" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal: Client Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 text-white p-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
               <div className="flex justify-between items-center relative z-10">
                 <div>
                   <h3 className="text-3xl font-black italic tracking-tighter leading-none mb-2">
                     {editingId ? "Édition Fiche" : "Nouveau Profil"}
                   </h3>
                   <p className="text-indigo-100/70 text-[10px] font-black uppercase tracking-widest">Base de données CRM</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                    <X size={24} />
                 </button>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="p-12 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3 ml-1">Désignation / Nom</label>
                  <input
                    required
                    placeholder="Ex: Abdoulaye Sylla"
                    className="premium-input uppercase"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3 ml-1">Contact Téléphonique</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                      required
                      placeholder="+237 6XX XXX XXX"
                      className="premium-input pl-12"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-4 px-6 bg-slate-50 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-100 transition-colors"
                > Annuler </button>
                <button type="submit" className="premium-btn-primary flex-1 py-4">
                   <ShieldCheck size={18} />
                   <span>Valider</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invoices History */}
      {invoicesModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 text-white p-10 flex justify-between items-center relative">
               <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -ml-10 -mt-10"></div>
               <div>
                 <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1 italic">Journal Commercial</p>
                 <h3 className="text-3xl font-black italic tracking-tighter leading-none truncate max-w-md">
                   {invoicesModal.customerName}
                 </h3>
               </div>
               <button onClick={() => setInvoicesModal({ ...invoicesModal, isOpen: false })} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                  <X size={24} />
               </button>
            </div>

            <div className="p-12">
              {invoicesModal.invoices.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                   <div className="p-4 bg-white rounded-full inline-block mb-4 shadow-sm">
                      <History size={32} className="text-slate-200" />
                   </div>
                   <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aucune transaction enregistrée</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto px-2 custom-scrollbar">
                  {invoicesModal.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-100 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <Receipt size={20} />
                         </div>
                         <div>
                            <div className="font-black text-slate-900 tracking-tight">{inv.invoice_number}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Facturé le {new Date(inv.invoice_date).toLocaleDateString("fr-FR")}
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Montant Net</p>
                            <div className="font-black text-slate-900 text-lg tracking-tighter whitespace-nowrap">
                              {inv.total_amount.toLocaleString()} <span className="text-xs text-slate-400 ml-1">CFA</span>
                            </div>
                         </div>
                         <button
                           onClick={() => handlePrintInvoice(inv.id)}
                           className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-md group/print"
                         >
                            <Printer size={18} className="group-hover/print:rotate-12 transition-transform" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-200/50 flex justify-end">
               <button 
                 onClick={() => setInvoicesModal({ ...invoicesModal, isOpen: false })}
                 className="px-10 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-black uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all shadow-sm"
               >Fermer le Registre</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
