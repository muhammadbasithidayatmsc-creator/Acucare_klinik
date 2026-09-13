import React, { useState } from 'react';
import { Patient, TherapySession, Sale, Invoice, Payment } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Phone,
  MessageCircle,
  Calendar,
  Activity,
  FileText,
  CreditCard,
  ShoppingCart,
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { formatRupiah, formatDateIndo, generateInvoicePDF } from '../../lib/exportUtils';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface PatientDetailViewProps {
  patient: Patient;
  onBack: () => void;
  onEditPatient: (patient: Patient) => void;
  onAddTherapy: (patientId: string) => void;
  onAddSale: (patientId: string) => void;
  onViewInvoice: (invoiceId: string) => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  patient,
  onBack,
  onEditPatient,
  onAddTherapy,
  onAddSale,
  onViewInvoice,
}) => {
  const { therapySessions, sales, invoices, payments, settings, deletePatient } = useClinic();
  const { isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'medical' | 'therapy' | 'payments' | 'invoices' | 'sales'>('therapy');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Filter linked records
  const patientSessions = therapySessions
    .filter((s) => s.patient_id === patient.id)
    .sort((a, b) => new Date(b.therapy_date).getTime() - new Date(a.therapy_date).getTime());

  const patientSales = sales
    .filter((s) => s.patient_id === patient.id)
    .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());

  const patientInvoices = invoices
    .filter((inv) => inv.patient_id === patient.id)
    .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());

  const patientPayments = payments
    .filter((pay) => pay.patient_id === patient.id)
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  // Metrics
  const totalBilled = patientInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = patientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const outstanding = Math.max(0, totalBilled - totalPaid);

  const cleanPhone = patient.whatsapp.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
    `Halo Bapak/Ibu ${patient.full_name}, kami dari Klinik ACUCARE...`
  )}`;

  const handleDelete = () => {
    deletePatient(patient.id);
    onBack();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-xs w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pasien</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat WhatsApp Pasien</span>
          </a>

          <button
            onClick={() => onAddTherapy(patient.id)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Sesi Terapi</span>
          </button>

          <button
            onClick={() => onAddSale(patient.id)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Transaksi Kasir</span>
          </button>

          <button
            onClick={() => onEditPatient(patient)}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors shadow-xs"
            title="Edit Pasien"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 rounded-xl transition-colors shadow-xs"
            title="Hapus Pasien"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold font-mono text-xl shadow-lg shadow-teal-900/20 shrink-0">
              {patient.gender === 'Perempuan' ? 'P' : 'L'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-black text-slate-900">{patient.full_name}</h1>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-mono font-bold border border-teal-200">
                  {patient.patient_code}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                    patient.status === 'Aktif'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : patient.status === 'Follow Up'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {patient.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {patient.gender} • Lahir: {formatDateIndo(patient.birth_date)} • WA: {patient.whatsapp}
              </p>
              <p className="text-xs text-teal-900 font-medium mt-1">
                <span className="font-bold">Keluhan:</span> {patient.main_complaint}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Financial & Therapy Summary KPI Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Kunjungan</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{patientSessions.length} Sesi</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Tagihan</span>
            <p className="text-sm md:text-base font-bold text-slate-900 mt-0.5 truncate">{formatRupiah(totalBilled)}</p>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Total Dibayar</span>
            <p className="text-sm md:text-base font-bold text-emerald-800 mt-0.5 truncate">{formatRupiah(totalPaid)}</p>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Sisa Tagihan</span>
            <p className="text-sm md:text-base font-bold text-amber-800 mt-0.5 truncate">{formatRupiah(outstanding)}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 custom-scrollbar">
        <button
          onClick={() => setActiveTab('therapy')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'therapy'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Riwayat Terapi ({patientSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil Pasien</span>
        </button>

        <button
          onClick={() => setActiveTab('medical')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'medical'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Catatan Medis & Alergi</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'invoices'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoice ({patientInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'payments'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Pembayaran ({patientPayments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'sales'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Penjualan ({patientSales.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: THERAPY HISTORY TIMELINE */}
      {activeTab === 'therapy' && (
        <div className="space-y-4">
          {/* Medical Record Disclaimer per requirement 15 */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Disclaimer Dokumentasi Layanan:</p>
              <p className="text-amber-800 mt-0.5">
                "Catatan terapi digunakan sebagai dokumentasi layanan dan bukan pengganti diagnosis medis oleh tenaga
                kesehatan yang berwenang."
              </p>
            </div>
          </div>

          {patientSessions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Activity className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">Belum Ada Sesi Terapi</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Pasien ini belum memiliki catatan riwayat tindakan akupunktur/terapi.
              </p>
              <button
                onClick={() => onAddTherapy(patient.id)}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
              >
                + Catat Sesi Terapi Pertama
              </button>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-teal-200">
              {patientSessions.map((session, index) => (
                <div
                  key={session.id}
                  className="relative bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow"
                >
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 top-6 w-5 h-5 rounded-full bg-teal-600 border-4 border-white shadow-xs" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-lg font-bold font-mono text-xs">
                        Sesi #{session.session_number}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{session.therapy_type}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>{formatDateIndo(session.therapy_date)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          Kondisi Sebelum Terapi:
                        </span>
                        <p className="text-slate-800 mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {session.condition_before}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-teal-700 uppercase tracking-wider text-[10px]">
                          Area & Titik Penjaruman (Meridian):
                        </span>
                        <p className="text-slate-800 font-medium mt-0.5 bg-teal-50/50 p-2.5 rounded-xl border border-teal-100">
                          {session.treatment_area}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          Catatan Praktisi:
                        </span>
                        <p className="text-slate-800 mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {session.practitioner_notes}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px]">
                          Respon & Kondisi Pasca Terapi:
                        </span>
                        <p className="text-slate-800 font-medium mt-0.5 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                          {session.condition_after} ({session.patient_response})
                        </p>
                      </div>
                    </div>
                  </div>

                  {session.next_plan && (
                    <div className="mt-3 p-2.5 bg-sky-50/60 rounded-xl border border-sky-100 text-xs">
                      <span className="font-bold text-sky-900">Rencana Terapi Lanjutan:</span>{' '}
                      <span className="text-sky-800">{session.next_plan}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      Biaya: <b className="text-slate-900">{formatRupiah(session.cost)}</b>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                      {session.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PROFILE DETAILS */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider pb-2 border-b border-slate-100 mb-3">
                Informasi Demografis
              </h4>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-slate-400">Nama Lengkap</dt>
                  <dd className="font-semibold text-slate-800">{patient.full_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">NIK</dt>
                  <dd className="font-mono text-slate-800">{patient.nik || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Jenis Kelamin</dt>
                  <dd className="text-slate-800">{patient.gender}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Tanggal Lahir</dt>
                  <dd className="text-slate-800">{formatDateIndo(patient.birth_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Pekerjaan</dt>
                  <dd className="text-slate-800">{patient.occupation || '-'}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider pb-2 border-b border-slate-100 mb-3">
                Kontak & Domisili
              </h4>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-slate-400">Nomor WhatsApp</dt>
                  <dd className="font-mono text-slate-800 font-semibold">{patient.whatsapp}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Nomor HP Alternatif</dt>
                  <dd className="font-mono text-slate-800">{patient.phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Email</dt>
                  <dd className="text-slate-800">{patient.email || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Alamat</dt>
                  <dd className="text-slate-800">{patient.address || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Kontak Darurat</dt>
                  <dd className="text-slate-800">{patient.emergency_contact || '-'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MEDICAL & ALLERGIES */}
      {activeTab === 'medical' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Keluhan Utama</h4>
            <p className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900">
              {patient.main_complaint}
            </p>
          </div>

          {patient.additional_complaint && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Keluhan Tambahan</h4>
              <p className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800">
                {patient.additional_complaint}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Riwayat Medis & Rontgen</h4>
              <p className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 min-h-20">
                {patient.medical_history || 'Tidak ada riwayat khusus.'}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Catatan Alergi</h4>
              <p className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-rose-900 min-h-20">
                {patient.allergy_notes || 'Tidak ada alergi yang dilaporkan.'}
              </p>
            </div>
          </div>

          {patient.important_notes && (
            <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900">
              <span className="font-bold">Instruksi Penting Praktisi:</span> {patient.important_notes}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900">Daftar Tagihan & Invoice Pasien</h3>
            <button
              onClick={() => onAddSale(patient.id)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
            >
              + Buat Tagihan Baru
            </button>
          </div>

          {patientInvoices.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Belum ada invoice yang diterbitkan.</p>
          ) : (
            <div className="space-y-3">
              {patientInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{inv.invoice_number}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        {inv.payment_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Tanggal: {formatDateIndo(inv.invoice_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-900">{formatRupiah(inv.total)}</span>
                    <button
                      onClick={() => onViewInvoice(inv.id)}
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-lg text-slate-700"
                    >
                      Buka PDF / Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-4">Riwayat Penerimaan Pembayaran</h3>
          {patientPayments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Belum ada pembayaran yang dicatat.</p>
          ) : (
            <div className="space-y-2">
              {patientPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{pay.notes || 'Pembayaran Sesi / Herbal'}</span>
                    <p className="text-[11px] text-slate-400">
                      {formatDateIndo(pay.payment_date)} • Metode: {pay.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700">{formatRupiah(pay.amount)}</span>
                    <p className="text-[10px] text-slate-400">{pay.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SALES */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Riwayat Penjualan & Transaksi Kasir</h3>
              <p className="text-xs text-slate-500 mt-0.5">Semua pembelian layanan terapi dan produk obat herbal oleh pasien ini.</p>
            </div>
            <button
              onClick={() => onAddSale(patient.id)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>+ Kasir / Beli Herbal</span>
            </button>
          </div>

          {patientSales.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="text-xs">Belum ada riwayat transaksi kasir untuk pasien ini.</p>
              <button
                onClick={() => onAddSale(patient.id)}
                className="mt-3 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold rounded-xl"
              >
                Buat Transaksi Kasir Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {patientSales.map((sale) => (
                <div key={sale.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:border-teal-300 transition-colors">
                  <div className="flex flex-wrap items-center justify-between text-xs pb-2 border-b border-slate-200/60 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                        {sale.invoice_number || 'TRX'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        sale.payment_status === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sale.payment_status === 'DP'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {sale.payment_status}
                      </span>
                      <span className="text-slate-400">• Metode: {sale.payment_method}</span>
                    </div>
                    <span className="text-slate-500 font-medium">{formatDateIndo(sale.sale_date)}</span>
                  </div>

                  <div className="py-3 space-y-1.5">
                    {sale.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
                            {item.quantity}x
                          </span>
                          <span className="font-medium">{item.item_name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">({item.item_type})</span>
                        </div>
                        <span className="font-mono font-semibold">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Total Transaksi:</span>
                      <span className="font-mono font-black text-teal-900 text-sm">{formatRupiah(sale.total)}</span>
                      {sale.discount > 0 && (
                        <span className="text-[11px] text-rose-600 font-mono">(Diskon: -{formatRupiah(sale.discount)})</span>
                      )}
                    </div>

                    {sale.invoice_id && (
                      <button
                        onClick={() => onViewInvoice(sale.invoice_id!)}
                        className="px-3 py-1 bg-white border border-slate-200 hover:bg-teal-50 hover:border-teal-300 text-xs font-semibold rounded-lg text-teal-800 flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        <span>Buka / Cetak Invoice</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Single Patient Deletion */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Data Pasien?"
        message={`Data pasien ${patient.full_name} (${patient.patient_code}) serta seluruh riwayat terapi dan tagihan terkait akan dihapus secara permanen dari database.`}
        confirmText="Hapus Permanen"
        isDestructive
      />
    </div>
  );
};
