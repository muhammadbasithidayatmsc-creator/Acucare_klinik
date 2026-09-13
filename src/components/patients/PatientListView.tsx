import React, { useState, useMemo } from 'react';
import { Patient, PatientStatus } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Eye,
  Edit,
  Trash2,
  Phone,
  MessageCircle,
  Activity,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { formatDateIndo, exportToCSV, exportToExcel, exportPatientsPDF } from '../../lib/exportUtils';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface PatientListViewProps {
  onSelectPatient: (patientId: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (patient: Patient) => void;
}

export const PatientListView: React.FC<PatientListViewProps> = ({
  onSelectPatient,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const { patients, therapySessions, deletePatient, addToast } = useClinic();
  const { isOwner } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Map each patient's latest therapy and total visits
  const patientStats = useMemo(() => {
    const map = new Map<string, { lastDate: string | null; count: number }>();
    patients.forEach((p) => {
      const sessions = therapySessions.filter((s) => s.patient_id === p.id);
      if (sessions.length === 0) {
        map.set(p.id, { lastDate: null, count: 0 });
      } else {
        const sorted = [...sessions].sort(
          (a, b) => new Date(b.therapy_date).getTime() - new Date(a.therapy_date).getTime()
        );
        map.set(p.id, { lastDate: sorted[0].therapy_date, count: sessions.length });
      }
    });
    return map;
  }, [patients, therapySessions]);

  // Filter & Sort
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        const matchesSearch =
          p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.patient_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.whatsapp.includes(searchQuery) ||
          p.main_complaint.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
        return 0;
      });
  }, [patients, searchQuery, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    const data = filteredPatients.map((p) => ({
      'Kode Pasien': p.patient_code,
      'Nama Lengkap': p.full_name,
      NIK: p.nik || '',
      Gender: p.gender,
      WhatsApp: p.whatsapp,
      'Keluhan Utama': p.main_complaint,
      Status: p.status,
      'Tanggal Daftar': p.created_at.slice(0, 10),
    }));
    exportToCSV(data, `ACUCARE_Pasien_${new Date().toISOString().slice(0, 10)}`);
    addToast('success', 'Export CSV Berhasil');
  };

  const handleExportExcel = () => {
    const data = filteredPatients.map((p) => ({
      'Kode Pasien': p.patient_code,
      'Nama Lengkap': p.full_name,
      NIK: p.nik || '',
      Gender: p.gender,
      WhatsApp: p.whatsapp,
      'Keluhan Utama': p.main_complaint,
      Status: p.status,
      'Tanggal Daftar': p.created_at.slice(0, 10),
    }));
    exportToExcel(data, `ACUCARE_Pasien_${new Date().toISOString().slice(0, 10)}`, 'Data Pasien');
    addToast('success', 'Export Excel Berhasil');
  };

  const handleExportPDF = () => {
    exportPatientsPDF(filteredPatients);
    addToast('success', 'Export PDF Berhasil');
  };

  const confirmDeletePatient = () => {
    if (patientToDelete) {
      deletePatient(patientToDelete.id);
      setPatientToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Data Pasien</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data registrasi, riwayat saraf & stroke, serta dokumen tindakan pasien.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Dropdown Group */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Export ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Export ke CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Export ke PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>

          <button
            id="patient-add-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Pasien</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="patient-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama, ACU-..., No WA, keluhan..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Selesai">Selesai</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="newest">Terbaru Terdaftar</option>
              <option value="oldest">Terlama Terdaftar</option>
              <option value="name">Nama (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Patient ID</th>
                <th className="py-3.5 px-4">Nama Pasien</th>
                <th className="py-3.5 px-4">WhatsApp</th>
                <th className="py-3.5 px-4">Gender</th>
                <th className="py-3.5 px-4">Keluhan Utama</th>
                <th className="py-3.5 px-4">Terapi Terakhir</th>
                <th className="py-3.5 px-4 text-center">Kunjungan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold">Tidak ada pasien yang cocok dengan kriteria.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba ubah kata kunci atau filter status.</p>
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((p) => {
                  const stat = patientStats.get(p.id);
                  const cleanPhone = p.whatsapp.replace(/\D/g, '');
                  const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-teal-50/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectPatient(p.id)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                        {p.patient_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {p.full_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 font-mono"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{p.whatsapp}</span>
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{p.gender}</td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="line-clamp-1 text-slate-700 font-medium">{p.main_complaint}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {stat?.lastDate ? formatDateIndo(stat.lastDate) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {stat?.count || 0}x
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            p.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'Follow Up'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectPatient(p.id)}
                            className="p-1.5 hover:bg-teal-100 text-teal-700 rounded-lg transition-colors"
                            title="Buka Detail & Rekam Medis"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(p)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Edit Data Pasien"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPatientToDelete(p)}
                            className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                            title="Hapus Pasien"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPatients.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan <b>{(currentPage - 1) * itemsPerPage + 1}</b> -{' '}
              <b>{Math.min(currentPage * itemsPerPage, filteredPatients.length)}</b> dari{' '}
              <b>{filteredPatients.length}</b> total pasien
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        onConfirm={confirmDeletePatient}
        title="Hapus Pasien Secara Permanen?"
        message={`Data pasien ${patientToDelete?.full_name} (${patientToDelete?.patient_code}) akan dihapus secara permanen dari database.`}
        confirmText="Hapus Permanen"
        isDestructive
      />
    </div>
  );
};
