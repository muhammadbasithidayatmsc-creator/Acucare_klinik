import React, { useState, useMemo } from 'react';
import { Sale, Invoice } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatRupiah, formatDateIndo, exportToExcel } from '../../lib/exportUtils';

export const FinancialReportView: React.FC = () => {
  const { sales, expenses, invoices, payments, addToast } = useClinic();

  const [dateRange, setDateRange] = useState<'this_month' | 'last_month' | '3m' | 'this_year' | 'all' | 'custom'>('this_month');
  const [customStart, setCustomStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10));

  // Determine start & end date based on dateRange
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (dateRange === 'this_month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      return { startDate: s, endDate: e };
    }
    if (dateRange === 'last_month') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const e = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      return { startDate: s, endDate: e };
    }
    if (dateRange === '3m') {
      const s = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
      const e = now.toISOString().slice(0, 10);
      return { startDate: s, endDate: e };
    }
    if (dateRange === 'this_year') {
      const s = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const e = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
      return { startDate: s, endDate: e };
    }
    if (dateRange === 'custom') {
      return { startDate: customStart, endDate: customEnd };
    }
    return { startDate: '2020-01-01', endDate: '2099-12-31' };
  }, [dateRange, customStart, customEnd]);

  // Filter Payments (Actual Income received) within date range: STRICTLY by payment_date!
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => p.payment_date >= startDate && p.payment_date <= endDate);
  }, [payments, startDate, endDate]);

  // Filter Expenses within date range: by expense_date
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => e.expense_date >= startDate && e.expense_date <= endDate);
  }, [expenses, startDate, endDate]);

  // Invoices created within date range: by invoice_date (Nilai Transaksi)
  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => i.invoice_date >= startDate && i.invoice_date <= endDate);
  }, [invoices, startDate, endDate]);

  // Revenue Breakdown: Service vs Herbal based on actual payments received
  const revenueBreakdown = useMemo(() => {
    let serviceRev = 0;
    let herbalRev = 0;

    const salesMap = new Map<string, Sale>(sales.map((s) => [s.id, s]));
    const invoicesMap = new Map<string, Invoice>(invoices.map((inv) => [inv.id, inv]));

    filteredPayments.forEach((p) => {
      const sale = p.sale_id ? salesMap.get(p.sale_id) : undefined;
      const inv = p.invoice_id ? invoicesMap.get(p.invoice_id) : undefined;
      const items = sale?.items || inv?.items;

      if (items && items.length > 0) {
        const itemSum = items.reduce((sum, item) => sum + item.subtotal, 0) || 1;
        const sSub = items
          .filter((item) => item.item_type === 'SERVICE')
          .reduce((sum, item) => sum + item.subtotal, 0);
        const hSub = items
          .filter((item) => item.item_type === 'HERBAL')
          .reduce((sum, item) => sum + item.subtotal, 0);

        serviceRev += Math.round(p.amount * (sSub / itemSum));
        herbalRev += Math.round(p.amount * (hSub / itemSum));
      } else {
        serviceRev += p.amount;
      }
    });

    return { serviceRev, herbalRev };
  }, [filteredPayments, sales, invoices]);

  // Expense Breakdown by Category
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([category, amount]) => ({
      name: category,
      value: amount,
    }));
  }, [filteredExpenses]);

  // Totals
  // REAL INCOME: strictly based on payment_date money received
  const totalRevenue = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalRevenue - totalExpense;
  const profitMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : '0.0';

  const COLORS = ['#0D9488', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#10B981'];

  const handleExportExcel = () => {
    const summarySheet = [
      { Indikator: 'Periode Awal', Nilai: startDate },
      { Indikator: 'Periode Akhir', Nilai: endDate },
      { Indikator: 'Total Pemasukan Kas Diterima (Payment Date)', Nilai: totalRevenue },
      { Indikator: 'Total Nilai Invoice / Tagihan (Invoice Date)', Nilai: totalInvoiced },
      { Indikator: 'Pendapatan Layanan Terapi', Nilai: revenueBreakdown.serviceRev },
      { Indikator: 'Pendapatan Produk Herbal', Nilai: revenueBreakdown.herbalRev },
      { Indikator: 'Total Pengeluaran (Expense)', Nilai: totalExpense },
      { Indikator: 'Net Income (Laba Bersih)', Nilai: netIncome },
      { Indikator: 'Profit Margin (%)', Nilai: `${profitMargin}%` },
    ];
    exportToExcel(summarySheet, `ACUCARE_Laporan_Keuangan_${startDate}_sd_${endDate}`, 'Ringkasan Laba Rugi');
    addToast('success', 'Export Excel Laporan Keuangan Berhasil');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Laporan Keuangan & Laba Rugi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Analisis arus kas pendapatan layanan akupunktur, penjualan herbal, struktur biaya, dan Net Income.
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

      {/* Date Filter Bar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setDateRange('this_month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === 'this_month' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setDateRange('last_month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === 'last_month' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bulan Lalu
          </button>
          <button
            onClick={() => setDateRange('3m')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === '3m' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            3 Bulan
          </button>
          <button
            onClick={() => setDateRange('this_year')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === 'this_year' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tahun Ini
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Periode
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === 'custom' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Custom Tanggal
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <span className="text-xs text-slate-400">s/d</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        )}
      </div>

      {/* Executive Financial Notice */}
      <div className="px-4 py-2.5 bg-teal-50/80 border border-teal-200 rounded-2xl flex items-center justify-between text-xs text-teal-950">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-teal-700 shrink-0" />
          <span>
            <b>Aturan Akuntansi Klinik:</b> Pemasukan dicatat <b>berdasarkan tanggal pembayaran / uang diterima</b> (Bukan tanggal invoice dibuat).
          </span>
        </div>
        <span className="font-mono font-bold text-teal-800 hidden sm:inline">
          {filteredPayments.length} Pembayaran Masuk
        </span>
      </div>

      {/* 5 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-3xl border border-teal-200/90 shadow-xs ring-2 ring-teal-500/10">
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Pemasukan Diterima</span>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatRupiah(totalRevenue)}</p>
          <p className="text-[10px] text-teal-600 mt-1">
            Kas Masuk ({filteredPayments.length} trx)
          </p>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nilai Transaksi (Invoice)</span>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatRupiah(totalInvoiced)}</p>
          <p className="text-[10px] text-slate-500 mt-1">
            Tagihan Terbit ({filteredInvoices.length} invoice)
          </p>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran</span>
          <p className="text-xl font-black text-rose-600 mt-1 font-mono">{formatRupiah(totalExpense)}</p>
          <p className="text-[10px] text-slate-400 mt-1">{filteredExpenses.length} transaksi biaya</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-3xl border border-teal-800 shadow-md">
          <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">Laba Bersih (Cashflow)</span>
          <p className="text-xl font-black text-teal-300 mt-1 font-mono">{formatRupiah(netIncome)}</p>
          <p className="text-[10px] text-slate-300 mt-1">Kas Masuk - Pengeluaran</p>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Profit Margin</span>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">{profitMargin}%</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">Margin operasional</p>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-1">Proporsi Sumber Pendapatan</h3>
          <p className="text-xs text-slate-500 mb-4">Layanan Tindakan Terapi vs Penjualan Herbal</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Layanan Terapi', value: revenueBreakdown.serviceRev, color: '#0D9488' },
                    { name: 'Produk Herbal', value: revenueBreakdown.herbalRev, color: '#3B82F6' },
                  ].filter((x) => x.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  paddingAngle={5}
                >
                  <Cell fill="#0D9488" />
                  <Cell fill="#3B82F6" />
                </Pie>
                <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-600" />
                <span className="font-semibold text-slate-700">Layanan Terapi Akupunktur</span>
              </div>
              <span className="font-bold font-mono">{formatRupiah(revenueBreakdown.serviceRev)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                <span className="font-semibold text-slate-700">Penjualan Obat Herbal</span>
              </div>
              <span className="font-bold font-mono">{formatRupiah(revenueBreakdown.herbalRev)}</span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-1">Struktur Pengeluaran Operasional</h3>
          <p className="text-xs text-slate-500 mb-4">Distribusi alokasi biaya klinik</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs max-h-36 overflow-y-auto custom-scrollbar">
            {expenseByCategory.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-600 truncate max-w-xs">{item.name}</span>
                </div>
                <span className="font-bold font-mono">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
