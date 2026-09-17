import React, { useState, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  Settings,
  Building2,
  Phone,
  CreditCard,
  MessageSquare,
  Database,
  Download,
  UploadCloud,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  Calendar,
  Layers,
  X,
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { DatabaseBackup } from '../../types';
import { formatDateIndo } from '../../lib/exportUtils';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportBackupPDF,
    exportBackupJSON,
    exportBackupExcel,
    validateBackupJSON,
    restoreDatabase,
    resetToSampleData,
    addToast,
  } = useClinic();

  const [clinicName, setClinicName] = useState(settings.clinic_name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone || settings.whatsapp);
  const [practitionerName, setPractitionerName] = useState(settings.practitioner_name);
  const [bankName, setBankName] = useState(settings.bank_name);
  const [bankAccountNumber, setBankAccountNumber] = useState(
    settings.bank_account_number || settings.bank_account
  );
  const [bankAccountName, setBankAccountName] = useState(
    settings.bank_account_name || settings.bank_holder
  );
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(
    settings.invoice_footer_note || settings.invoice_footer
  );

  // WA Templates
  const [waBooking, setWaBooking] = useState(
    settings.whatsapp_template_booking ||
      'Halo Bapak/Ibu {NAMA_PASIEN}, jadwal terapi akupunktur Anda di ACUCARE telah terkonfirmasi pada {TANGGAL_TERAPI} jam {JAM}. Lokasi: Ruko Arcadia Residence A-16 Tambun Utara.'
  );
  const [waReminder, setWaReminder] = useState(
    settings.whatsapp_template_reminder ||
      'Halo Bapak/Ibu {NAMA_PASIEN}, kami mengingatkan kembali jadwal terapi saraf kejepit/stroke Anda besok di ACUCARE. Mohon hadir 10 menit sebelum waktu sesi.'
  );

  // Modals state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<{
    backup: DatabaseBackup;
    counts: any;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      clinic_name: clinicName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      whatsapp: phone.trim() || settings.whatsapp,
      practitioner_name: practitionerName.trim(),
      bank_name: bankName.trim(),
      bank_account_number: bankAccountNumber.trim(),
      bank_account: bankAccountNumber.trim() || settings.bank_account,
      bank_account_name: bankAccountName.trim(),
      bank_holder: bankAccountName.trim() || settings.bank_holder,
      invoice_footer_note: invoiceFooterNote.trim(),
      invoice_footer: invoiceFooterNote.trim() || settings.invoice_footer,
      whatsapp_template_booking: waBooking.trim(),
      whatsapp_template_reminder: waReminder.trim(),
    });
    addToast('success', 'Pengaturan Profil Klinik Berhasil Disimpan');
  };

  // Step 1: Handle Selecting JSON File & Validating
  const handleFileSelect = (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      addToast('error', 'Format Tidak Didukung', 'Harap pilih file cadangan dengan ekstensi .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const validation = validateBackupJSON(text);

        if (!validation.isValid || !validation.backup) {
          addToast('error', 'Validasi Gagal', validation.message);
          return;
        }

        setPendingRestore({
          backup: validation.backup,
          counts: validation.counts,
          fileName: file.name,
        });
        setIsRestoreModalOpen(true);
      } catch (err: any) {
        addToast('error', 'Gagal Membaca File', err.message || 'File tidak dapat dibaca.');
      }
    };
    reader.onerror = () => {
      addToast('error', 'Error File', 'Terjadi kesalahan saat membaca file dari perangkat.');
    };
    reader.readAsText(file);
  };

  // Step 2: Confirm and execute restoration
  const handleConfirmRestore = () => {
    if (!pendingRestore) return;
    const result = restoreDatabase(pendingRestore.backup);
    setIsRestoreModalOpen(false);
    setPendingRestore(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmReset = () => {
    resetToSampleData();
    setIsResetModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan & Backup Klinik</h1>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi identitas ACUCARE, rekening BSI Yogi Pangestu, template pesan WhatsApp, dan pencadangan database utama.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Clinic Identity & Address */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Identitas & Lokasi Klinik</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Klinik</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Praktisi Utama / Terapis</label>
              <input
                type="text"
                value={practitionerName}
                onChange={(e) => setPractitionerName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp Resmi</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Kaki Invoice (Footer)</label>
              <input
                type="text"
                value={invoiceFooterNote}
                onChange={(e) => setInvoiceFooterNote(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-teal-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Klinik</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-teal-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Bank Account Info */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-teal-600" />
            <span>Informasi Rekening Pembayaran Pasien</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bank</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening</label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-teal-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Atas Nama Pemilik Rekening</label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-teal-500"
                required
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Templates */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span>Template Pesan WhatsApp Otomatis</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pesan Konfirmasi Jadwal / Booking
              </label>
              <textarea
                value={waBooking}
                onChange={(e) => setWaBooking(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-teal-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Variabel: <code>{'{NAMA_PASIEN}'}</code>, <code>{'{TANGGAL_TERAPI}'}</code>, <code>{'{JAM}'}</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Pengingat Sesi (Reminder H-1)</label>
              <textarea
                value={waReminder}
                onChange={(e) => setWaReminder(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-900/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* SECTION CADANGAN: PRIMARY BACKUP (PDF) & TECHNICAL BACKUP (JSON / EXCEL) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Database Backup & Pemulihan Sistem</h3>
              <p className="text-xs text-slate-400">
                Solusi cadangan resmi ACUCARE: Dokumen arsip lengkap PDF, restore database JSON, dan ekspor spreadsheet.
              </p>
            </div>
          </div>

          {settings.last_backup_date && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Backup Terakhir</span>
              <span className="text-xs font-mono text-teal-300">
                {formatDateIndo(settings.last_backup_date)}
              </span>
            </div>
          )}
        </div>

        {/* 1. PRIMARY BACKUP (DOKUMEN UTAMA PDF) */}
        <div className="bg-linear-to-br from-teal-950/60 to-slate-800/60 border border-teal-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>PRIMARY BACKUP (CADANGAN UTAMA RESMI)</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
              Rekomendasi Utama
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Menghasilkan dokumen PDF multi-halaman lengkap yang memuat <b>100% seluruh data aktual</b>: Profil klinik, data lengkap seluruh pasien, rekam medis keluhan, riwayat terapi meridian, master layanan, inventori herbal & stok, transaksi faktur, kwitansi pembayaran masuk (termasuk DP), pengeluaran, dan rekapitulasi laba bersih.
          </p>

          <div className="pt-2">
            <button
              onClick={exportBackupPDF}
              className="w-full sm:w-auto px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileText className="w-5 h-5 text-slate-950" />
              <span>DOWNLOAD FULL BACKUP PDF</span>
            </button>
          </div>
        </div>

        {/* 2. TECHNICAL BACKUP & RESTORE / PINDAH HP */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>TECHNICAL BACKUP & DATABASE RESTORE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Download JSON Backup */}
            <button
              onClick={exportBackupJSON}
              className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl flex flex-col items-center text-center gap-2 transition-all hover:border-teal-500 hover:scale-[1.02] group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:bg-teal-500/20">
                <Download className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-white">Download Backup JSON</span>
              <span className="text-[10px] text-slate-400">
                Arsip teknis database lengkap untuk restore atau pindah HP
              </span>
            </button>

            {/* Restore JSON Backup */}
            <div className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl flex flex-col items-center text-center gap-2 transition-all hover:border-sky-500 hover:scale-[1.02] relative group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:bg-sky-500/20">
                <UploadCloud className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-white">Pulihkan Database dari Backup</span>
              <span className="text-[10px] text-slate-400">
                Pilih file .json cadangan untuk memulihkan seluruh data
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Export Full 12-Sheet Excel */}
            <button
              onClick={exportBackupExcel}
              className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl flex flex-col items-center text-center gap-2 transition-all hover:border-emerald-500 hover:scale-[1.02] group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-white">Download Excel (.xlsx)</span>
              <span className="text-[10px] text-slate-400">
                12 Sheet spreadsheet lengkap untuk Excel & Google Sheets
              </span>
            </button>
          </div>
        </div>

        {/* Reset Danger Zone */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <p className="text-[11px] text-slate-400">
            Perlu mengembalikan ke data awal peragaan klinik ACUCARE?
          </p>
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-600/60 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Reset ke Demo Awal</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL PREVIEW & KONFIRMASI RESTORE DATABASE JSON (PINDAH HP / RECOVERY) */}
      {/* ========================================================================= */}
      {isRestoreModalOpen && pendingRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Konfirmasi Pemulihan Database</h3>
                  <p className="text-xs text-slate-500">
                    File: <code className="font-mono text-teal-700">{pendingRestore.fileName}</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Breakdown Counts Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 font-bold border-b border-slate-100 pb-2">
                <span>Rincian Data yang Akan Dipulihkan:</span>
                <span className="text-[10px] text-teal-600 font-semibold">
                  Versi Backup: {pendingRestore.backup.version || '2.0.0'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Pasien</span>
                  <span className="text-base font-black text-slate-800">
                    {pendingRestore.counts.patients} Orang
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Rekam Medis</span>
                  <span className="text-base font-black text-slate-800">
                    {pendingRestore.counts.medical_records} Rekam
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Sesi Terapi</span>
                  <span className="text-base font-black text-slate-800">
                    {pendingRestore.counts.therapy_sessions} Tindakan
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Layanan Klinis</span>
                  <span className="text-base font-black text-slate-800">
                    {pendingRestore.counts.services} Item
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Produk Herbal</span>
                  <span className="text-base font-black text-slate-800">
                    {pendingRestore.counts.herbal_products} Produk
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Stok Fisik</span>
                  <span className="text-base font-black text-slate-800">
                    {pendingRestore.counts.stock} Pcs
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Penjualan</span>
                  <span className="text-base font-black text-slate-800">
                    {pendingRestore.counts.sales} Transaksi
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Invoice Terbit</span>
                  <span className="text-base font-black text-slate-800">
                    {pendingRestore.counts.invoices} Faktur
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Pembayaran Diterima</span>
                  <span className="text-base font-black text-slate-800">
                    {pendingRestore.counts.payments} Kwitansi
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">Pemasukan Kas</span>
                  <span className="text-base font-black text-slate-800">
                    {pendingRestore.counts.income} Catatan
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl sm:col-span-2">
                  <span className="text-[10px] text-slate-500 block font-semibold">Pengeluaran Biaya</span>
                  <span className="text-base font-black text-slate-800">
                    {pendingRestore.counts.expenses} Catatan
                  </span>
                </div>
              </div>
            </div>

            {/* Relationship Integrity Notice */}
            <div className="p-3.5 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <p className="text-xs text-teal-900 leading-relaxed">
                <b>Integritas Relasi Dijamin:</b> Seluruh relasi ID pasien, nomor faktur invoice, catatan terapi, dan kwitansi pembayaran akan dipulihkan secara sinkron tanpa duplikasi data.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-900/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi & Pulihkan Database</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset ke Data Sample Bawaan?"
        message="Tindakan ini akan mengembalikan seluruh pasien, riwayat terapi, dan inventori ke data demo awal ACUCARE."
        confirmText="Ya, Reset Database"
        isDestructive
      />
    </div>
  );
};
