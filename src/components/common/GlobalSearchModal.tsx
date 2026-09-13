import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Search, User, FileText, Sparkles, Package, Activity, ArrowRight, X } from 'lucide-react';
import { formatRupiah } from '../../lib/exportUtils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, itemId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { patients, services, herbalProducts, invoices, therapySessions } = useClinic();
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { patients: [], services: [], herbal: [], invoices: [], sessions: [] };

    const matchedPatients = patients.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.patient_code.toLowerCase().includes(q) ||
        p.whatsapp.includes(q) ||
        p.main_complaint.toLowerCase().includes(q)
    );

    const matchedServices = services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );

    const matchedHerbal = herbalProducts.filter(
      (h) => h.name.toLowerCase().includes(q) || h.sku.toLowerCase().includes(q) || h.category.toLowerCase().includes(q)
    );

    const matchedInvoices = invoices.filter(
      (inv) => inv.invoice_number.toLowerCase().includes(q)
    );

    const matchedSessions = therapySessions.filter(
      (ses) => ses.complaint.toLowerCase().includes(q) || ses.treatment_area.toLowerCase().includes(q)
    );

    return {
      patients: matchedPatients.slice(0, 5),
      services: matchedServices.slice(0, 4),
      herbal: matchedHerbal.slice(0, 4),
      invoices: matchedInvoices.slice(0, 4),
      sessions: matchedSessions.slice(0, 4),
    };
  }, [query, patients, services, herbalProducts, invoices, therapySessions]);

  if (!isOpen) return null;

  const totalResults =
    searchResults.patients.length +
    searchResults.services.length +
    searchResults.herbal.length +
    searchResults.invoices.length +
    searchResults.sessions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="global-search-modal"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-teal-600 shrink-0" />
          <input
            id="global-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pasien, kode ACU-..., invoice, layanan, herbal..."
            className="flex-1 text-base bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-medium"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
            ESC
          </kbd>
        </div>

        {/* Search Results Area */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {!query.trim() ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-medium">Ketik kata kunci pencarian</p>
              <p className="text-xs text-slate-400 mt-1">Cari nama pasien, no WhatsApp, keluhan, layanan, atau invoice</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-10 text-center text-slate-500">
              <p className="text-sm font-medium">Tidak ditemukan hasil untuk "{query}"</p>
            </div>
          ) : (
            <>
              {/* Patients */}
              {searchResults.patients.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <User className="w-3.5 h-3.5" /> Pasien ({searchResults.patients.length})
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.patients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onNavigate('patients', p.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-teal-50/70 border border-slate-100 hover:border-teal-200 transition-all text-left group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 group-hover:text-teal-800">{p.full_name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-600 font-semibold">
                              {p.patient_code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            WA: {p.whatsapp} • {p.main_complaint}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {searchResults.invoices.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <FileText className="w-3.5 h-3.5" /> Invoice ({searchResults.invoices.length})
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.invoices.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => {
                          onNavigate('invoices', inv.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-all text-left group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 font-mono">{inv.invoice_number}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-medium">
                              {inv.payment_status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Total: {formatRupiah(inv.total)} • Tanggal: {inv.invoice_date}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {searchResults.services.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Layanan ({searchResults.services.length})
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.services.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onNavigate('services');
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-all text-left group"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{s.name}</span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {s.category} • {s.duration} mnt • {formatRupiah(s.price)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Herbal Products */}
              {searchResults.herbal.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <Package className="w-3.5 h-3.5" /> Produk Herbal ({searchResults.herbal.length})
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.herbal.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => {
                          onNavigate('herbal');
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-all text-left group"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{h.name}</span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            SKU: {h.sku} • Stok: {h.stock} {h.unit} • Jual: {formatRupiah(h.selling_price)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tekan tombol panah atau klik untuk membuka</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 font-medium text-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
