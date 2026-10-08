import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Eye,
  ArrowLeft,
  Trash2,
  Filter,
  Calendar,
  Search,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileCheck,
  AlertCircle,
  Clock,
  Printer,
} from "lucide-react";
import { useNotify } from "../components/NotificationProvider";
import { fuzzySearch } from "../utils/searchUtils";

type Invoice = {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  total_amount: number;
  discount_amount: number;
  payment_method: string;
  status: string;
  item_count: number;
};

type DateRange = "today" | "week" | "month" | "all";

export default function Invoices() {
  const { notify } = useNotify();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "paid" | "pending" | "cancelled"
  >("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, filterStatus, dateRange, dateFrom, dateTo]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res: any = await window.electronAPI.invoke("invoice:getAll");
      if (res?.success) {
        setInvoices(res.data || []);
      } else {
        notify("error", "Erreur", "Impossible de charger les factures");
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (filterStatus !== "all") {
      filtered = filtered.filter((inv) => inv.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (inv) =>
          fuzzySearch(inv.invoice_number, searchTerm) ||
          fuzzySearch(inv.customer_name || "", searchTerm) ||
          fuzzySearch(inv.invoice_date, searchTerm)
      );
    }

    setFilteredInvoices(filtered);
  };

  const handlePrint = async (invoice: Invoice) => {
    const htmlRes: any = await window.electronAPI.invoke(
      "invoice:generateHTML",
      invoice.id
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
    } else {
      notify("error", "Erreur", "Impossible de générer la facture");
    }
  };

  const handleDownloadHTML = async (invoice: Invoice) => {
    const htmlRes: any = await window.electronAPI.invoke(
      "invoice:generateHTML",
      invoice.id
    );
    if (htmlRes?.success) {
      const element = document.createElement("a");
      const file = new Blob([htmlRes.data.html], { type: "text/html" });
      element.href = URL.createObjectURL(file);
      element.download = `${invoice.invoice_number}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      notify("success", "Téléchargé", `${invoice.invoice_number} téléchargée`);
    } else {
       notify("error", "Erreur", "Échec du téléchargement");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div className="p-6 bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50">
           <FileText size={48} className="text-indigo-200 mb-6 mx-auto" />
           <p className="text-slate-400 font-bold tracking-tight">Analyse des registres...</p>
        </div>
      </div>
    );
  }

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

  return (
    <div className="animate-in fade-in duration-700 space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-600 rounded-xl shadow-lg shadow-rose-600/20 rotate-3">
                 <Receipt className="text-white" size={24} />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight italic">Journal des Factures</h1>
           </div>
           <p className="text-slate-500 font-medium ml-1">Consultez et gérez l'historique de vos ventes</p>
        </div>

        {/* Stats Summary Area */}
        <div className="flex items-center gap-4">
           <div className="px-6 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Volume Total</p>
              <h4 className="text-2xl font-black text-slate-900 tracking-tighter">
                {totalInvoiced.toLocaleString()} <span className="text-xs text-slate-400 ml-1">CFA</span>
              </h4>
           </div>
           <div className="px-6 py-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl shadow-indigo-600/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Documents</p>
              <h4 className="text-2xl font-black text-white tracking-tighter">
                {filteredInvoices.length} <span className="text-xs text-slate-500 ml-1">Unités</span>
              </h4>
           </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="glass-card p-6 rounded-[1.5rem] border-slate-200/60 shadow-xl shadow-slate-200/40 flex flex-col lg:flex-row items-center gap-6">
         <div className="relative group flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par N° de facture, client ou date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 transition-all focus:ring-4 focus:ring-indigo-500/5"
            />
         </div>

         <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50 w-full lg:w-auto">
            {(["all", "paid", "pending", "cancelled"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                  filterStatus === status 
                   ? "bg-white text-slate-900 shadow-lg shadow-slate-200/50 border border-slate-200/60" 
                   : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {status === "all" ? "Toutes" : 
                 status === "paid" ? "Payées" : 
                 status === "pending" ? "Attente" : "Annulées"}
              </button>
            ))}
         </div>

         <button 
           onClick={loadInvoices}
           className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95 group"
         >
            <TrendingUp size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
         </button>
      </div>

      {/* Main Content: Table List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="py-16 bg-white rounded-[1.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
             <div className="p-6 bg-slate-50 rounded-full mb-4">
               <Receipt size={40} className="text-slate-200" />
             </div>
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aucune information trouvée dans le journal</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredInvoices.map((invoice) => (
              <div 
                key={invoice.id}
                className="group p-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-600/5 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
              >
                {/* Status indicator line */}
                <div className={`absolute top-0 left-10 w-16 h-1.5 rounded-b-full ${
                  invoice.status === 'paid' ? 'bg-emerald-500' : 
                  invoice.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                }`}></div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                   <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-3xl ${
                         invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 
                         invoice.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                         <FileCheck size={28} />
                      </div>
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Facture:</p>
                           <p className="text-sm font-black text-slate-900 tracking-tight">{invoice.invoice_number}</p>
                         </div>
                         <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase flex items-center gap-2 leading-none">
                           {invoice.customer_name || "Client de passage"}
                         </h3>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                           <Calendar size={12} /> Émission
                         </p>
                         <p className="text-sm font-extrabold text-slate-700">
                           {new Date(invoice.invoice_date).toLocaleDateString("fr-FR", { day: '2-digit', month: 'long', year: 'numeric' })}
                         </p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                           <Clock size={12} /> Articles
                         </p>
                         <p className="text-sm font-extrabold text-slate-700">{invoice.item_count} unités vendues</p>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                         <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Montant Transaction</p>
                         <p className="text-2xl font-black text-slate-900 tracking-tighter">
                           {invoice.total_amount.toLocaleString()} <span className="text-xs text-slate-400 font-bold ml-1">CFA</span>
                         </p>
                      </div>
                   </div>

                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handlePrint(invoice)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all group"
                      >
                         <Printer size={16} className="group-hover:scale-110 transition-transform" />
                         <span>Imprimer</span>
                      </button>
                      <button 
                        onClick={() => handleDownloadHTML(invoice)}
                        className="flex items-center justify-center p-4 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl hover:text-indigo-600 hover:bg-white hover:border-indigo-100 transition-all group"
                        title="Télécharger l'original"
                      >
                         <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                      </button>
                      <button 
                         className="flex items-center justify-center p-4 bg-slate-50 text-slate-300 border border-slate-100 rounded-2xl hover:text-rose-500 hover:bg-rose-50 transition-all opacity-50 hover:opacity-100"
                         title="Plus d'actions"
                      >
                         <AlertCircle size={20} />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
