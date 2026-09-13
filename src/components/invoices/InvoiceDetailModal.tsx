import React, { useRef, useState } from 'react';
import { Invoice } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  CreditCard,
  MessageCircle,
  PlusCircle,
  History,
} from 'lucide-react';
import { formatRupiah, formatDateIndo, generateInvoicePDF } from '../../lib/exportUtils';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { settings, patients, payments, addPayment, updateInvoiceStatus, addToast } = useClinic();
  const printRef = useRef<HTMLDivElement>(null);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState<'Transfer' | 'Cash' | 'QRIS' | 'Debit' | 'Other'>('Transfer');
  const [payNotes, setPayNotes] = useState('');

  if (!isOpen || !invoice) return null;

  const patient = patients.find((p) => p.id === invoice.patient_id);

  // Filter all payments belonging to this invoice
  const invoicePayments = payments.filter(
    (p) => p.invoice_id === invoice.id || (invoice.sale_id && p.sale_id === invoice.sale_id)
  );
  const totalPaid = invoicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = Math.max(0, invoice.total - totalPaid);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateInvoicePDF(invoice, settings, patient);
    addToast('success', 'Download PDF Invoice Berhasil');
  };

  const handleMarkAsPaid = () => {
    updateInvoiceStatus(invoice.id, 'Lunas');
    addToast('success', 'Status Invoice Diperbarui Menjadi Lunas');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      alert('Nominal pembayaran harus lebih dari 0');
      return;
    }

    addPayment({
      patient_id: invoice.patient_id,
      invoice_id: invoice.id,
      sale_id: invoice.sale_id,
      invoice_number: invoice.invoice_number,
      payment_date: payDate, // STRICTLY payment_date!
      amount: payAmount,
      payment_method: payMethod,
      status: payAmount >= remaining ? 'Lunas' : 'DP',
      notes: payNotes || (payAmount >= remaining ? `Pelunasan Invoice #${invoice.invoice_number}` : `Cicilan/DP Invoice #${invoice.invoice_number}`),
    });

    setShowPaymentForm(false);
    setPayNotes('');
  };

  // WhatsApp share link
  const cleanPhone = patient?.whatsapp ? patient.whatsapp.replace(/\D/g, '') : '';
  const waShareMsg = encodeURIComponent(
    `Halo Bapak/Ibu ${patient?.full_name || ''}, berikut rincian tagihan Invoice #${invoice.invoice_number} dari Klinik ACUCARE sebesar ${formatRupiah(
      invoice.total
    )} (Sudah dibayar: ${formatRupiah(totalPaid)}, Sisa: ${formatRupiah(remaining)}). Pembayaran dapat ditransfer ke Bank Syariah Indonesia (BSI) No. Rekening 5774090170 a/n Yogi Pangestu. Terima kasih.`
  );
  const waShareUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${waShareMsg}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto print:p-0 print:bg-white">
      <div
        id="invoice-detail-modal"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
      >
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs">
            <FileText className="w-4 h-4 text-teal-400" />
            <span className="font-mono font-bold">{invoice.invoice_number}</span>
          </div>

          <div className="flex items-center gap-2">
            {remaining > 0 && (
              <button
                onClick={() => {
                  setPayAmount(remaining);
                  setShowPaymentForm(!showPaymentForm);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                title="Catat Pembayaran / Cicilan / Pelunasan"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Catat Bayar</span>
              </button>
            )}

            {invoice.payment_status !== 'Lunas' && remaining === 0 && (
              <button
                onClick={handleMarkAsPaid}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tandai Lunas</span>
              </button>
            )}

            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              title="Kirim Ringkasan Invoice ke WhatsApp Pasien"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Kirim WA</span>
            </a>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Record Payment Form Accordion (Hidden in Print) */}
        {showPaymentForm && (
          <form
            onSubmit={handleSubmitPayment}
            className="p-4 bg-amber-50/80 border-b border-amber-200 text-xs text-amber-950 print:hidden space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold flex items-center gap-1.5 text-amber-900">
                <CreditCard className="w-4 h-4 text-amber-700" />
                <span>Catat Pembayaran Baru (Uang Masuk / Cicilan)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="text-amber-600 hover:text-amber-900 text-xs"
              >
                Tutup
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Tanggal Bayar (Uang Masuk)
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Nominal Diterima (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={remaining}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Metode Bayar</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold"
                >
                  <option value="Transfer">Transfer Bank (BSI)</option>
                  <option value="Cash">Tunai / Cash</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Debit">Debit Card</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Catatan pembayaran (contoh: DP ke-2, Pelunasan via transfer)..."
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Simpan Pemasukan
              </button>
            </div>
          </form>
        )}

        {/* Printable Invoice Sheet Body */}
        <div ref={printRef} className="p-8 space-y-6 overflow-y-auto flex-1 bg-white print:p-6 custom-scrollbar text-slate-900">
          {/* Header Clinic & Invoice Title */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-800 text-white font-black font-mono flex items-center justify-center text-sm">
                  AC
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{settings.clinic_name}</h1>
              </div>
              <p className="text-xs text-teal-800 font-bold mt-1">Klinik Akupunktur Ahli Saraf Kejepit & Stroke</p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-sm">{settings.address}</p>
              <p className="text-[11px] text-slate-600">WhatsApp: {settings.phone}</p>
            </div>

            <div className="sm:text-right">
              <span className="text-2xl font-black tracking-tight text-slate-900 uppercase">INVOICE</span>
              <p className="font-mono text-xs font-bold text-teal-800 mt-0.5">{invoice.invoice_number}</p>
              <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                <p>
                  Tanggal: <b className="text-slate-800">{formatDateIndo(invoice.invoice_date)}</b>
                </p>
                <p>
                  Jatuh Tempo: <b className="text-slate-800">{formatDateIndo(invoice.due_date)}</b>
                </p>
                <p>
                  Status:{' '}
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      invoice.payment_status === 'Lunas'
                        ? 'bg-emerald-100 text-emerald-800'
                        : invoice.payment_status === 'DP'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {invoice.payment_status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Billed To / Patient Info */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ditujukan Kepada:</h3>
            <p className="text-sm font-bold text-slate-900">{patient?.full_name || 'Pasien Umum'}</p>
            <p className="text-slate-600 mt-0.5">
              Kode Pasien: <span className="font-mono">{patient?.patient_code || '-'}</span> • WA:{' '}
              {patient?.whatsapp || '-'}
            </p>
            {patient?.address && <p className="text-slate-500 mt-0.5">Alamat: {patient.address}</p>}
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Deskripsi Layanan / Herbal</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-slate-800">{item.item_name}</p>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        {item.item_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{formatRupiah(item.unit_price)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotal, Discount & Grand Total */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            {/* Bank Info */}
            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 text-xs text-teal-950 flex-1">
              <div className="flex items-center gap-1.5 font-bold mb-1.5">
                <CreditCard className="w-4 h-4 text-teal-700" />
                <span>Instruksi Pembayaran Transfer:</span>
              </div>
              <p className="font-semibold">{settings.bank_name}</p>
              <p className="font-mono text-sm font-black text-teal-900 my-0.5 tracking-wider">
                {settings.bank_account_number}
              </p>
              <p className="text-[11px] text-teal-800">a/n {settings.bank_account_name}</p>
            </div>

            {/* Calculations Box */}
            <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatRupiah(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon:</span>
                  <span className="font-mono">- {formatRupiah(invoice.discount)}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Pajak:</span>
                  <span className="font-mono">{formatRupiah(invoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                <span>Nilai Invoice:</span>
                <span className="font-mono text-teal-800">{formatRupiah(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-800 pt-1">
                <span>Total Terbayar:</span>
                <span className="font-mono">{formatRupiah(totalPaid)}</span>
              </div>
              {remaining > 0 ? (
                <div className="flex justify-between text-xs font-bold text-rose-700 pt-1 border-t border-rose-200">
                  <span>Sisa Piutang:</span>
                  <span className="font-mono">{formatRupiah(remaining)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-[11px] font-bold text-emerald-700 pt-1">
                  <span>Status:</span>
                  <span className="font-mono uppercase tracking-wider">LUNAS</span>
                </div>
              )}
            </div>
          </div>

          {/* Riwayat Pembayaran & Cicilan (Berdasarkan Tanggal Uang Masuk) */}
          {invoicePayments.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <History className="w-3.5 h-3.5 text-teal-700" />
                  <span>Riwayat Pembayaran & Uang Masuk</span>
                </h4>
                <span className="text-[11px] font-bold text-slate-500 font-mono">
                  {invoicePayments.length} transaksi
                </span>
              </div>

              <div className="divide-y divide-slate-200/80">
                {invoicePayments.map((p, idx) => (
                  <div key={p.id || idx} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{formatRupiah(p.amount)}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                          {p.payment_method}
                        </span>
                        <span className="text-[10px] text-slate-400">({p.status})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {p.notes || `Pembayaran Invoice #${invoice.invoice_number}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-slate-700">Tgl Pembayaran:</p>
                      <p className="font-mono font-bold text-emerald-700 text-xs">
                        {formatDateIndo(p.payment_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature / Practitioner Authorization */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Terima kasih atas kunjungan Anda.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Semoga lekas pulih dan senantiasa diberikan kesehatan optimal.
              </p>
            </div>

            <div className="text-center w-48">
              <p className="text-[10px] text-slate-400 mb-10">Praktisi & Penanggung Jawab,</p>
              <p className="font-bold text-slate-900 underline">{settings.practitioner_name}</p>
              <p className="text-[10px] text-teal-800 font-medium">Ahli Akupunktur & Saraf</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
