import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FileUp,
  Database,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { exportToCSV, exportToExcel, exportPatientsPDF } from '../../lib/exportUtils';
import { Patient } from '../../types';

export const ImportExportView: React.FC = () => {
  const {
    patients,
    addPatient,
    therapySessions,
    sales,
    expenses,
    invoices,
    herbalProducts,
    exportBackupPDF,
    exportBackupExcel,
    exportBackupJSON,
    addToast,
  } = useClinic();

  const [activeSubTab, setActiveSubTab] = useState<'import' | 'export'>('import');

  // Import flow states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Download sample template
  const handleDownloadTemplate = () => {
    const sampleRows = [
      {
        'Nama Lengkap': 'Budi Santoso',
        WhatsApp: '081299887766',
        NIK: '3275010203040001',
        Gender: 'Laki-laki',
        'Tanggal Lahir': '1980-05-15',
        'Keluhan Utama': 'Saraf kejepit lumbal L4-L5, nyeri pinggang ke paha kanan',
        'Keluhan Tambahan': 'Kebas jari kaki',
        Alamat: 'Tambun Selatan, Bekasi',
        Status: 'Aktif',
      },
      {
        'Nama Lengkap': 'Siti Rahayu',
        WhatsApp: '081388776655',
        NIK: '3275010203040002',
        Gender: 'Perempuan',
        'Tanggal Lahir': '1975-11-20',
        'Keluhan Utama': 'Pasca Stroke iskemik 3 bulan, tangan kiri lemah',
        'Keluhan Tambahan': 'Tekanan darah cenderung tinggi',
        Alamat: 'Karangsatria, Bekasi',
        Status: 'Aktif',
      },
    ];
    exportToCSV(sampleRows, 'Template_Import_Pasien_ACUCARE');
    addToast('info', 'Template Import Pasien CSV Diunduh');
  };

  // 2. Handle File Upload (Drag/Drop or Select)
  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setValidationErrors([]);
    setParsedRows([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          setValidationErrors(['File kosong atau format tidak dapat dibaca.']);
          return;
        }

        // Validate rows
        const errors: string[] = [];
        const validRows: any[] = [];

        json.forEach((row: any, idx) => {
          const rowNumber = idx + 2; // header is row 1
          const name = row['Nama Lengkap'] || row['nama'] || row['Nama'] || row['Full Name'];
          const wa = row['WhatsApp'] || row['whatsapp'] || row['No WA'] || row['Phone'] || row['Telepon'];
          const complaint = row['Keluhan Utama'] || row['keluhan'] || row['Keluhan'] || row['Main Complaint'];

          if (!name) {
            errors.push(`Baris ${rowNumber}: Nama Lengkap wajib diisi.`);
          }
          if (!wa) {
            errors.push(`Baris ${rowNumber}: Nomor WhatsApp wajib diisi.`);
          }
          if (!complaint) {
            errors.push(`Baris ${rowNumber}: Keluhan Utama wajib diisi.`);
          }

          validRows.push({
            full_name: String(name || '').trim(),
            whatsapp: String(wa || '').trim(),
            nik: row['NIK'] ? String(row['NIK']).trim() : undefined,
            gender: row['Gender'] === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
            birth_date: row['Tanggal Lahir'] || undefined,
            main_complaint: String(complaint || 'Pemeriksaan Saraf').trim(),
            additional_complaint: row['Keluhan Tambahan'] || undefined,
            address: row['Alamat'] || undefined,
            status: row['Status'] || 'Aktif',
          });
        });

        setValidationErrors(errors);
        setParsedRows(validRows);
      } catch (err) {
        setValidationErrors(['Gagal memproses file Excel/CSV. Pastikan format file valid.']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 3. Confirm Import
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      let importedCount = 0;
      parsedRows.forEach((r) => {
        if (r.full_name && r.whatsapp) {
          addPatient(r);
          importedCount++;
        }
      });

      setIsProcessing(false);
      setSelectedFile(null);
      setParsedRows([]);
      setValidationErrors([]);
      addToast('success', `Berhasil Mengimpor ${importedCount} Pasien ke Database`);
    }, 500);
  };

  // Export handlers
  const handleExportAllPatients = () => {
    const data = patients.map((p) => ({
      'Kode Pasien': p.patient_code,
      'Nama Lengkap': p.full_name,
      Gender: p.gender,
      WhatsApp: p.whatsapp,
      'Keluhan Utama': p.main_complaint,
      Status: p.status,
      'Tanggal Terdaftar': p.created_at,
    }));
    exportToExcel(data, `ACUCARE_Semua_Pasien_${new Date().toISOString().slice(0, 10)}`, 'Pasien');
    addToast('success', 'Export Pasien Berhasil');
  };

  const handleExportAllTherapy = () => {
    const data = therapySessions.map((s) => ({
      Tanggal: s.therapy_date,
      'ID Pasien': s.patient_id,
      'Sesi Ke': s.session_number,
      'Jenis Terapi': s.therapy_type,
      'Titik Penjaruman': s.treatment_area,
      'Respon Pasien': s.patient_response,
      Biaya: s.cost,
      Status: s.payment_status,
    }));
    exportToExcel(data, `ACUCARE_Semua_Sesi_Terapi_${new Date().toISOString().slice(0, 10)}`, 'Sesi Terapi');
    addToast('success', 'Export Sesi Terapi Berhasil');
  };

  const handleExportAllHerbal = () => {
    const data = herbalProducts.map((h) => ({
      'Kode SKU': h.code,
      'Nama Produk': h.name,
      Kategori: h.category,
      'Harga Beli': h.buying_price,
      'Harga Jual': h.selling_price,
      Stok: h.stock,
      Satuan: h.unit,
    }));
    exportToExcel(data, `ACUCARE_Inventori_Herbal_${new Date().toISOString().slice(0, 10)}`, 'Herbal');
    addToast('success', 'Export Herbal Berhasil');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pusat Import & Export Data</h1>
        <p className="text-xs text-slate-500 mt-1">
          Integrasikan data lama klinik via CSV/Excel, validasi kolom, atau backup seluruh arsip ke spreadsheet.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('import')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'import'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Import Pasien (CSV / Excel)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('export')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'export'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Export Seluruh Arsip Klinik</span>
        </button>
      </div>

      {/* IMPORT TAB */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          {/* Instructions & Template Download */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Format File Import Pasien</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
                Unggah file spreadsheet (.xlsx / .csv). Pastikan kolom header memuat minimal:{' '}
                <b>Nama Lengkap, WhatsApp, Keluhan Utama</b>. Kode pasien <code>ACU-XXXXXX</code> akan di-generate otomatis.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Template CSV</span>
            </button>
          </div>

          {/* Drag & Drop File Zone */}
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 hover:border-teal-500 p-8 text-center transition-colors">
            <input
              type="file"
              id="file-import-input"
              accept=".csv, .xlsx, .xls"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
            <label htmlFor="file-import-input" className="cursor-pointer block space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <FileUp className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Klik untuk Pilih File atau Drag & Drop ke sini'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Mendukung format Microsoft Excel (.xlsx) dan CSV (.csv)</p>
              </div>
            </label>
          </div>

          {/* Validation Errors If Any */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-800 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Peringatan Validasi ({validationErrors.length} Catatan):</span>
              </div>
              {validationErrors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-rose-700">
                  • {err}
                </p>
              ))}
            </div>
          )}

          {/* Live Preview Table */}
          {parsedRows.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Preview Data Siap Diimpor ({parsedRows.length} Pasien)
                  </h3>
                  <p className="text-xs text-slate-500">Tinjau 5 baris pertama sebelum memasukkan ke database</p>
                </div>

                <button
                  onClick={handleConfirmImport}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-900/20 flex items-center gap-2 transition-all"
                >
                  {isProcessing ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Konfirmasi & Simpan ke Database</span>
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-3">WhatsApp</th>
                      <th className="py-2.5 px-3">Gender</th>
                      <th className="py-2.5 px-3">Keluhan Utama</th>
                      <th className="py-2.5 px-3">Alamat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{row.full_name}</td>
                        <td className="py-2.5 px-3 font-mono">{row.whatsapp}</td>
                        <td className="py-2.5 px-3">{row.gender}</td>
                        <td className="py-2.5 px-3 max-w-xs truncate">{row.main_complaint}</td>
                        <td className="py-2.5 px-3 text-slate-500">{row.address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXPORT TAB */}
      {activeSubTab === 'export' && (
        <div className="space-y-6">
          {/* Primary & Complete Database Backups */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Full Backup ACUCARE (Arsip Lengkap)</h3>
                  <p className="text-xs text-slate-400">
                    Cadangkan seluruh database: data pasien, rekam medis, sesi terapi, inventori, faktur, kwitansi & keuangan.
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                Primary & Disaster Recovery
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* PRIMARY BACKUP PDF */}
              <button
                onClick={exportBackupPDF}
                className="p-4 bg-teal-600/90 hover:bg-teal-500 text-slate-950 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all font-bold hover:scale-[1.02]"
              >
                <FileText className="w-6 h-6 text-slate-950" />
                <span className="text-xs font-black">Download Full Backup PDF</span>
                <span className="text-[10px] text-teal-950 font-medium">Backup utama multi-halaman seluruh data</span>
              </button>

              {/* TECHNICAL BACKUP JSON */}
              <button
                onClick={exportBackupJSON}
                className="p-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-teal-500 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all text-white hover:scale-[1.02]"
              >
                <Download className="w-6 h-6 text-teal-400" />
                <span className="text-xs font-bold">Download Backup JSON</span>
                <span className="text-[10px] text-slate-400">Format teknis untuk restore & pindah HP</span>
              </button>

              {/* EXCEL 12 SHEET */}
              <button
                onClick={exportBackupExcel}
                className="p-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all text-white hover:scale-[1.02]"
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-bold">Download Excel (.xlsx)</span>
                <span className="text-[10px] text-slate-400">12 Sheet spreadsheet lengkap seluruh tabel</span>
              </button>
            </div>
          </div>

          {/* Module-by-module Exports */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Export Berdasarkan Modul Satuan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Export Data Pasien</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Seluruh {patients.length} data pasien lengkap dengan nomor WA, status, dan riwayat keluhan.
                  </p>
                </div>
                <button
                  onClick={handleExportAllPatients}
                  className="mt-6 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Export Rekam Sesi Terapi</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Seluruh {therapySessions.length} sesi tindakan akupunktur, titik meridian, dan respon klinis.
                  </p>
                </div>
                <button
                  onClick={handleExportAllTherapy}
                  className="mt-6 w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Export Inventori Herbal</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Katalog {herbalProducts.length} produk herbal, harga modal, harga jual, dan sisa stok fisik.
                  </p>
                </div>
                <button
                  onClick={handleExportAllHerbal}
                  className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
