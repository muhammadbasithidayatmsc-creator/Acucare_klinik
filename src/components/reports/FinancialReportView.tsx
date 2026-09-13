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
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
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
  AreaChart,
  Area,
} from 'recharts';
import { formatRupiah, formatDateIndo, exportMultiSheetExcel } from '../../lib/exportUtils';

export const FinancialReportView: React.FC = () => {
  const { sales, expenses, invoices, payments, addToast } = useClinic();

  const [dateRange, setDateRange] = useState<
    'today' | '7d' | 'this_month' | 'last_month' | '3m' | 'this_year' | 'all' | 'custom'
  >('this_month');

  const [customStart, setCustomStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10));

  // Sub-tab to view Cash Payments or Invoiced Sales
  const [activeDetailTab, setActiveDetailTab] = useState<'payments' | 'invoices'>('payments');

  // Determine start & end date based on dateRange
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (dateRange === 'today') {
      return { startDate: todayStr, endDate: todayStr, periodLabel: 'Hari Ini' };
    }
    if (dateRange === '7d') {
      const d = new Date();
      d.setDate(now.getDate() - 6);
      return { startDate: d.toISOString().slice(0, 10), endDate: todayStr, periodLabel: '7 Hari Terakhir (Mingguan)' };
    }
    if (dateRange === 'this_month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      return { startDate: s, endDate: e, periodLabel: 'Bulan Ini' };
    }
    if (dateRange === 'last_month') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const e = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      return { startDate: s, endDate: e, periodLabel: 'Bulan Lalu' };
    }
    if (dateRange === '3m') {
      const s = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
      const e = now.toISOString().slice(0, 10);
      return { startDate: s, endDate: e, periodLabel: '3 Bulan Terakhir' };
    }
    if (dateRange === 'this_year') {
      const s = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const e = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
      return { startDate: s, endDate: e, periodLabel: 'Tahun Ini' };
    }
    if (dateRange === 'custom') {
      return {
        startDate: customStart,
        endDate: customEnd,
        periodLabel: `${formatDateIndo(customStart)} s/d ${formatDateIndo(customEnd)}`,
      };
    }
    return { startDate: '2020-01-01', endDate: '2099-12-31', periodLabel: 'Semua Periode' };
  }, [dateRange, customStart, customEnd]);

  // STRICT RULE: Filter Payments (Actual Real Cash Income) within date range: STRICTLY by payment_date!
  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => p.payment_date >= startDate && p.payment_date <= endDate)
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  }, [payments, startDate, endDate]);

  // Invoices created within date range: by invoice_date (Total Nilai Transaksi / Penjualan)
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((i) => i.invoice_date >= startDate && i.invoice_date <= endDate)
      .sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));
  }, [invoices, startDate, endDate]);

  // Filter Expenses within date range: by expense_date
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.expense_date >= startDate && e.expense_date <= endDate)
      .sort((a, b) => b.expense_date.localeCompare(a.expense_date));
  }, [expenses, startDate, endDate]);

  // Invoice Lookup Maps
  const invoicesMap = useMemo(() => new Map<string, Invoice>(invoices.map((inv) => [inv.id, inv])), [invoices]);
  const salesMap = useMemo(() => new Map<string, Sale>(sales.map((s) => [s.id, s])), [sales]);

  // Calculate Invoices with paid balance
  const invoicesWithBalance = useMemo(() => {
    return filteredInvoices.map((inv) => {
      const invPayments = payments.filter(
        (p) => p.invoice_id === inv.id || (inv.sale_id && p.sale_id === inv.sale_id)
      );
      const paid = invPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const balance = Math.max(0, inv.total - paid);
      return { ...inv, paid, balance };
    });
  }, [filteredInvoices, payments]);

  const periodOutstanding = useMemo(() => {
    return invoicesWithBalance.reduce((sum, inv) => sum + inv.balance, 0);
  }, [invoicesWithBalance]);

  // Revenue Breakdown: Service vs Herbal based on actual payments received (payment_date)
  const revenueBreakdown = useMemo(() => {
    let serviceRev = 0;
    let herbalRev = 0;

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
  }, [filteredPayments, salesMap, invoicesMap]);

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
  // REAL CASH INFLOW: strictly based on payment_date money received
  const totalRevenue = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalRevenue - totalExpense;
  const profitMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : '0.0';

  // Chart data: daily grouping within startDate and endDate
  const chartData = useMemo(() => {
    const dateMap = new Map<string, { date: string; displayDate: string; revenue: number; expense: number; netIncome: number }>();

    // Collect all dates from payments and expenses
    filteredPayments.forEach((p) => {
      if (!dateMap.has(p.payment_date)) {
        const d = new Date(p.payment_date);
        dateMap.set(p.payment_date, {
          date: p.payment_date,
          displayDate: isNaN(d.getTime()) ? p.payment_date : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          revenue: 0,
          expense: 0,
          netIncome: 0,
        });
      }
      const entry = dateMap.get(p.payment_date)!;
      entry.revenue += p.amount || 0;
    });

    filteredExpenses.forEach((e) => {
      if (!dateMap.has(e.expense_date)) {
        const d = new Date(e.expense_date);
        dateMap.set(e.expense_date, {
          date: e.expense_date,
          displayDate: isNaN(d.getTime()) ? e.expense_date : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          revenue: 0,
          expense: 0,
          netIncome: 0,
        });
      }
      const entry = dateMap.get(e.expense_date)!;
      entry.expense += e.amount || 0;
    });

    // If empty, supply start and end date
    if (dateMap.size === 0) {
      dateMap.set(startDate, {
        date: startDate,
        displayDate: formatDateIndo(startDate),
        revenue: 0,
        expense: 0,
        netIncome: 0,
      });
    }

    const list = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    list.forEach((item) => {
      item.netIncome = item.revenue - item.expense;
    });
    return list;
  }, [filteredPayments, filteredExpenses, startDate]);

  const COLORS = ['#0D9488', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#10B981'];

  const handleExportExcel = () => {
    // 1. Ringkasan Laba Rugi
    const summarySheet = [
      { Indikator: 'Periode Laporan', Nilai: periodLabel },
      { Indikator: 'Tanggal Awal', Nilai: startDate },
      { Indikator: 'Tanggal Akhir', Nilai: endDate },
      { Indikator: 'Total Pemasukan Kas Riil Diterima (payment_date)', Nilai: totalRevenue },
      { Indikator: 'Total Nilai Invoice / Tagihan (invoice_date)', Nilai: totalInvoiced },
      { Indikator: 'Sisa Piutang / Outstanding Invoice', Nilai: periodOutstanding },
      { Indikator: 'Pendapatan Layanan Terapi', Nilai: revenueBreakdown.serviceRev },
      { Indikator: 'Pendapatan Produk Herbal', Nilai: revenueBreakdown.herbalRev },
      { Indikator: 'Total Pengeluaran (expense_date)', Nilai: totalExpense },
      { Indikator: 'Net Income (Laba Bersih Kas)', Nilai: netIncome },
      { Indikator: 'Profit Margin (%)', Nilai: `${profitMargin}%` },
    ];

    // 2. Rincian Pemasukan Kas (Payment Date)
    const paymentsSheet = filteredPayments.map((p) => {
      const inv = p.invoice_id ? invoicesMap.get(p.invoice_id) : undefined;
      return {
        'Tgl Uang Masuk': p.payment_date,
        'No. Pembayaran': p.id,
        'No. Invoice': p.invoice_number,
        'Tgl Invoice Dibuat': inv ? inv.invoice_date : '-',
        Pasien: p.patient_name,
        'Metode Bayar': p.payment_method,
        Status: p.status,
        'Nominal Masuk (Rp)': p.amount,
        Catatan: p.notes || '',
      };
    });

    // 3. Rekap Invoice Terbit (Invoice Date)
    const invoicesSheet = invoicesWithBalance.map((inv) => ({
      'Tgl Invoice': inv.invoice_date,
      'No. Invoice': inv.invoice_number,
      Pasien: inv.patient_name,
      'Total Nilai Tagihan (Rp)': inv.total,
      'Total Terbayar (Rp)': inv.paid,
      'Sisa Piutang (Rp)': inv.balance,
      'Status Pembayaran': inv.payment_status,
      'Jatuh Tempo': inv.due_date,
    }));

    // 4. Rincian Pengeluaran
    const expensesSheet = filteredExpenses.map((e) => ({
      'Tgl Pengeluaran': e.expense_date,
      Kategori: e.category,
      Keterangan: e.description,
      'Jumlah (Rp)': e.amount,
      'Metode Bayar': e.payment_method,
      Vendor: e.vendor || '',
    }));

    exportMultiSheetExcel(
      [
        { name: 'Ringkasan Laba Rugi', data: summarySheet },
        { name: 'Pemasukan Kas (Payment Date)', data: paymentsSheet },
        { name: 'Invoice Terbit (Invoice Date)', data: invoicesSheet },
        { name: 'Pengeluaran', data: expensesSheet },
      ],
      `Laporan_Keuangan_${startDate}_sd_${endDate}`
    );

    addToast('success', 'Export Excel Laporan Keuangan Berhasil (4 Sheet Lengkap)');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Laporan Keuangan & Laba Rugi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Analisis arus kas pendapatan, pencatatan kas riil, struktur biaya operasional, dan laba bersih klinik.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel Lengkap (Multi-Sheet)</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === 'today' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hari Ini (Harian)
          </button>
          <button
            onClick={() => setDateRange('7d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === '7d' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            7 Hari (Mingguan)
          </button>
          <button
            onClick={() => setDateRange('this_month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === 'this_month' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bulan Ini (Bulanan)
          </button>
          <button
            onClick={() => setDateRange('last_month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === 'last_month' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bulan Lalu
          </button>
          <button
            onClick={() => setDateRange('this_year')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === 'this_year' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tahun Ini (Tahunan)
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Periode
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dateRange === 'custom' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Custom Tanggal
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
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

      {/* Accounting Compliance Banner */}
      <div className="p-4 bg-teal-50/90 border border-teal-200 rounded-2xl text-xs text-teal-950 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-teal-900">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Standar Akuntansi Kas: Pemasukan Dicatat Berdasarkan Tanggal Uang Masuk (Payment Date)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-200 text-teal-900">
            Periode: {periodLabel}
          </span>
        </div>
        <p className="text-teal-800 text-[11px] leading-relaxed">
          • <b>Total Pemasukan Kas:</b> Mengakumulasi pembayaran yang benar-benar diterima (DP, cicilan, pelunasan) pada rentang tanggal terpilih, <b>bukan</b> berdasarkan tanggal invoice diterbitkan.
          <br />
          • <b>Total Nilai Invoice:</b> Nilai keseluruhan transaksi tagihan yang terbit dalam periode tersebut. Selisih antara invoice dan uang masuk dihitung sebagai piutang (outstanding).
        </p>
      </div>

      {/* 5 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Pemasukan Kas Diterima */}
        <div className="p-4 bg-white rounded-3xl border border-teal-200/90 shadow-xs ring-2 ring-teal-500/10">
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Pemasukan Kas Riil</span>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatRupiah(totalRevenue)}</p>
          <div className="flex items-center justify-between text-[10px] text-teal-600 mt-1 font-medium">
            <span>Uang Diterima (payment_date)</span>
            <span>{filteredPayments.length} Trx</span>
          </div>
        </div>

        {/* Nilai Transaksi / Invoice */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Nilai Invoice</span>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatRupiah(totalInvoiced)}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
            <span>Tagihan Terbit (invoice_date)</span>
            <span>{filteredInvoices.length} Inv</span>
          </div>
        </div>

        {/* Sisa Piutang / Outstanding */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Sisa Piutang (Belum Masuk)</span>
          <p className="text-xl font-black text-amber-600 mt-1 font-mono">{formatRupiah(periodOutstanding)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Belum lunas dari invoice periode ini</p>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran</span>
          <p className="text-xl font-black text-rose-600 mt-1 font-mono">{formatRupiah(totalExpense)}</p>
          <p className="text-[10px] text-slate-400 mt-1">{filteredExpenses.length} transaksi biaya</p>
        </div>

        {/* Net Income */}
        <div className="p-4 bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-3xl border border-teal-800 shadow-md">
          <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">Net Income (Laba Bersih)</span>
          <p className="text-xl font-black text-teal-300 mt-1 font-mono">{formatRupiah(netIncome)}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1">
            <span>Kas Masuk - Biaya</span>
            <span className="font-bold text-teal-200">Margin: {profitMargin}%</span>
          </div>
        </div>
      </div>

      {/* Financial Flow Chart */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">Trend Arus Kas Masuk vs Pengeluaran</h3>
            <p className="text-xs text-slate-500">
              Pemasukan riil berdasarkan tanggal pembayaran diterima (payment_date) vs biaya operasional (expense_date)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-teal-700">
              <span className="w-3 h-3 rounded-full bg-teal-600" />
              Kas Masuk
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              Pengeluaran
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `Rp${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: any) => [formatRupiah(Number(value)), '']}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#1E293B',
                  borderRadius: '12px',
                  color: '#FFF',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="revenue" name="Pemasukan Kas" fill="#0D9488" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="expense" name="Pengeluaran" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue & Expense Pie Proportions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-1">Proporsi Sumber Pendapatan</h3>
          <p className="text-xs text-slate-500 mb-4">Layanan Terapi vs Penjualan Herbal (Berdasarkan uang masuk)</p>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Layanan Terapi', value: revenueBreakdown.serviceRev, color: '#0D9488' },
                    { name: 'Produk Herbal', value: revenueBreakdown.herbalRev, color: '#3B82F6' },
                  ].filter((x) => x.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  dataKey="value"
                  paddingAngle={4}
                >
                  <Cell fill="#0D9488" />
                  <Cell fill="#3B82F6" />
                </Pie>
                <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
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

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs max-h-32 overflow-y-auto custom-scrollbar">
            {expenseByCategory.length === 0 ? (
              <p className="text-slate-400 text-center py-2">Tidak ada transaksi pengeluaran pada periode ini.</p>
            ) : (
              expenseByCategory.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-600 truncate max-w-xs">{item.name}</span>
                  </div>
                  <span className="font-bold font-mono">{formatRupiah(item.value)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detailed Tables Section: Tabs between Payments (Pemasukan Kas) vs Invoices */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">Rincian Transaksi Keuangan</h3>
            <p className="text-xs text-slate-500">Transparansi antara uang riil diterima (payment_date) dan tagihan terbit (invoice_date)</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveDetailTab('payments')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeDetailTab === 'payments' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Pemasukan Kas ({filteredPayments.length})</span>
            </button>
            <button
              onClick={() => setActiveDetailTab('invoices')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeDetailTab === 'invoices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tagihan / Invoice ({filteredInvoices.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Pemasukan Kas Masuk (Strictly payment_date) */}
        {activeDetailTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                  <th className="py-3 px-4">Tgl Uang Masuk</th>
                  <th className="py-3 px-4">No. Pembayaran</th>
                  <th className="py-3 px-4">No. Invoice Terkait</th>
                  <th className="py-3 px-4">Pasien</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Status / Tipe</th>
                  <th className="py-3 px-4 text-right">Nominal Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada pembayaran kas diterima pada periode ini ({periodLabel}).
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pay) => {
                    const inv = pay.invoice_id ? invoicesMap.get(pay.invoice_id) : undefined;
                    return (
                      <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-teal-700">
                          {formatDateIndo(pay.payment_date)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{pay.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 font-mono">{pay.invoice_number}</div>
                          {inv && (
                            <div className="text-[10px] text-slate-400">
                              Terbit: {formatDateIndo(inv.invoice_date)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{pay.patient_name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {pay.payment_method}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pay.status === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pay.status === 'DP'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {pay.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black font-mono text-emerald-600">
                          {formatRupiah(pay.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredPayments.length > 0 && (
                <tfoot>
                  <tr className="bg-teal-50/70 border-t-2 border-teal-200 font-black text-slate-900">
                    <td colSpan={6} className="py-3 px-4 text-teal-900">
                      Total Pemasukan Kas Diterima ({periodLabel})
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-base text-teal-700">
                      {formatRupiah(totalRevenue)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Tab 2: Tagihan / Invoice Terbit (invoice_date) */}
        {activeDetailTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                  <th className="py-3 px-4">Tgl Invoice</th>
                  <th className="py-3 px-4">No. Invoice</th>
                  <th className="py-3 px-4">Pasien</th>
                  <th className="py-3 px-4 text-right">Nilai Tagihan</th>
                  <th className="py-3 px-4 text-right">Kas Diterima</th>
                  <th className="py-3 px-4 text-right">Sisa Piutang</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoicesWithBalance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada invoice diterbitkan pada periode ini ({periodLabel}).
                    </td>
                  </tr>
                ) : (
                  invoicesWithBalance.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">{formatDateIndo(inv.invoice_date)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{inv.patient_name}</td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                        {formatRupiah(inv.total)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold font-mono text-teal-600">
                        {formatRupiah(inv.paid)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-amber-600">
                        {inv.balance > 0 ? formatRupiah(inv.balance) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.payment_status === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.payment_status === 'DP'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {invoicesWithBalance.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                    <td colSpan={3} className="py-3 px-4">
                      Total Tagihan & Piutang ({periodLabel})
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-slate-900">
                      {formatRupiah(totalInvoiced)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-teal-700">
                      {formatRupiah(invoicesWithBalance.reduce((s, i) => s + i.paid, 0))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-amber-600">
                      {formatRupiah(periodOutstanding)}
                    </td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
