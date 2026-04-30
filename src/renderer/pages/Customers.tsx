import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  FileText,
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
    invoices: Invoice[];
  }>({ isOpen: false, customerId: null, invoices: [] });
  const [form, setForm] = useState({ name: "", phone: "" });
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    const res = await window.electronAPI.invoke("customer:getAll");
    if (res.success) setCustomers(res.data);
    setLoading(false);
  };

  const handleViewInvoices = async (customerId: number) => {
    const res = await window.electronAPI.invoke(
      "invoice:getByCustomerId",
      customerId,
    );
    if (res?.success) {
      setInvoicesModal({ isOpen: true, customerId, invoices: res.data || [] });
    }
  };

  const handlePrintInvoice = async (invoiceId: number) => {
    const htmlRes = await window.electronAPI.invoke(
      "invoice:generateHTML",
      invoiceId,
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
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = editingId
      ? await window.electronAPI.invoke("customer:update", editingId, form)
      : await window.electronAPI.invoke("customer:add", form);

    if (res.success) {
      notify(
        "success",
        editingId ? "Fiche mise à jour" : "Client enregistré",
        `${form.name} a été ajouté au répertoire.`,
      );
      setIsModalOpen(false);
      setForm({ name: "", phone: "" });
      setEditingId(null);
      loadCustomers();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Supprimer ce client du répertoire ?")) {
      const res = await window.electronAPI.invoke("customer:delete", id);
      if (res.success) {
        notify("warning", "Client retiré", "La fiche a été supprimée.");
        loadCustomers();
      }
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  return (
    <div className="space-y-12 pb-24 max-w-7xl mx-auto pt-8 page-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-8 border-[#1A1A1A] pb-10">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-4 bg-[#1A1A1A] text-white shadow-[8px_8px_0px_#FF5F1F]">
              <Users size={32} />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-[#1A1A1A] uppercase">
              Répertoire Clients
            </h1>
          </div>
          <p className="text-2xl font-serif italic font-black text-[#1A1A1A] opacity-80\">
            Base de données Flexy Store.
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingId(null);
            setForm({ name: "", phone: "" });
          }}
          className="btn-brut flex items-center gap-4"
        >
          <PlusCircle size={24} />
          <span className="text-xs font-black uppercase tracking-widest">
            Nouveau Client
          </span>
        </button>
      </header>

      <div className="relative group">
        <Search
          className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40 group-focus-within:text-[#FF5F1F]"
          size={24}
        />
        <input
          type="text"
          placeholder="RECHERCHER NOM OU TÉLÉPHONE..."
          className="input-brut w-full pl-16 py-6 text-lg uppercase"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-h-[70vh] overflow-y-auto pr-6 custom-scrollbar">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs border-4 border-dashed border-[#1A1A1A]">
            Aucun client enregistré dans le répertoire
          </div>
        ) : (
          filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="bg-white border-4 border-[#1A1A1A] p-8 shadow-[12px_12px_0px_#1A1A1A] group hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 bg-[#1A1A1A] text-white border-4 border-[#1A1A1A] flex items-center justify-center italic font-black shadow-[4px_4px_0px_#FF5F1F]">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewInvoices(c.id)}
                    className="p-3 bg-[#FDFCF0] border-2 border-[#1A1A1A] hover:bg-[#FF5F1F] hover:text-white transition-colors"
                    title="Voir factures"
                  >
                    <FileText size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setForm({ name: c.name, phone: c.phone });
                      setEditingId(c.id);
                      setIsModalOpen(true);
                    }}
                    className="p-3 bg-[#FDFCF0] border-2 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-3 bg-[#FDFCF0] border-2 border-[#1A1A1A] hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4 leading-tight">
                {c.name}
              </h3>
              <div className="flex items-center gap-3 py-3 px-4 bg-[#FDFCF0] border-2 border-[#1A1A1A] w-fit font-mono font-black">
                {c.phone}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm z-[999] flex items-center justify-center p-6">
          <div className="bg-white border-[6px] border-[#1A1A1A] shadow-[20px_20px_0px_#FF5F1F] w-full max-w-lg animate-in zoom-in-95 duration-300">
            <div className="bg-[#1A1A1A] text-white p-8 flex justify-between items-center">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                {editingId ? "Modifier Client" : "Nouvelle Fiche"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 border-2 border-white/20 hover:bg-red-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                  Nom Complet
                </label>
                <input
                  required
                  className="input-brut w-full uppercase"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                  Numéro de Téléphone
                </label>
                <input
                  required
                  className="input-brut w-full"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-brut w-full">
                Enregistrer le client
              </button>
            </form>
          </div>
        </div>
      )}

      {invoicesModal.isOpen && (
        <div className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm z-[999] flex items-center justify-center p-6">
          <div className="bg-white border-[6px] border-[#1A1A1A] shadow-[20px_20px_0px_#FF5F1F] w-full max-w-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-[#1A1A1A] text-white p-8 flex justify-between items-center">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                Factures Client
              </h3>
              <button
                onClick={() =>
                  setInvoicesModal({ ...invoicesModal, isOpen: false })
                }
                className="p-2 border-2 border-white/20 hover:bg-red-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-10">
              {invoicesModal.invoices.length === 0 ? (
                <div className="text-center py-10 opacity-50 font-black uppercase">
                  Aucune facture pour ce client
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {invoicesModal.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-4 bg-[#FDFCF0] border-2 border-[#1A1A1A]"
                    >
                      <div className="flex-1">
                        <div className="font-black text-sm">
                          {inv.invoice_number}
                        </div>
                        <div className="text-[10px] opacity-60">
                          {new Date(inv.invoice_date).toLocaleDateString(
                            "fr-FR",
                          )}
                        </div>
                      </div>
                      <div className="font-black text-[#FF5F1F] mr-4">
                        {inv.total_amount.toLocaleString()} CFA
                      </div>
                      <button
                        onClick={() => handlePrintInvoice(inv.id)}
                        className="px-4 py-2 bg-[#1A1A1A] text-white font-black text-[10px] uppercase hover:bg-[#FF5F1F] transition-colors"
                      >
                        Imprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
