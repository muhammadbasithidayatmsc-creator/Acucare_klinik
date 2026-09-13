import React, { useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  Users,
  Package,
  Activity,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
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
import { formatRupiah, exportToExcel } from '../../lib/exportUtils';

export const ClinicalReportsView: React.FC = () => {
  const { patients, therapySessions, herbalProducts, sales, addToast } = useClinic();

  // 1. Complaint / Diagnosis Classification Breakdown
  const diagnosisBreakdown = useMemo(() => {
    let hnpCount = 0;
    let strokeCount = 0;
    let bellsPalsyCount = 0;
    let sciaticaCount = 0;
    let othersCount = 0;

    patients.forEach((p) => {
      const c = (p.main_complaint + ' ' + (p.medical_history || '')).toLowerCase();
      if (c.includes('kejepit') || c.includes('hnp') || c.includes('lumbal') || c.includes('cervical')) {
        hnpCount++;
      } else if (c.includes('stroke') || c.includes('hemiparese') || c.includes('lumpuh')) {
        strokeCount++;
      } else if (c.includes('bell') || c.includes('palsy') || c.includes('wajah')) {
        bellsPalsyCount++;
      } else if (c.includes('sciatica') || c.includes('piriformis') || c.includes('pinggang')) {
        sciaticaCount++;
      } else {
        othersCount++;
      }
    });

    return [
      { name: 'Saraf Kejepit (HNP)', count: hnpCount, color: '#0D9488' },
      { name: 'Pasca Stroke (Hemiparese)', count: strokeCount, color: '#3B82F6' },
      { name: "Bell's Palsy (Wajah)", count: bellsPalsyCount, color: '#F59E0B' },
      { name: 'Sciatica / Nyeri Saraf', count: sciaticaCount, color: '#8B5CF6' },
      { name: 'Keluhan Lainnya', count: othersCount, color: '#94A3B8' },
    ].filter((item) => item.count > 0);
  }, [patients]);

  // 2. Best-Selling Herbal Calculation
  const herbalSalesStats = useMemo(() => {
    const qtyMap = new Map<string, { name: string; qty: number; revenue: number; margin: number }>();

    sales.forEach((s) => {
      s.items?.forEach((item) => {
        if (item.item_type === 'HERBAL') {
          const current = qtyMap.get(item.item_id) || {
            name: item.item_name,
            qty: 0,
            revenue: 0,
            margin: 0,
          };
          const prod = herbalProducts.find((h) => h.id === item.item_id);
          const unitMargin = prod ? prod.selling_price - prod.buying_price : item.unit_price * 0.35;

          current.qty += item.quantity;
          current.revenue += item.subtotal;
          current.margin += unitMargin * item.quantity;
          qtyMap.set(item.item_id, current);
        }
      });
    });

    return Array.from(qtyMap.values()).sort((a, b) => b.qty - a.qty);
  }, [sales, herbalProducts]);

  // 3. Therapy Response distribution
  const responseStats = useMemo(() => {
    const counts = {
      'Membaik Signifikan': therapySessions.filter((s) => s.patient_response === 'Membaik Signifikan').length,
      Membaik: therapySessions.filter((s) => s.patient_response === 'Membaik').length,
      Tetap: therapySessions.filter((s) => s.patient_response === 'Tetap').length,
      'Perlu Evaluasi': therapySessions.filter((s) => s.patient_response === 'Perlu Evaluasi').length,
    };
    return [
      { name: 'Membaik Signifikan', value: counts['Membaik Signifikan'], color: '#10B981' },
      { name: 'Membaik', value: counts.Membaik, color: '#0D9488' },
      { name: 'Tetap (Lanjutan)', value: counts.Tetap, color: '#F59E0B' },
      { name: 'Perlu Evaluasi', value: counts['Perlu Evaluasi'], color: '#EF4444' },
    ];
  }, [therapySessions]);

  const handleExportExcel = () => {
    const sheetData = diagnosisBreakdown.map((d) => ({
      'Kategori Diagnosis / Kasus': d.name,
      'Jumlah Pasien': d.count,
      'Persentase (%)': `${((d.count / (patients.length || 1)) * 100).toFixed(1)}%`,
    }));
    exportToExcel(sheetData, `ACUCARE_Laporan_Klinis_${new Date().toISOString().slice(0, 10)}`, 'Kasus Klinis');
    addToast('success', 'Export Excel Laporan Klinis Berhasil');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Laporan Pasien & Produk Herbal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Statistik spesialisasi kasus klinis saraf & stroke, efektivitas terapi, serta produk herbal terlaris.
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

      {/* Row 1: Diagnosis Distribution & Therapy Clinical Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnosis Cases */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-1">Kasus Klinis Spesialis Terbanyak</h3>
          <p className="text-xs text-slate-500 mb-4">Distribusi keluhan saraf kejepit, stroke, dan neuromuskular</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diagnosisBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={120} />
                <Tooltip />
                <Bar dataKey="count" name="Jumlah Pasien" fill="#0D9488" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Therapy Response Effectiveness */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-1">Evaluasi Hasil Respon Pasien</h3>
          <p className="text-xs text-slate-500 mb-4">Persentase respon perbaikan klinis dari seluruh sesi terapi</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={responseStats} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {responseStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {responseStats.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value} sesi</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Best-selling Herbal Products Ranking */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Peringkat Produk Herbal Terlaris</h3>
            <p className="text-xs text-slate-500">Volume penjualan dan kontribusi profit herbal</p>
          </div>
        </div>

        {herbalSalesStats.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Belum ada transaksi herbal yang tercatat.</p>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Nama Produk Herbal</th>
                  <th className="py-3 px-4 text-center">Qty Terjual</th>
                  <th className="py-3 px-4 text-right">Total Penjualan</th>
                  <th className="py-3 px-4 text-right">Estimasi Laba Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {herbalSalesStats.map((item, idx) => (
                  <tr key={item.name} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">#{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{item.qty} unit</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(item.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      +{formatRupiah(item.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
