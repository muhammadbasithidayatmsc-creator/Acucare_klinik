import React, { useState } from 'react';
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
  User,
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, exportBackupJSON, importBackupJSON, resetToSampleData, addToast } = useClinic();

  const [clinicName, setClinicName] = useState(settings.clinic_name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [practitionerName, setPractitionerName] = useState(settings.practitioner_name);
  const [bankName, setBankName] = useState(settings.bank_name);
  const [bankAccountNumber, setBankAccountNumber] = useState(settings.bank_account_number);
  const [bankAccountName, setBankAccountName] = useState(settings.bank_account_name);
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(settings.invoice_footer_note);

  // WA Templates
  const [waBooking, setWaBooking] = useState(
    settings.whatsapp_template_booking ||
      'Halo Bapak/Ibu {NAMA_PASIEN}, jadwal terapi akupunktur Anda di ACUCARE telah terkonfirmasi pada {TANGGAL_TERAPI} jam {JAM}. Lokasi: Ruko Arcadia Residence A-16 Tambun Utara.'
  );
  const [waReminder, setWaReminder] = useState(
    settings.whatsapp_template_reminder ||
      'Halo Bapak/Ibu {NAMA_PASIEN}, kami mengingatkan kembali jadwal terapi saraf kejepit/stroke Anda besok di ACUCARE. Mohon hadir 10 menit sebelum waktu sesi.'
  );

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      clinic_name: clinicName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      practitioner_name: practitionerName.trim(),
      bank_name: bankName.trim(),
      bank_account_number: bankAccountNumber.trim(),
      bank_account_name: bankAccountName.trim(),
      invoice_footer_note: invoiceFooterNote.trim(),
      whatsapp_template_booking: waBooking.trim(),
      whatsapp_template_reminder: waReminder.trim(),
    });
    addToast('success', 'Pengaturan Profil Klinik Berhasil Disimpan');
  };

  const handleRestoreFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonText = e.target?.result as string;
        const success = importBackupJSON(jsonText);
        if (success) {
          addToast('success', 'Database Klinik Berhasil Dipulihkan dari Backup');
        } else {
          addToast('error', 'Format File Backup Tidak Sesuai');
        }
      } catch (err) {
        addToast('error', 'Gagal memproses file backup');
      }
    };
    reader.readAsText(file);
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
          Konfigurasi identitas ACUCARE, rekening BSI Yogi Pangestu, template pesan WhatsApp, dan pencadangan database.
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
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Praktisi / Penanggung Jawab</label>
              <input
                type="text"
                required
                value={practitionerName}
                onChange={(e) => setPractitionerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Booking Klinik</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Praktik</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Bank & Payment Information */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-teal-600" />
            <span>Rekening Pembayaran Pasien (Dicetak di Invoice)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bank</label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="BSI"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening</label>
              <input
                type="text"
                required
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="5774090170"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-teal-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Atas Nama Pemilik Rekening</label>
              <input
                type="text"
                required
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="Yogi Pangestu"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Kaki Invoice</label>
            <input
              type="text"
              value={invoiceFooterNote}
              onChange={(e) => setInvoiceFooterNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* WhatsApp Templates */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Template Pesan WhatsApp Otomatis</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Template Konfirmasi Booking / Jadwal Terapi
            </label>
            <textarea
              rows={3}
              value={waBooking}
              onChange={(e) => setWaBooking(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Variabel: <code>{`{NAMA_PASIEN}`}</code>, <code>{`{TANGGAL_TERAPI}`}</code>, <code>{`{JAM}`}</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Template Pengingat Jadwal Pasca Evaluasi (Follow-up)
            </label>
            <textarea
              rows={3}
              value={waReminder}
              onChange={(e) => setWaReminder(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
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

      {/* Database Backup & Disaster Recovery */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Database Backup & Disaster Recovery</h3>
            <p className="text-xs text-slate-400">
              Pencadangan seluruh data pasien, rekam medis, inventori, dan invoice dalam format JSON terenkripsi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Download JSON Backup */}
          <button
            onClick={() => {
              exportBackupJSON();
              addToast('success', 'File Backup JSON Berhasil Diunduh');
            }}
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl flex flex-col items-center text-center gap-2 transition-all hover:border-teal-500"
          >
            <Download className="w-6 h-6 text-teal-400" />
            <span className="font-bold text-xs text-white">Download Backup JSON</span>
            <span className="text-[10px] text-slate-400">Simpan cadangan lokal ke komputer Anda</span>
          </button>

          {/* Restore JSON Backup */}
          <div className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl flex flex-col items-center text-center gap-2 transition-all hover:border-sky-500 relative">
            <UploadCloud className="w-6 h-6 text-sky-400" />
            <span className="font-bold text-xs text-white">Restore dari Backup</span>
            <span className="text-[10px] text-slate-400">Pulihkan database dari file .json</span>
            <input
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && handleRestoreFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Reset Demo Data */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="p-4 bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-700/60 rounded-2xl flex flex-col items-center text-center gap-2 transition-all"
          >
            <RotateCcw className="w-6 h-6 text-rose-400" />
            <span className="font-bold text-xs text-rose-300">Reset Demo Awal</span>
            <span className="text-[10px] text-slate-400">Muat ulang data contoh klinik bawaan</span>
          </button>
        </div>
      </div>

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
