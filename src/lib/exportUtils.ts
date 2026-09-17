import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Patient,
  TherapySession,
  Service,
  HerbalProduct,
  Expense,
  Invoice,
  Sale,
  Payment,
  Income,
  ClinicSettings,
  DatabaseBackup,
} from '../types';

/**
 * Formats a number to Indonesian Rupiah currency string.
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Formats date to Indonesian readable format.
 */
export function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generates standardized timestamp for backups: YYYY-MM-DD_HH-mm
 * Example: 2026-09-17_2130
 */
export function getBackupTimestamp(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}_${hh}-${min}`;
}

/**
 * Bulletproof, cross-platform file downloader compatible with Android Chrome,
 * WebViews, iOS Safari, iFrames, and desktop browsers.
 * Eliminates the "Download file blob gagal" issue.
 */
export function downloadFile(content: Blob | string, filename: string, mimeType: string): void {
  try {
    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;

    // IE/Edge legacy fallback
    const nav = window.navigator as any;
    if (nav && typeof nav.msSaveOrOpenBlob === 'function') {
      nav.msSaveOrOpenBlob(blob, filename);
      return;
    }

    let objectUrl: string | null = null;
    try {
      objectUrl = window.URL.createObjectURL(blob);
    } catch (urlErr) {
      console.warn('URL.createObjectURL failed, switching to data URI fallback:', urlErr);
    }

    if (objectUrl) {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.setAttribute('download', filename);
      link.setAttribute('rel', 'noopener noreferrer');
      link.style.display = 'none';
      document.body.appendChild(link);

      link.click();

      // Delay cleanup to ensure Android download manager captures the stream
      setTimeout(() => {
        try {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
          if (objectUrl) {
            window.URL.revokeObjectURL(objectUrl);
          }
        } catch {
          // Ignore cleanup errors
        }
      }, 30000);
      return;
    }

    // Secondary fallback: Base64 Data URL via FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      }, 30000);
    };
    reader.onerror = () => {
      console.error('FileReader fallback failed for download');
    };
    reader.readAsDataURL(blob);
  } catch (error) {
    console.error('downloadFile critical error:', error);
    throw new Error('Download file gagal. Silakan periksa izin browser atau coba gunakan browser lain.');
  }
}

/**
 * Downloads a JSON object/string safely as a file.
 */
export function downloadJsonFile(data: any, filename: string): void {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const safeFilename = filename.toLowerCase().endsWith('.json') ? filename : `${filename}.json`;
  downloadFile(jsonStr, safeFilename, 'application/json;charset=utf-8;');
}

/**
 * Safely saves a jsPDF instance using the universal download mechanism.
 */
export function savePdfDocument(doc: jsPDF, filename: string): void {
  const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  try {
    const blob = doc.output('blob');
    downloadFile(blob, safeFilename, 'application/pdf');
  } catch (e) {
    console.warn('doc.output(blob) failed, falling back to doc.save():', e);
    doc.save(safeFilename);
  }
}

/**
 * Safely saves a SheetJS workbook as an .xlsx file using blob downloading.
 */
export function saveWorkbook(workbook: XLSX.WorkBook, filename: string): void {
  const safeFilename = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  try {
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadFile(blob, safeFilename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } catch (e) {
    console.warn('Binary XLSX write failed, falling back to XLSX.writeFile:', e);
    XLSX.writeFile(workbook, safeFilename);
  }
}

/**
 * Exports data to CSV.
 */
export function exportToCSV(data: any[], filename: string): void {
  if (!data || !data.length) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const safeFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  downloadFile(csvOutput, safeFilename, 'text/csv;charset=utf-8;');
}

/**
 * Exports data to Excel single sheet.
 */
export function exportToExcel(data: any[], filename: string, sheetName = 'Data'): void {
  if (!data || !data.length) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  saveWorkbook(workbook, filename);
}

/**
 * Exports multi-sheet Excel.
 */
export function exportMultiSheetExcel(sheets: { name: string; data: any[] }[], filename: string): void {
  const workbook = XLSX.utils.book_new();
  sheets.forEach((s) => {
    if (s.data && s.data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(s.data);
      XLSX.utils.book_append_sheet(workbook, ws, s.name.slice(0, 31));
    }
  });
  saveWorkbook(workbook, filename);
}

/**
 * Exports single-table Patients PDF.
 */
export function exportPatientsPDF(patients: Patient[]): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('ACUCARE - DAFTAR PASIEN KLINIK', 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Klinik Akupunktur Ahli Saraf Kejepit & Stroke | Yogi Pangestu', 14, 24);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 29);

  const tableData = patients.map((p, idx) => [
    idx + 1,
    p.patient_code,
    p.full_name,
    p.gender,
    p.whatsapp,
    p.main_complaint.substring(0, 45) + (p.main_complaint.length > 45 ? '...' : ''),
    p.status,
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['No', 'Kode', 'Nama Pasien', 'Gender', 'WhatsApp', 'Keluhan Utama', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  savePdfDocument(doc, `ACUCARE_Daftar_Pasien_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Exports Therapy Sessions PDF.
 */
export function exportTherapySessionsPDF(sessions: TherapySession[], patients: Patient[]): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('ACUCARE - RIWAYAT SESI TERAPI', 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Klinik Akupunktur Ahli Saraf Kejepit & Stroke | Yogi Pangestu', 14, 24);

  const patientMap = new Map(patients.map((p) => [p.id, p]));

  const tableData = sessions.map((s, idx) => {
    const pat = patientMap.get(s.patient_id);
    return [
      idx + 1,
      s.therapy_date,
      pat ? `${pat.full_name} (${pat.patient_code})` : 'Pasien',
      `Sesi #${s.session_number}`,
      s.therapy_type,
      formatRupiah(s.cost),
      s.payment_status,
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [['No', 'Tanggal', 'Nama Pasien', 'Sesi', 'Jenis Terapi', 'Biaya', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  savePdfDocument(doc, `ACUCARE_Sesi_Terapi_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Exports Financial Report PDF.
 */
export function exportFinancialReportPDF(
  revenue: number,
  expense: number,
  netIncome: number,
  sales: Sale[],
  expenses: Expense[],
  periodLabel: string
): void {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('ACUCARE - LAPORAN KEUANGAN KLINIK', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${periodLabel}`, 14, 26);
  doc.text(`Praktisi / Owner: Yogi Pangestu`, 14, 31);
  doc.text(`Ruko Arcadia Residence A-16, Karangsatria, Tambun Utara, Bekasi`, 14, 36);

  // Summary box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 42, 182, 22, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Pendapatan: ${formatRupiah(revenue)}`, 20, 50);
  doc.text(`Total Pengeluaran: ${formatRupiah(expense)}`, 20, 58);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text(`Net Income (Laba Bersih): ${formatRupiah(netIncome)}`, 110, 54);
  doc.setFont('helvetica', 'normal');

  // Breakdown Expenses
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Rincian Pengeluaran:', 14, 73);

  const expenseData = expenses.slice(0, 25).map((e, idx) => [
    idx + 1,
    e.expense_date,
    e.category,
    e.description,
    e.payment_method,
    formatRupiah(e.amount),
  ]);

  autoTable(doc, {
    startY: 78,
    head: [['No', 'Tanggal', 'Kategori', 'Deskripsi', 'Metode', 'Jumlah']],
    body: expenseData.length ? expenseData : [['-', '-', '-', 'Tidak ada data pengeluaran', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
  });

  savePdfDocument(doc, `ACUCARE_Laporan_Keuangan_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Generates Single Invoice PDF.
 */
export function generateInvoicePDF(
  invoice: Invoice,
  settings: ClinicSettings,
  patient?: Patient | null,
  sale?: Sale | null
): void {
  const doc = new jsPDF();

  // Header Background bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.clinic_name || 'ACUCARE', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.specialty || 'Klinik Akupunktur Ahli Saraf Kejepit & Stroke', 14, 25);
  doc.text(settings.address || 'Ruko Arcadia Residence A-16, Karangsatria, Tambun Utara, Bekasi', 14, 30);
  doc.text(`WhatsApp: ${settings.whatsapp} | Praktisi: ${settings.practitioner_name}`, 14, 35);

  // Invoice Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE / BUKTI PEMBAYARAN', 14, 50);

  // Info Grid
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text(`No. Invoice : ${invoice.invoice_number}`, 14, 58);
  doc.text(`Tanggal     : ${formatDateIndo(invoice.invoice_date)}`, 14, 64);
  doc.text(`Status      : ${invoice.payment_status.toUpperCase()}`, 14, 70);

  const patientName = patient?.full_name || 'Pasien Umum';
  const patientCode = patient?.patient_code || '-';
  const patientPhone = patient?.whatsapp || '-';

  doc.text(`Nama Pasien : ${patientName}`, 110, 58);
  doc.text(`Kode Pasien : ${patientCode}`, 110, 64);
  doc.text(`WhatsApp    : ${patientPhone}`, 110, 70);

  // Items table
  const items = sale?.items || [];
  const tableData =
    items.length > 0
      ? items.map((item, idx) => [
          idx + 1,
          item.item_name,
          item.item_type === 'service' ? 'Layanan' : 'Produk Herbal',
          item.quantity,
          formatRupiah(item.price),
          formatRupiah(item.subtotal),
        ])
      : [[1, 'Layanan Terapi / Herbal', 'Layanan', 1, formatRupiah(invoice.total), formatRupiah(invoice.total)]];

  autoTable(doc, {
    startY: 78,
    head: [['No', 'Deskripsi Layanan / Produk', 'Tipe', 'Qty', 'Harga Satuan', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 120;

  // Totals Box
  doc.setFontSize(10);
  doc.text(`Subtotal :`, 130, finalY);
  doc.text(formatRupiah(invoice.subtotal), 195, finalY, { align: 'right' });

  if (invoice.discount > 0) {
    doc.text(`Diskon :`, 130, finalY + 6);
    doc.text(`- ${formatRupiah(invoice.discount)}`, 195, finalY + 6, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(13, 148, 136);
  doc.text(`Grand Total :`, 130, finalY + 14);
  doc.text(formatRupiah(invoice.total), 195, finalY + 14, { align: 'right' });

  // Bank Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, finalY, 100, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Informasi Pembayaran / Transfer:', 18, finalY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Bank       : ${settings.bank_name}`, 18, finalY + 14);
  doc.text(`No Rekening: ${settings.bank_account}`, 18, finalY + 20);
  doc.text(`Atas Nama  : ${settings.bank_holder}`, 18, finalY + 26);

  // Footer Note
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(settings.invoice_footer || 'Terima kasih atas kepercayaan Anda.', 14, finalY + 45);

  savePdfDocument(doc, `${invoice.invoice_number}_${patientName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * =========================================================================
 * PRIMARY BACKUP: FULL BACKUP PDF GENERATOR (SELURUH DATA AKTUAL KLINIK)
 * =========================================================================
 * Generates an exhaustive, multi-page, professional PDF containing 100% of
 * clinic records: Clinic Info, All Patients, Complete Medical History,
 * Therapy Sessions, Services, Herbal Inventory, Sales & Line Items,
 * Invoices, Payments/DPs, Expenses, and Financial Summary.
 */
export function exportFullBackupPDF(backup: DatabaseBackup): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const timestamp = getBackupTimestamp();
  const filename = `ACUCARE_FULL_BACKUP_${timestamp}.pdf`;
  const settings = backup.settings || ({} as ClinicSettings);
  const patients = backup.patients || [];
  const sessions = backup.therapy_sessions || [];
  const services = backup.services || [];
  const herbalProducts = backup.herbal_products || [];
  const sales = backup.sales || [];
  const invoices = backup.invoices || [];
  const payments = backup.payments || [];
  const expenses = backup.expenses || [];
  const income = backup.income || [];

  // Helper maps
  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const invoiceMap = new Map(invoices.map((i) => [i.id, i]));

  // Financial aggregates
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPaymentsReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalPaymentsReceived);
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netIncome = totalPaymentsReceived - totalExpenseAmount;

  // Track page numbers and footer
  const totalPagesExp = '{total_pages_count_string}';

  const addSectionTitle = (title: string, currentY: number): number => {
    let nextY = currentY;
    if (nextY > 265) {
      doc.addPage();
      nextY = 20;
    }
    doc.setFillColor(241, 245, 249);
    doc.rect(14, nextY, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 18, nextY + 5.5);
    return nextY + 11;
  };

  // 1. PAGE 1: OFFICIAL COVER & HEADER
  doc.setFillColor(15, 23, 42); // Deep slate navy
  doc.rect(0, 0, 210, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(settings.clinic_name || 'ACUCARE CLINIC', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(settings.specialty || 'Klinik Akupunktur Ahli Saraf Kejepit & Stroke (Yogi Pangestu)', 14, 23);
  doc.text('DOKUMEN ARSIP RESMI — CADANGAN DATA LENGKAP SISTEM (FULL BACKUP PDF)', 14, 29);
  doc.text(
    `Waktu Backup: ${new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })} | Pukul: ${new Date().toLocaleTimeString('id-ID')}`,
    14,
    35
  );

  let curY = 48;

  // Summary Metrics Banner
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, curY, 182, 28, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('RINGKASAN TOTAL ARSIP DATA AKTUAL KLINIK:', 18, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`• Total Pasien Terdaftar: ${patients.length} Orang`, 18, curY + 12);
  doc.text(`• Total Sesi Terapi Medis: ${sessions.length} Tindakan`, 18, curY + 17);
  doc.text(`• Total Layanan Klinis: ${services.length} Tindakan`, 18, curY + 22);

  doc.text(`• Total Transaksi Penjualan: ${sales.length} Faktur`, 80, curY + 12);
  doc.text(`• Total Invoice Terbit: ${invoices.length} Lembar`, 80, curY + 17);
  doc.text(`• Total Kwitansi Pembayaran: ${payments.length} Bukti Bayar`, 80, curY + 22);

  doc.text(`• Total Penerimaan Kas: ${formatRupiah(totalPaymentsReceived)}`, 140, curY + 12);
  doc.text(`• Total Pengeluaran Kas: ${formatRupiah(totalExpenseAmount)}`, 140, curY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text(`• Kas Bersih (Net): ${formatRupiah(netIncome)}`, 140, curY + 22);

  curY += 34;

  // SECTION A: INFORMASI & KONFIGURASI KLINIK
  curY = addSectionTitle('A. PROFIL & KONFIGURASI KLINIK ACUCARE', curY);
  const clinicInfoRows = [
    ['Nama Klinik', settings.clinic_name || 'ACUCARE', 'Praktisi Utama', settings.practitioner_name || 'Yogi Pangestu'],
    [
      'Spesialisasi',
      settings.specialty || 'Klinik Akupunktur Ahli Saraf Kejepit & Stroke',
      'No. WhatsApp / HP',
      settings.whatsapp || settings.phone || '081399670676',
    ],
    [
      'Alamat Klinik',
      settings.address || 'Ruko Arcadia Residence A-16, Karangsatria, Tambun Utara, Bekasi',
      'Rekening Bank',
      `${settings.bank_name || 'BSI'} - ${settings.bank_account || '5774090170'} (a.n ${
        settings.bank_holder || 'Yogi Pangestu'
      })`,
    ],
    ['Catatan Footer Invoice', settings.invoice_footer || '-', 'Versi Backup', backup.version || '2.0-full'],
  ];

  autoTable(doc, {
    startY: curY,
    head: [['Parameter', 'Keterangan', 'Parameter', 'Keterangan']],
    body: clinicInfoRows,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    showHead: 'everyPage',
  });

  curY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION B & C: SELURUH DATA PASIEN & REKAM MEDIS
  curY = addSectionTitle(`B. SELURUH DATABASE PASIEN & REKAM MEDIS LENGKAP (${patients.length} Pasien)`, curY);

  const patientTableRows = patients.map((p, idx) => [
    idx + 1,
    p.patient_code || '-',
    p.full_name || '-',
    p.whatsapp || p.phone || '-',
    p.gender === 'Laki-laki' ? 'L' : 'P',
    p.main_complaint || '-',
    [p.medical_history, p.allergy_notes].filter(Boolean).join(' | ') || '-',
    p.address || '-',
    p.status || 'Aktif',
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['No', 'Kode', 'Nama Lengkap', 'WhatsApp', 'JK', 'Keluhan Utama', 'Riwayat Medis & Alergi', 'Alamat', 'Status']],
    body: patientTableRows.length
      ? patientTableRows
      : [['-', '-', 'Belum ada data pasien tersimpan', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 18 },
      2: { cellWidth: 28 },
      3: { cellWidth: 20 },
      4: { cellWidth: 8 },
      5: { cellWidth: 32 },
      6: { cellWidth: 32 },
      7: { cellWidth: 22 },
      8: { cellWidth: 14 },
    },
    showHead: 'everyPage',
  });

  curY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION D & E: RIWAYAT SESI TERAPI
  curY = addSectionTitle(`C. RIWAYAT SESI TERAPI & TINDAKAN KLINIS (${sessions.length} Sesi Terapi)`, curY);

  const sessionTableRows = sessions.map((s, idx) => {
    const pat = patientMap.get(s.patient_id);
    const patName = pat ? `${pat.full_name} (${pat.patient_code})` : 'Pasien Umum';
    return [
      idx + 1,
      s.therapy_date || '-',
      patName,
      `Sesi #${s.session_number}`,
      s.therapy_type || '-',
      s.treatment_area || '-',
      s.condition_before || '-',
      s.patient_response || s.condition_after || '-',
      formatRupiah(s.cost || 0),
      s.payment_status || '-',
    ];
  });

  autoTable(doc, {
    startY: curY,
    head: [
      ['No', 'Tanggal', 'Nama Pasien', 'Sesi', 'Tindakan Terapi', 'Titik / Area', 'Keluhan / Awal', 'Respon / Hasil', 'Biaya', 'Status Bayar'],
    ],
    body: sessionTableRows.length
      ? sessionTableRows
      : [['-', '-', 'Belum ada data riwayat terapi', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 6.8, cellPadding: 1.8, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 7 },
      1: { cellWidth: 16 },
      2: { cellWidth: 28 },
      3: { cellWidth: 12 },
      4: { cellWidth: 26 },
      5: { cellWidth: 22 },
      6: { cellWidth: 24 },
      7: { cellWidth: 24 },
      8: { cellWidth: 16 },
      9: { cellWidth: 14 },
    },
    showHead: 'everyPage',
  });

  curY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION F: DATA LAYANAN & TARIF KLINIS
  curY = addSectionTitle(`D. DATA LAYANAN KLINIK & TARIF (${services.length} Layanan)`, curY);

  const serviceTableRows = services.map((srv, idx) => [
    idx + 1,
    srv.name || '-',
    srv.category || '-',
    `${srv.duration || 45} Menit`,
    formatRupiah(srv.price || 0),
    srv.active !== false ? 'Aktif' : 'Nonaktif',
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['No', 'Nama Layanan Tindakan', 'Kategori', 'Durasi', 'Tarif Layanan', 'Status']],
    body: serviceTableRows.length
      ? serviceTableRows
      : [['-', 'Belum ada master layanan', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    showHead: 'everyPage',
  });

  curY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION G: INVENTORI HERBAL & KONTROL STOK
  curY = addSectionTitle(`E. INVENTORI PRODUK HERBAL & STOK FISIK (${herbalProducts.length} Produk)`, curY);

  const herbalTableRows = herbalProducts.map((p, idx) => [
    idx + 1,
    p.sku || p.code || '-',
    p.name || '-',
    p.category || '-',
    p.unit || 'Botol',
    formatRupiah(p.purchase_price || p.buying_price || 0),
    formatRupiah(p.selling_price || 0),
    `${p.stock || 0} ${p.unit || 'Pcs'}`,
    (p.stock || 0) <= (p.minimum_stock || 5) ? 'Menipis' : 'Aman',
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['No', 'SKU / Kode', 'Nama Produk Herbal', 'Kategori', 'Satuan', 'Harga Modal', 'Harga Jual', 'Sisa Stok', 'Status Stok']],
    body: herbalTableRows.length
      ? herbalTableRows
      : [['-', '-', 'Belum ada katalog herbal', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    showHead: 'everyPage',
  });

  curY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION H: INVOICE / TAGIHAN, PEMBAYARAN, DP & SISA PIUTANG
  curY = addSectionTitle(`F. DAFTAR INVOICE, PEMBAYARAN DITERIMA & SISA TAGIHAN (${invoices.length} Invoice)`, curY);

  const invoiceTableRows = invoices.map((inv, idx) => {
    const pat = patientMap.get(inv.patient_id);
    const patName = pat ? `${pat.full_name} (${pat.patient_code})` : 'Pasien Umum';

    const invPayments = payments.filter(
      (p) => p.invoice_id === inv.id || (inv.sale_id && p.sale_id === inv.sale_id)
    );
    const paidAmount = invPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const remainingBalance = Math.max(0, inv.total - paidAmount);

    return [
      idx + 1,
      inv.invoice_number || '-',
      inv.invoice_date || '-',
      patName,
      formatRupiah(inv.total || 0),
      formatRupiah(paidAmount),
      formatRupiah(remainingBalance),
      inv.payment_status || (remainingBalance === 0 ? 'Lunas' : 'Belum Lunas'),
    ];
  });

  autoTable(doc, {
    startY: curY,
    head: [['No', 'No. Invoice', 'Tanggal', 'Nama Pasien', 'Total Tagihan', 'Total Terbayar', 'Sisa Tagihan (Piutang)', 'Status Bayar']],
    body: invoiceTableRows.length
      ? invoiceTableRows
      : [['-', '-', '-', 'Belum ada data invoice', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    showHead: 'everyPage',
  });

  curY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION I: KWITANSI PEMBAYARAN & DP MASUK (payment_date)
  curY = addSectionTitle(`G. BUKTI KWITANSI PEMBAYARAN & UANG MASUK (${payments.length} Transaksi Masuk)`, curY);

  const paymentTableRows = payments.map((pmt, idx) => {
    const pat = patientMap.get(pmt.patient_id);
    const patName = pat ? `${pat.full_name}` : 'Pasien';
    const inv = pmt.invoice_id ? invoiceMap.get(pmt.invoice_id) : null;
    return [
      idx + 1,
      pmt.payment_date || '-',
      pmt.invoice_number || inv?.invoice_number || '-',
      patName,
      pmt.payment_method || 'Cash',
      pmt.status || 'Lunas',
      formatRupiah(pmt.amount || 0),
      pmt.notes || '-',
    ];
  });

  autoTable(doc, {
    startY: curY,
    head: [['No', 'Tgl Pembayaran', 'No. Invoice', 'Nama Pasien', 'Metode', 'Status', 'Nominal Diterima', 'Catatan']],
    body: paymentTableRows.length
      ? paymentTableRows
      : [['-', '-', '-', 'Belum ada bukti pembayaran kas', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    showHead: 'everyPage',
  });

  curY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION J: PENGELUARAN KLINIK (expense_date)
  curY = addSectionTitle(`H. REKAP PENGELUARAN BIAYA KLINIK (${expenses.length} Catatan Biaya)`, curY);

  const expenseTableRows = expenses.map((exp, idx) => [
    idx + 1,
    exp.expense_date || '-',
    exp.category || 'Operasional',
    exp.description || '-',
    exp.recipient || '-',
    exp.payment_method || 'Cash',
    formatRupiah(exp.amount || 0),
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['No', 'Tanggal', 'Kategori Pengeluaran', 'Keterangan / Keperluan', 'Penerima / Vendor', 'Metode', 'Jumlah Biaya']],
    body: expenseTableRows.length
      ? expenseTableRows
      : [['-', '-', '-', 'Belum ada catatan pengeluaran', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    showHead: 'everyPage',
  });

  curY = (doc as any).lastAutoTable.finalY + 6;

  // SECTION K: RINGKASAN ARUS KEUANGAN EKSEKUTIF
  curY = addSectionTitle('I. RINGKASAN REKAPITULASI KEUANGAN & LABA BERSIH KAS', curY);

  const financialSummaryRows = [
    ['Total Nilai Tagihan Terbit (Invoiced Total)', formatRupiah(totalInvoiced), 'Nilai akumulasi seluruh invoice pasien'],
    ['Total Pemasukan Kas Aktual (Payment Diterima)', formatRupiah(totalPaymentsReceived), 'Uang riil yang telah diterima (termasuk DP)'],
    ['Sisa Piutang Pasien Belum Tertagih', formatRupiah(totalOutstanding), 'Kekurangan tagihan invoice yang belum lunas'],
    ['Total Pengeluaran Biaya Klinik', formatRupiah(totalExpenseAmount), 'Total seluruh beban operasional klinik'],
    ['Laba Bersih Kas (Net Cash Income)', formatRupiah(netIncome), 'Total Pemasukan Aktual dikurangi Total Pengeluaran'],
  ];

  autoTable(doc, {
    startY: curY,
    head: [['Komponen Finansial', 'Jumlah Akumulasi', 'Keterangan Definisi']],
    body: financialSummaryRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    showHead: 'everyPage',
  });

  // Stamp page numbers on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);

    // Divider line at bottom
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 287, 196, 287);

    doc.text(
      `ACUCARE CLINIC — Ahli Saraf Kejepit & Stroke | Dokumen Arsip Database Resmi Backup`,
      14,
      292
    );
    doc.text(`Halaman ${i} dari ${pageCount}`, 196, 292, { align: 'right' });
  }

  savePdfDocument(doc, filename);
}

/**
 * =========================================================================
 * 12-SHEET EXCEL EXPORT (MICROSOFT EXCEL & GOOGLE SHEETS COMPATIBLE)
 * =========================================================================
 * Generates an exhaustive workbook containing all 12 requested sheets:
 * 1. Pasien
 * 2. Rekam Medis
 * 3. Terapi
 * 4. Layanan
 * 5. Herbal
 * 6. Stok
 * 7. Penjualan
 * 8. Detail Penjualan
 * 9. Invoice
 * 10. Pembayaran
 * 11. Pemasukan
 * 12. Pengeluaran
 */
export function exportFullDatabaseExcel(backup: DatabaseBackup): void {
  const timestamp = getBackupTimestamp();
  const filename = `ACUCARE_DATABASE_EXPORT_${timestamp}.xlsx`;

  const patients = backup.patients || [];
  const sessions = backup.therapy_sessions || [];
  const services = backup.services || [];
  const herbalProducts = backup.herbal_products || [];
  const sales = backup.sales || [];
  const saleItems = backup.sale_items || [];
  const invoices = backup.invoices || [];
  const payments = backup.payments || [];
  const income = backup.income || [];
  const expenses = backup.expenses || [];

  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const saleMap = new Map(sales.map((s) => [s.id, s]));

  // Sheet 1: Pasien
  const sheet1Pasien = patients.map((p, idx) => ({
    No: idx + 1,
    'ID Pasien': p.id,
    'Kode Pasien': p.patient_code,
    'Nama Lengkap': p.full_name,
    NIK: p.nik || '-',
    'Jenis Kelamin': p.gender,
    'Tanggal Lahir': p.birth_date || '-',
    WhatsApp: p.whatsapp,
    Telepon: p.phone || '-',
    Email: p.email || '-',
    Alamat: p.address || '-',
    Pekerjaan: p.occupation || '-',
    'Kontak Darurat': p.emergency_contact || '-',
    Status: p.status,
    'Terdaftar Pada': p.created_at,
  }));

  // Sheet 2: Rekam Medis
  const sheet2RekamMedis = patients.map((p, idx) => ({
    No: idx + 1,
    'Kode Pasien': p.patient_code,
    'Nama Pasien': p.full_name,
    'Keluhan Utama': p.main_complaint,
    'Keluhan Tambahan': p.additional_complaint || '-',
    'Riwayat Penyakit Terdahulu': p.medical_history || '-',
    'Catatan Alergi': p.allergy_notes || '-',
    'Catatan Penting Klinis': p.important_notes || '-',
    Status: p.status,
  }));

  // Sheet 3: Terapi
  const sheet3Terapi = sessions.map((s, idx) => {
    const pat = patientMap.get(s.patient_id);
    return {
      No: idx + 1,
      'ID Sesi': s.id,
      'Tanggal Terapi': s.therapy_date,
      'Kode Pasien': pat?.patient_code || '-',
      'Nama Pasien': pat?.full_name || 'Pasien',
      'Sesi Ke': s.session_number,
      'Jenis Terapi': s.therapy_type,
      'Titik / Area Tindakan': s.treatment_area,
      'Keluhan / Kondisi Awal': s.condition_before || s.complaint,
      'Catatan Terapis (Yogi Pangestu)': s.practitioner_notes,
      'Kondisi Pasca Terapi': s.condition_after,
      'Respon Klinis Pasien': s.patient_response,
      'Rencana Terapi Lanjutan': s.next_plan || '-',
      'Tarif / Biaya': s.cost,
      'Status Pembayaran': s.payment_status,
    };
  });

  // Sheet 4: Layanan
  const sheet4Layanan = services.map((srv, idx) => ({
    No: idx + 1,
    'ID Layanan': srv.id,
    'Nama Layanan': srv.name,
    Kategori: srv.category,
    'Durasi (Menit)': srv.duration || 45,
    'Tarif Biaya': srv.price,
    'Status Aktif': srv.active !== false ? 'Aktif' : 'Nonaktif',
    Keterangan: srv.description || '-',
  }));

  // Sheet 5: Herbal
  const sheet5Herbal = herbalProducts.map((p, idx) => ({
    No: idx + 1,
    'ID Herbal': p.id,
    'SKU / Kode': p.sku || p.code || '-',
    'Nama Produk Herbal': p.name,
    Kategori: p.category,
    Satuan: p.unit,
    'Harga Modal': p.purchase_price || p.buying_price || 0,
    'Harga Jual': p.selling_price,
    'Stok Fisik': p.stock,
    'Batas Minimum Stok': p.minimum_stock,
    Status: p.active !== false ? 'Aktif' : 'Nonaktif',
    Deskripsi: p.description || '-',
  }));

  // Sheet 6: Stok
  const sheet6Stok = herbalProducts.map((p, idx) => ({
    No: idx + 1,
    'SKU / Kode': p.sku || p.code || '-',
    'Nama Produk Herbal': p.name,
    Kategori: p.category,
    'Sisa Stok': p.stock,
    'Batas Minimum': p.minimum_stock,
    Satuan: p.unit,
    'Status Stok': p.stock <= p.minimum_stock ? 'Menipis / Perlu Restock' : 'Aman',
    'Nilai Aset Modal': (p.stock || 0) * (p.purchase_price || p.buying_price || 0),
    'Nilai Potensi Penjualan': (p.stock || 0) * (p.selling_price || 0),
  }));

  // Sheet 7: Penjualan
  const sheet7Penjualan = sales.map((sale, idx) => {
    const pat = patientMap.get(sale.patient_id);
    return {
      No: idx + 1,
      'ID Penjualan': sale.id,
      'No. Invoice / Faktur': sale.invoice_number || '-',
      'Tanggal Transaksi': sale.sale_date,
      'Kode Pasien': pat?.patient_code || '-',
      'Nama Pasien': pat?.full_name || 'Umum',
      Subtotal: sale.subtotal,
      Diskon: sale.discount,
      'Total Akhir': sale.total,
      'Status Pembayaran': sale.payment_status,
      'Metode Pembayaran': sale.payment_method,
      Catatan: sale.notes || '-',
    };
  });

  // Sheet 8: Detail Penjualan
  const sheet8DetailPenjualan = saleItems.map((item, idx) => {
    const sale = saleMap.get(item.sale_id);
    const pat = sale ? patientMap.get(sale.patient_id) : null;
    return {
      No: idx + 1,
      'ID Item': item.id,
      'ID Penjualan': item.sale_id,
      'No. Invoice': sale?.invoice_number || '-',
      'Nama Pasien': pat?.full_name || 'Umum',
      'Nama Item / Layanan / Herbal': item.item_name,
      'Tipe Item': item.item_type === 'service' ? 'Layanan' : 'Herbal',
      Kuantitas: item.quantity,
      'Harga Satuan': item.price,
      Subtotal: item.subtotal,
    };
  });

  // Sheet 9: Invoice
  const sheet9Invoice = invoices.map((inv, idx) => {
    const pat = patientMap.get(inv.patient_id);
    const invPayments = payments.filter(
      (p) => p.invoice_id === inv.id || (inv.sale_id && p.sale_id === inv.sale_id)
    );
    const paidAmount = invPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const remaining = Math.max(0, inv.total - paidAmount);

    return {
      No: idx + 1,
      'ID Invoice': inv.id,
      'No. Invoice': inv.invoice_number,
      'Tanggal Terbit': inv.invoice_date,
      'Jatuh Tempo': inv.due_date || '-',
      'Kode Pasien': pat?.patient_code || '-',
      'Nama Pasien': pat?.full_name || 'Umum',
      Subtotal: inv.subtotal,
      Diskon: inv.discount,
      'Total Tagihan': inv.total,
      'Total Pembayaran (Termasuk DP)': paidAmount,
      'Sisa Tagihan (Outstanding)': remaining,
      'Status Pembayaran': inv.payment_status,
    };
  });

  // Sheet 10: Pembayaran
  const sheet10Pembayaran = payments.map((p, idx) => {
    const pat = patientMap.get(p.patient_id);
    return {
      No: idx + 1,
      'ID Pembayaran': p.id,
      'Tanggal Pembayaran (payment_date)': p.payment_date,
      'No. Invoice': p.invoice_number || '-',
      'Kode Pasien': pat?.patient_code || '-',
      'Nama Pasien': pat?.full_name || 'Umum',
      'Nominal Uang Masuk': p.amount,
      'Metode Pembayaran': p.payment_method,
      Status: p.status,
      Keterangan: p.notes || '-',
      'Tercatat Pada': p.created_at,
    };
  });

  // Sheet 11: Pemasukan
  const sheet11Pemasukan = income.map((inc, idx) => ({
    No: idx + 1,
    'ID Pemasukan': inc.id,
    'Tanggal Pemasukan (income_date)': inc.income_date,
    Kategori: inc.category,
    Deskripsi: inc.description,
    'Nominal Pemasukan': inc.amount,
    'Sumber Dana': inc.source,
    Catatan: inc.notes || '-',
  }));

  // Sheet 12: Pengeluaran
  const sheet12Pengeluaran = expenses.map((exp, idx) => ({
    No: idx + 1,
    'ID Pengeluaran': exp.id,
    'Tanggal Pengeluaran (expense_date)': exp.expense_date,
    Kategori: exp.category,
    'Keterangan Pengeluaran': exp.description,
    'Nominal Biaya': exp.amount,
    'Metode Pembayaran': exp.payment_method,
    'Penerima / Vendor': exp.recipient || '-',
    Catatan: exp.notes || '-',
  }));

  const sheets = [
    { name: '1. Pasien', data: sheet1Pasien },
    { name: '2. Rekam Medis', data: sheet2RekamMedis },
    { name: '3. Terapi', data: sheet3Terapi },
    { name: '4. Layanan', data: sheet4Layanan },
    { name: '5. Herbal', data: sheet5Herbal },
    { name: '6. Stok', data: sheet6Stok },
    { name: '7. Penjualan', data: sheet7Penjualan },
    { name: '8. Detail Penjualan', data: sheet8DetailPenjualan },
    { name: '9. Invoice', data: sheet9Invoice },
    { name: '10. Pembayaran', data: sheet10Pembayaran },
    { name: '11. Pemasukan', data: sheet11Pemasukan },
    { name: '12. Pengeluaran', data: sheet12Pengeluaran },
  ];

  exportMultiSheetExcel(sheets, filename);
}

/**
 * Parses an uploaded Excel or CSV file.
 */
export async function parseExcelOrCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
