import React, { useState, useMemo } from 'react';
import { Invoice, Patient } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import {
  FileText,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { formatRupiah, formatDateIndo, exportToExcel } from '../../lib/exportUtils';
import { InvoiceDetailModal } from './InvoiceDetailModal';

interface InvoiceListViewProps {
  onSelectInvoice?: (invoiceId: string) => void;
  onSelectPatient?: (patientId: string) => void;
}

export const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  onSelectPatient,
}) => {
  const { invoices, patients, updateInvoiceStatus, addToast } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Map patient lookup
  const patientMap = useMemo(() => {
    return new Map(patients.map((p) => [p.id, p]));
  }, [patients]);

  const filteredInvoices = useMemo(() => {
    return invoices
      .map((inv) => ({
        ...inv,
        patient: patientMap.get(inv.patient_id),
      }))
      .filter((inv) => {
        const pName = inv.patient?.full_name?.toLowerCase() || '';
        const invNum = inv.invoice_number.toLowerCase();
        const q = searchQuery.toLowerCase();

        const matchesSearch = invNum.includes(q) || pName.includes(q);
        const matchesStatus = statusFilter === 'ALL' || inv.payment_status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
  }, [invoices, patientMap, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportExcel = () => {
    const data = filteredInvoices.map((i) => ({
      'No Invoice': i.invoice_number,
      Tanggal: i.invoice_date,
      'Jatuh Tempo': i.due_date,
      'Kode Pasien': i.patient?.patient_code || '',
      'Nama Pasien': i.patient?.full_name || '',
      Subtotal: i.subtotal,
      Diskon: i.discount,
      Total: i.total,
      'Status Pembayaran': i.payment_status,
    }));
    exportToExcel(data, `ACUCARE_Invoice_${new Date().toISOString().slice(0, 10)}`, 'Daftar Invoice');
    addToast('success', 'Export Excel Invoice Berhasil');
  };

  const handleQuickMarkPaid = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    updateInvoiceStatus(inv.id, 'Lunas');
    addToast('success', `Invoice #${inv.invoice_number} Ditandai Lunas`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoice & Tagihan Klinik</h1>
          <p className="text-xs text-slate-500 mt-1">
            Arsip tagihan resmi, monitoring pembayaran lunas/DP, dan cetak PDF struk billing.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="invoice-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari No Invoice (INV-...), nama pasien..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">Semua Status Tagihan</option>
            <option value="Lunas">Lunas (100%)</option>
            <option value="DP">DP (Uang Muka)</option>
            <option value="Belum Lunas">Belum Lunas (Tempo)</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">No. Invoice</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Nama Pasien</th>
                <th className="py-3.5 px-4">Item & Layanan</th>
                <th className="py-3.5 px-4">Grand Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">Belum ada invoice yang sesuai.</p>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {formatDateIndo(inv.invoice_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 group-hover:text-teal-700">
                        {inv.patient?.full_name || 'Pasien Umum'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{inv.patient?.patient_code}</p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 truncate">
                        {inv.items?.map((i) => `${i.quantity}x ${i.item_name}`).join(', ')}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono whitespace-nowrap">
                      {formatRupiah(inv.total)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          inv.payment_status === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.payment_status === 'DP'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.payment_status !== 'Lunas' && (
                          <button
                            onClick={(e) => handleQuickMarkPaid(inv, e)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold transition-colors"
                            title="Tandai Lunas"
                          >
                            Lunas
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Buka / Cetak Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredInvoices.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan <b>{(currentPage - 1) * itemsPerPage + 1}</b> -{' '}
              <b>{Math.min(currentPage * itemsPerPage, filteredInvoices.length)}</b> dari{' '}
              <b>{filteredInvoices.length}</b> invoice
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail & Print Modal */}
      <InvoiceDetailModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />
    </div>
  );
};
