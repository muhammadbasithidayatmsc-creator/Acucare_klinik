import React, { useState, useMemo } from 'react';
import { TherapySession, Patient } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import {
  Activity,
  Search,
  Plus,
  Filter,
  Calendar,
  User,
  Edit,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { formatRupiah, formatDateIndo, exportToExcel, exportToCSV } from '../../lib/exportUtils';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface TherapyListViewProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (session: TherapySession) => void;
  onSelectPatient: (patientId: string) => void;
}

export const TherapyListView: React.FC<TherapyListViewProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onSelectPatient,
}) => {
  const { therapySessions, patients, deleteTherapySession, addToast } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [responseFilter, setResponseFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [sessionToDelete, setSessionToDelete] = useState<TherapySession | null>(null);

  // Map patient data
  const patientMap = useMemo(() => {
    return new Map(patients.map((p) => [p.id, p]));
  }, [patients]);

  // Filtered & Sorted
  const filteredSessions = useMemo(() => {
    return therapySessions
      .map((ses) => ({
        ...ses,
        patient: patientMap.get(ses.patient_id),
      }))
      .filter((ses) => {
        const pName = ses.patient?.full_name?.toLowerCase() || '';
        const pCode = ses.patient?.patient_code?.toLowerCase() || '';
        const q = searchQuery.toLowerCase();

        const matchesSearch =
          pName.includes(q) ||
          pCode.includes(q) ||
          ses.therapy_type.toLowerCase().includes(q) ||
          ses.treatment_area.toLowerCase().includes(q) ||
          ses.condition_before.toLowerCase().includes(q);

        const matchesResponse = responseFilter === 'ALL' || ses.patient_response === responseFilter;

        return matchesSearch && matchesResponse;
      })
      .sort((a, b) => new Date(b.therapy_date).getTime() - new Date(a.therapy_date).getTime());
  }, [therapySessions, patientMap, searchQuery, responseFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage) || 1;
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportExcel = () => {
    const data = filteredSessions.map((s) => ({
      Tanggal: s.therapy_date,
      'Kode Pasien': s.patient?.patient_code || '',
      'Nama Pasien': s.patient?.full_name || '',
      'Sesi Ke': s.session_number,
      'Jenis Terapi': s.therapy_type,
      'Titik Penjaruman': s.treatment_area,
      'Kondisi Sebelum': s.condition_before,
      'Kondisi Setelah': s.condition_after,
      'Respon Pasien': s.patient_response,
      Biaya: s.cost,
      Status: s.payment_status,
    }));
    exportToExcel(data, `ACUCARE_Sesi_Terapi_${new Date().toISOString().slice(0, 10)}`, 'Sesi Terapi');
    addToast('success', 'Export Excel Sesi Terapi Berhasil');
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      deleteTherapySession(sessionToDelete.id);
      setSessionToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dokumentasi Sesi Terapi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Catatan tindakan meridian akupunktur saraf kejepit, stroke, titik penjaruman, dan respon klinis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            id="therapy-add-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Sesi Baru</span>
          </button>
        </div>
      </div>

      {/* Official Disclaimer */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <b>Disclaimer Dokumentasi Layanan:</b> Catatan terapi digunakan sebagai dokumentasi layanan internal dan
          bukan pengganti diagnosis medis oleh tenaga kesehatan yang berwenang.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="therapy-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari pasien, titik akupunktur (BL25, GB30..), keluhan..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={responseFilter}
            onChange={(e) => {
              setResponseFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">Semua Respon Pasien</option>
            <option value="Membaik Signifikan">Membaik Signifikan</option>
            <option value="Membaik">Membaik</option>
            <option value="Tetap">Tetap</option>
            <option value="Perlu Evaluasi">Perlu Evaluasi</option>
          </select>
        </div>
      </div>

      {/* Therapy Sessions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Pasien</th>
                <th className="py-3.5 px-4">Sesi Ke</th>
                <th className="py-3.5 px-4">Layanan & Tindakan</th>
                <th className="py-3.5 px-4">Titik Penjaruman</th>
                <th className="py-3.5 px-4">Respon Klinis</th>
                <th className="py-3.5 px-4">Biaya</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">Belum ada catatan sesi terapi yang cocok.</p>
                  </td>
                </tr>
              ) : (
                paginatedSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-teal-50/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                      {formatDateIndo(s.therapy_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => s.patient_id && onSelectPatient(s.patient_id)}
                        className="text-left group"
                      >
                        <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {s.patient?.full_name || 'Pasien'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{s.patient?.patient_code}</p>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-800 font-mono font-bold rounded-md">
                        #{s.session_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800">{s.therapy_type}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{s.condition_before}</p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-mono text-[11px] text-teal-900 bg-teal-50/60 px-2 py-1 rounded-md border border-teal-100 line-clamp-1">
                        {s.treatment_area}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          s.patient_response === 'Membaik Signifikan'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.patient_response === 'Membaik'
                            ? 'bg-teal-100 text-teal-800'
                            : s.patient_response === 'Tetap'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.patient_response}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {formatRupiah(s.cost)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenEditModal(s)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Edit Sesi"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSessionToDelete(s)}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                          title="Hapus Sesi"
                        >
                          <Trash2 className="w-4 h-4" />
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
        {filteredSessions.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan <b>{(currentPage - 1) * itemsPerPage + 1}</b> -{' '}
              <b>{Math.min(currentPage * itemsPerPage, filteredSessions.length)}</b> dari{' '}
              <b>{filteredSessions.length}</b> total sesi tindakan
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Catatan Sesi Terapi?"
        message={`Sesi tindakan #${sessionToDelete?.session_number} pada tanggal ${
          sessionToDelete?.therapy_date
        } akan dihapus secara permanen dari database.`}
        confirmText="Hapus Sesi"
        isDestructive
      />
    </div>
  );
};
