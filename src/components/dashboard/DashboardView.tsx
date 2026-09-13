import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/ClinicContext';
import {
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  ArrowUpRight,
  Plus,
  UserPlus,
  ShoppingCart,
  Receipt,
  Clock,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatRupiah, formatDateIndo } from '../../lib/exportUtils';

interface DashboardViewProps {
  onNavigate: (tab: string, itemId?: string) => void;
  onOpenQuickAction: (actionType: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenQuickAction }) => {
  const { currentUser } = useAuth();
  const { patients, therapySessions, sales, expenses, invoices, payments, herbalProducts } = useClinic();

  const [timeFilter, setTimeFilter] = useState<'today' | '7d' | '30d' | 'this_month' | 'this_year' | 'all'>('30d');

  // Greeting based on current hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  // Filter Date Range for Dashboard KPIs & Chart
  const filterRange = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    if (timeFilter === 'today') {
      return { start: todayStr, end: todayStr, label: 'Hari Ini' };
    }
    if (timeFilter === '7d') {
      const d = new Date();
      d.setDate(now.getDate() - 6);
      return { start: d.toISOString().slice(0, 10), end: todayStr, label: '7 Hari Terakhir' };
    }
    if (timeFilter === '30d') {
      const d = new Date();
      d.setDate(now.getDate() - 29);
      return { start: d.toISOString().slice(0, 10), end: todayStr, label: '30 Hari Terakhir' };
    }
    if (timeFilter === 'this_month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      return { start: s, end: e, label: 'Bulan Ini' };
    }
    if (timeFilter === 'this_year') {
      const s = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const e = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
      return { start: s, end: e, label: 'Tahun Ini' };
    }
    return { start: '2020-01-01', end: '2099-12-31', label: 'Semua Waktu' };
  }, [timeFilter]);

  // STRICT RULE: Pemasukan Kas Diterima is based on payments received (payment_date)
  const periodPayments = useMemo(() => {
    return payments.filter((p) => p.payment_date >= filterRange.start && p.payment_date <= filterRange.end);
  }, [payments, filterRange]);

  const periodInvoices = useMemo(() => {
    return invoices.filter((i) => i.invoice_date >= filterRange.start && i.invoice_date <= filterRange.end);
  }, [invoices, filterRange]);

  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => e.expense_date >= filterRange.start && e.expense_date <= filterRange.end);
  }, [expenses, filterRange]);

  // 1. Calculate Real KPIs
  const totalPatients = patients.length;
  const activePatients = patients.filter((p) => p.status === 'Aktif').length;
  const totalTherapySessions = therapySessions.length;

  const periodRevenue = periodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const periodInvoiced = periodInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const periodExpense = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const periodNetIncome = periodRevenue - periodExpense;

  // All-time totals for reference
  const allTimeRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const allTimeInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Unpaid Invoices & Remaining Balances
  const unpaidInvoicesWithBalance = useMemo(() => {
    return invoices
      .filter((inv) => inv.payment_status === 'Belum Lunas' || inv.payment_status === 'DP')
      .map((inv) => {
        const invPayments = payments.filter(
          (p) => p.invoice_id === inv.id || (inv.sale_id && p.sale_id === inv.sale_id)
        );
        const paid = invPayments.reduce((s, p) => s + (p.amount || 0), 0);
        const balance = Math.max(0, inv.total - paid);
        return { ...inv, paid, balance };
      })
      .filter((inv) => inv.balance > 0);
  }, [invoices, payments]);

  const totalUnpaidAmount = unpaidInvoicesWithBalance.reduce((sum, inv) => sum + inv.balance, 0);

  // Low stock herbal products
  const lowStockProducts = herbalProducts.filter((p) => p.stock <= p.minimum_stock);

  // 2. Filter data for charts according to time filter: STRICTLY using payments (payment_date)
  const chartData = useMemo(() => {
    const result: Array<{ date: string; displayDate: string; revenue: number; expense: number; netIncome: number }> = [];
    const now = new Date();

    if (timeFilter === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      const dayIncome = payments
        .filter((p) => p.payment_date === todayStr)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const dayExpenses = expenses
        .filter((e) => e.expense_date === todayStr)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      result.push({
        date: todayStr,
        displayDate: 'Hari Ini',
        revenue: dayIncome,
        expense: dayExpenses,
        netIncome: dayIncome - dayExpenses,
      });
    } else if (timeFilter === 'this_year') {
      const currentYear = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const monthPrefix = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        const monthDate = new Date(currentYear, m, 1);
        const displayDate = monthDate.toLocaleDateString('id-ID', { month: 'short' });
        const mIncome = payments
          .filter((p) => p.payment_date.startsWith(monthPrefix))
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        const mExpense = expenses
          .filter((e) => e.expense_date.startsWith(monthPrefix))
          .reduce((sum, e) => sum + (e.amount || 0), 0);
        result.push({
          date: monthPrefix,
          displayDate,
          revenue: mIncome,
          expense: mExpense,
          netIncome: mIncome - mExpense,
        });
      }
    } else if (timeFilter === 'all') {
      const allDates = new Set<string>();
      payments.forEach((p) => allDates.add(p.payment_date.slice(0, 7)));
      expenses.forEach((e) => allDates.add(e.expense_date.slice(0, 7)));
      const sortedMonths = Array.from(allDates).sort();
      if (sortedMonths.length === 0) {
        sortedMonths.push(now.toISOString().slice(0, 7));
      }
      sortedMonths.forEach((monthStr) => {
        const [y, m] = monthStr.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        const displayDate = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        const mIncome = payments
          .filter((p) => p.payment_date.startsWith(monthStr))
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        const mExpense = expenses
          .filter((e) => e.expense_date.startsWith(monthStr))
          .reduce((sum, e) => sum + (e.amount || 0), 0);
        result.push({
          date: monthStr,
          displayDate,
          revenue: mIncome,
          expense: mExpense,
          netIncome: mIncome - mExpense,
        });
      });
    } else {
      const days = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : now.getDate();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        const dayIncome = payments
          .filter((p) => p.payment_date === dateStr)
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        const dayExpenses = expenses
          .filter((e) => e.expense_date === dateStr)
          .reduce((sum, e) => sum + (e.amount || 0), 0);

        result.push({
          date: dateStr,
          displayDate,
          revenue: dayIncome,
          expense: dayExpenses,
          netIncome: dayIncome - dayExpenses,
        });
      }
    }
    return result;
  }, [timeFilter, payments, expenses]);

  // Patient Status Breakdown for Pie Chart
  const patientStatusData = useMemo(() => {
    const counts = {
      Aktif: patients.filter((p) => p.status === 'Aktif').length,
      'Follow Up': patients.filter((p) => p.status === 'Follow Up').length,
      Selesai: patients.filter((p) => p.status === 'Selesai').length,
      Nonaktif: patients.filter((p) => p.status === 'Nonaktif').length,
    };
    return [
      { name: 'Aktif', value: counts.Aktif, color: '#0D9488' },
      { name: 'Follow Up', value: counts['Follow Up'], color: '#F59E0B' },
      { name: 'Selesai', value: counts.Selesai, color: '#3B82F6' },
      { name: 'Nonaktif', value: counts.Nonaktif, color: '#94A3B8' },
    ].filter((item) => item.value > 0);
  }, [patients]);

  // Recent Sessions
  const recentSessions = useMemo(() => {
    const patientMap = new Map(patients.map((p) => [p.id, p]));
    return [...therapySessions]
      .sort((a, b) => new Date(b.therapy_date).getTime() - new Date(a.therapy_date).getTime())
      .slice(0, 5)
      .map((ses) => ({
        ...ses,
        patient: patientMap.get(ses.patient_id),
      }));
  }, [therapySessions, patients]);

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl border border-slate-800 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-teal-400 font-bold px-2 py-0.5 bg-teal-950/80 border border-teal-800/60 rounded-lg">
              Executive Dashboard
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 text-white">
            {greeting}, {currentUser?.name || 'Yogi Pangestu'}
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Berikut ringkasan operasional Klinik Akupunktur Ahli Saraf Kejepit & Stroke hari ini.
          </p>
        </div>

        {/* Quick Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="dash-quick-patient-btn"
            onClick={() => onOpenQuickAction('new-patient')}
            className="flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-950/40 transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Pasien</span>
          </button>

          <button
            id="dash-quick-therapy-btn"
            onClick={() => onOpenQuickAction('new-therapy')}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95"
          >
            <Activity className="w-4 h-4" />
            <span>+ Sesi Terapi</span>
          </button>

          <button
            id="dash-quick-sale-btn"
            onClick={() => onOpenQuickAction('new-sale')}
            className="flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-950/40 transition-all hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Kasir / POS</span>
          </button>
        </div>
      </div>

      {/* Warning Banners if Low Stock or Unpaid */}
      {(lowStockProducts.length > 0 || unpaidInvoicesWithBalance.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockProducts.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Stok Herbal Menipis ({lowStockProducts.length} Produk)</h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    {lowStockProducts.map((p) => `${p.name} (${p.stock} ${p.unit})`).join(', ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('herbal')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shrink-0 transition-colors"
              >
                Cek Stok
              </button>
            </div>
          )}

          {unpaidInvoicesWithBalance.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Tagihan Belum Lunas ({unpaidInvoicesWithBalance.length} Invoice)</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Sisa piutang tertagih: <b>{formatRupiah(totalUnpaidAmount)}</b>
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('invoices')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 transition-colors"
              >
                Lihat Tagihan
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6 Real Database KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total Pasien */}
        <div
          onClick={() => onNavigate('patients')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pasien</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">{totalPatients}</p>
            <p className="text-[11px] text-teal-600 font-medium mt-0.5">Semua data terdaftar</p>
          </div>
        </div>

        {/* Pasien Aktif */}
        <div
          onClick={() => onNavigate('patients')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pasien Aktif</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-700">{activePatients}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Sedang dalam program</p>
          </div>
        </div>

        {/* Sesi Terapi */}
        <div
          onClick={() => onNavigate('therapy')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sesi Terapi</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">{totalTherapySessions}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Total kunjungan tindakan</p>
          </div>
        </div>

        {/* Total Pendapatan Kas Masuk */}
        <div
          onClick={() => onNavigate('financial-report')}
          className="p-4 bg-white rounded-2xl border border-teal-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer group ring-1 ring-teal-500/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Pemasukan Kas</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base sm:text-lg font-black text-slate-900 truncate">{formatRupiah(periodRevenue)}</p>
            <p className="text-[11px] text-teal-600 font-medium mt-0.5">Uang Diterima ({filterRange.label})</p>
          </div>
        </div>

        {/* Nilai Invoice (Tagihan) */}
        <div
          onClick={() => onNavigate('invoices')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nilai Invoice</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base sm:text-lg font-black text-slate-900 truncate">{formatRupiah(periodInvoiced)}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Total Tagihan ({filterRange.label})</p>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div
          onClick={() => onNavigate('finance')}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pengeluaran</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base sm:text-lg font-black text-slate-900 truncate">{formatRupiah(periodExpense)}</p>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">Biaya ({filterRange.label})</p>
          </div>
        </div>

        {/* Net Income (Formula: Revenue - Expense) */}
        <div
          onClick={() => onNavigate('financial-report')}
          className="p-4 bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl border border-teal-800/50 shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">Net Income</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base sm:text-lg font-black text-teal-300 truncate">{formatRupiah(periodNetIncome)}</p>
            <p className="text-[10px] text-slate-300 mt-0.5">Kas Masuk - Pengeluaran</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Expense Flow Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Arus Finansial (Pemasukan Kas & Biaya)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                  {filterRange.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">Pemasukan dicatat riil berdasarkan tanggal uang masuk (payment_date)</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTimeFilter('today')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  timeFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setTimeFilter('7d')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  timeFilter === '7d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setTimeFilter('30d')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  timeFilter === '30d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setTimeFilter('this_month')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  timeFilter === 'this_month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => setTimeFilter('this_year')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  timeFilter === 'this_year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tahun Ini
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  timeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `Rp${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value)), '']}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  name="Pendapatan (Revenue)"
                  dataKey="revenue"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  name="Pengeluaran (Expense)"
                  dataKey="expense"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Status Distribution (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Distribusi Status Pasien</h2>
            <p className="text-xs text-slate-500">Kategori progress terapi pasien</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={patientStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {patientStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} Pasien`, name]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '10px',
                    color: '#FFF',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {patientStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">
                  {item.value} Pasien ({((item.value / (totalPatients || 1)) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions & Fast POS Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Therapy Sessions (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sesi Terapi Terbaru</h2>
              <p className="text-xs text-slate-500">Catatan tindakan saraf kejepit & stroke terkini</p>
            </div>
            <button
              onClick={() => onNavigate('therapy')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>Semua Sesi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Belum ada sesi terapi yang tercatat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((ses) => (
                <div
                  key={ses.id}
                  onClick={() => onNavigate('therapy')}
                  className="p-3.5 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex flex-col items-center justify-center shrink-0 font-mono font-bold text-xs">
                      <span>#{ses.session_number}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-800">
                          {ses.patient?.full_name || 'Pasien'}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono">
                          {ses.patient?.patient_code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">{ses.therapy_type}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        Titik: {ses.treatment_area} • Respon: {ses.condition_after}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs font-bold text-slate-800">{formatRupiah(ses.cost)}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDateIndo(ses.therapy_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Practitioner Bio & WhatsApp Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between border border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-extrabold flex items-center justify-center font-mono text-lg">
                YP
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Yogi Pangestu</h3>
                <p className="text-xs text-teal-400">Praktisi Akupunktur & Owner</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Klinik berfokus pada terapi pemulihan spesifik Saraf Kejepit (HNP Cervical / Lumbal), Pasca Stroke
              (Hemiparese), Bell’s Palsy, Sciatica, dan Nyeri Kronis.
            </p>

            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Lokasi:</span>
                <span className="font-medium text-slate-200 text-right">Ruko Arcadia A-16</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rekening:</span>
                <span className="font-mono text-teal-300">BSI 5774090170</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">WhatsApp:</span>
                <span className="font-mono text-slate-200">081399670676</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => onNavigate('profile')}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
            >
              Lihat Sertifikasi & Ijazah
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
