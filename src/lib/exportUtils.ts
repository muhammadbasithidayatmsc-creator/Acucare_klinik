import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, TherapySession, Service, HerbalProduct, Expense, Invoice, Sale, ClinicSettings } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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

export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(data: any[], filename: string, sheetName = 'Data') {
  if (!data || !data.length) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportMultiSheetExcel(sheets: { name: string; data: any[] }[], filename: string) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach((s) => {
    if (s.data && s.data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(s.data);
      XLSX.utils.book_append_sheet(workbook, ws, s.name.slice(0, 31));
    }
  });
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportPatientsPDF(patients: Patient[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(10, 25, 47);
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

  doc.save(`ACUCARE_Daftar_Pasien_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportTherapySessionsPDF(sessions: TherapySession[], patients: Patient[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(10, 25, 47);
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
    headStyles: { fillColor: [10, 25, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  doc.save(`ACUCARE_Sesi_Terapi_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportFinancialReportPDF(
  revenue: number,
  expense: number,
  netIncome: number,
  sales: Sale[],
  expenses: Expense[],
  periodLabel: string
) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(10, 25, 47);
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
  doc.setTextColor(10, 25, 47);
  doc.text('Rincian Pengeluaran:', 14, 73);

  const expenseData = expenses.slice(0, 20).map((e, idx) => [
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

  doc.save(`ACUCARE_Laporan_Keuangan_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function generateInvoicePDF(
  invoice: Invoice,
  settings: ClinicSettings,
  patient?: Patient | null,
  sale?: Sale | null
) {
  const doc = new jsPDF();

  // Header Background bar
  doc.setFillColor(10, 25, 47);
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
  doc.setTextColor(10, 25, 47);
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

  doc.save(`${invoice.invoice_number}_${patientName.replace(/\s+/g, '_')}.pdf`);
}

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
