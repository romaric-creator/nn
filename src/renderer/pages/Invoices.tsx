import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Eye,
  ArrowLeft,
  Trash2,
  Filter,
  Calendar,
} from "lucide-react";
import { useNotify } from "../components/NotificationProvider";

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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, filterStatus, dateRange, dateFrom, dateTo]);

  const getDateRangeValues = () => {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    switch (dateRange) {
      case "today":
        return {
          from: startOfDay.toISOString().split("T")[0],
          to: endOfDay.toISOString().split("T")[0],
        };
      case "week": {
        const firstDay = new Date(today);
        firstDay.setDate(today.getDate() - today.getDay());
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 7);
        return {
          from: firstDay.toISOString().split("T")[0],
          to: lastDay.toISOString().split("T")[0],
        };
      }
      case "month": {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return {
          from: firstDay.toISOString().split("T")[0],
          to: lastDay.toISOString().split("T")[0],
        };
      }
      case "all":
      default:
        return { from: "", to: "" };
    }
  };

  const handleQuickDateFilter = (range: DateRange) => {
    setDateRange(range);
    if (range === "all") {
      setDateFrom("");
      setDateTo("");
    } else {
      const { from, to } = getDateRangeValues();
      setDateFrom(from);
      setDateTo(to);
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    const res = await window.electronAPI.invoke("invoice:getAll");
    if (res?.success) {
      setInvoices(res.data || []);
    } else {
      notify("error", "Erreur", "Impossible de charger les factures");
    }
    setLoading(false);
  };

  const filterInvoices = () => {
    let filtered = invoices;

    // Filtre par statut
    if (filterStatus !== "all") {
      filtered = filtered.filter((inv) => inv.status === filterStatus);
    }

    // Filtre par recherche (numéro, client, date)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(term) ||
          (inv.customer_name?.toLowerCase() || "").includes(term) ||
          inv.invoice_date.includes(term),
      );
    }

    setFilteredInvoices(filtered);
  };

  const handlePrint = async (invoice: Invoice) => {
    const htmlRes = await window.electronAPI.invoke(
      "invoice:generateHTML",
      invoice.id,
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
    const htmlRes = await window.electronAPI.invoke(
      "invoice:generateHTML",
      invoice.id,
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
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto pt-8 pb-32 page-fade-in flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-black uppercase">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-8 pb-32 page-fade-in">
      <header className="border-b-8 border-[#1A1A1A] pb-10 mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-[#1A1A1A] text-white shadow-[8px_8px_0px_#FF5F1F]">
            <FileText size={32} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-[#1A1A1A] uppercase italic">
            Historique Factures
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Chercher numéro, client, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-brut w-full pl-6 py-4"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "paid", "pending", "cancelled"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex-1 py-4 font-black text-[10px] uppercase border-4 transition-all ${
                    filterStatus === status
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "bg-white border-[#1A1A1A] text-[#1A1A1A]"
                  }`}
                >
                  {status === "all"
                    ? "Tous"
                    : status === "paid"
                      ? "Payées"
                      : status === "pending"
                        ? "En attente"
                        : "Annulées"}
                </button>
              ),
            )}
          </div>

          <div className="text-right flex items-center justify-end gap-4">
            <span className="font-black text-[#1A1A1A]">
              {filteredInvoices.length}
            </span>
            <span className="text-xs font-black uppercase opacity-60">
              Facturettes
            </span>
          </div>
        </div>
      </header>

      {filteredInvoices.length === 0 ? (
        <div className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs border-4 border-dashed border-[#1A1A1A]">
          Aucune facture trouvée
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white border-4 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all"
            >
              <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <div className="text-[10px] font-black uppercase opacity-60 mb-1">
                    N° Facture
                  </div>
                  <div className="font-black text-lg">
                    {invoice.invoice_number}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase opacity-60 mb-1">
                    Client
                  </div>
                  <div className="font-black text-sm">
                    {invoice.customer_name || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase opacity-60 mb-1">
                    Date
                  </div>
                  <div className="font-black text-sm">
                    {new Date(invoice.invoice_date).toLocaleDateString("fr-FR")}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase opacity-60 mb-1">
                    Montant
                  </div>
                  <div className="font-black text-xl text-[#FF5F1F]">
                    {invoice.total_amount.toLocaleString()} CFA
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrint(invoice)}
                    className="flex-1 bg-[#1A1A1A] text-white p-3 font-black text-[10px] uppercase hover:bg-[#FF5F1F] transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    Imprimer
                  </button>
                  <button
                    onClick={() => handleDownloadHTML(invoice)}
                    className="flex-1 bg-[#FF5F1F] text-white p-3 font-black text-[10px] uppercase hover:bg-[#1A1A1A] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    HTML
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
