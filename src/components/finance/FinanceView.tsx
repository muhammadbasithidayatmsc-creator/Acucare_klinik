import React, { useState, useMemo } from 'react';
import { Expense } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import {
  Wallet,
  Plus,
  Edit,
  Trash2,
  TrendingDown,
  Search,
  Filter,
  FileSpreadsheet,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';
import { formatRupiah, formatDateIndo, exportToExcel, exportToCSV } from '../../lib/exportUtils';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const FinanceView: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, addToast } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Form states
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('Pembelian Jarum & Alkes');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(100000);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'Debit'>('Transfer Bank');
  const [recipient, setRecipient] = useState('');

  const openAddModal = () => {
    setExpenseToEdit(null);
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setCategory('Pembelian Jarum & Alkes');
    setDescription('');
    setAmount(100000);
    setPaymentMethod('Transfer Bank');
    setRecipient('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setExpenseToEdit(exp);
    setExpenseDate(exp.expense_date);
    setCategory(exp.category);
    setDescription(exp.description);
    setAmount(exp.amount);
    setPaymentMethod(exp.payment_method as any);
    setRecipient(exp.recipient || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) {
      alert('Mohon isi keterangan dan jumlah pengeluaran.');
      return;
    }

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, {
        expense_date: expenseDate,
        category,
        description: description.trim(),
        amount: Number(amount),
        payment_method: paymentMethod,
        recipient: recipient.trim() || undefined,
      });
      addToast('success', 'Pengeluaran Berhasil Diperbarui');
    } else {
      addExpense({
        expense_date: expenseDate,
        category,
        description: description.trim(),
        amount: Number(amount),
        payment_method: paymentMethod,
        recipient: recipient.trim() || undefined,
      });
      addToast('success', 'Pengeluaran Berhasil Dicatat');
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const matchesSearch =
          exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (exp.recipient && exp.recipient.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCat = categoryFilter === 'ALL' || exp.category === categoryFilter;

        return matchesSearch && matchesCat;
      })
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  }, [expenses, searchQuery, categoryFilter]);

  const totalFilteredExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleExportExcel = () => {
    const data = filteredExpenses.map((e) => ({
      Tanggal: e.expense_date,
      Kategori: e.category,
      Keterangan: e.description,
      'Jumlah (Rp)': e.amount,
      'Metode Pembayaran': e.payment_method,
      Penerima: e.recipient || '',
    }));
    exportToExcel(data, `ACUCARE_Pengeluaran_${new Date().toISOString().slice(0, 10)}`, 'Pengeluaran');
    addToast('success', 'Export Excel Pengeluaran Berhasil');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pencatatan Arus Kas & Biaya</h1>
          <p className="text-xs text-slate-500 mt-1">
            Catat operasional klinik, pembelian jarum & alkes, sewa ruko Arcadia, serta restock herbal.
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
            id="expense-add-btn"
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-900/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 rounded-3xl text-white border border-rose-900/50 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-rose-300 font-bold">Total Pengeluaran Terfilter</span>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
              {formatRupiah(totalFilteredExpense)}
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          <p>{filteredExpenses.length} transaksi biaya tercatat</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari keterangan, penerima..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="ALL">Semua Kategori Biaya</option>
            <option value="Biaya Operasional & Listrik">Biaya Operasional & Listrik</option>
            <option value="Pembelian Jarum & Alkes">Pembelian Jarum & Alkes</option>
            <option value="Pembelian Stok Herbal">Pembelian Stok Herbal</option>
            <option value="Gaji & Honor Asisten">Gaji & Honor Asisten</option>
            <option value="Sewa Ruko Arcadia">Sewa Ruko Arcadia</option>
            <option value="Lain-lain">Lain-lain</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Kategori Biaya</th>
                <th className="py-3.5 px-4">Keterangan</th>
                <th className="py-3.5 px-4">Penerima / Vendor</th>
                <th className="py-3.5 px-4">Metode Bayar</th>
                <th className="py-3.5 px-4 text-right">Jumlah (Rp)</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">Belum ada catatan pengeluaran yang sesuai.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                      {formatDateIndo(exp.expense_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-800 font-bold text-[10px] border border-rose-200/60">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{exp.description}</td>
                    <td className="py-3.5 px-4 text-slate-500">{exp.recipient || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{exp.payment_method}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                      {formatRupiah(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Edit Pengeluaran"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpenseToDelete(exp)}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                          title="Hapus"
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
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base">
                  {expenseToEdit ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Biaya</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Biaya Operasional & Listrik">Biaya Operasional & Listrik</option>
                    <option value="Pembelian Jarum & Alkes">Pembelian Jarum & Alkes</option>
                    <option value="Pembelian Stok Herbal">Pembelian Stok Herbal</option>
                    <option value="Gaji & Honor Asisten">Gaji & Honor Asisten</option>
                    <option value="Sewa Ruko Arcadia">Sewa Ruko Arcadia</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Pengeluaran *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Pembelian Jarum Akupunktur Huanqiu 0.25x40mm 10 box"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Biaya (Rp) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Metode Bayar</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai">Tunai / Kas Kecil</option>
                    <option value="Debit">Debit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Penerima / Toko / Supplier</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Contoh: Toko Alkes Medika / PLN Bekasi"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
                >
                  Simpan Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Catatan Pengeluaran?"
        message={`Pengeluaran "${expenseToDelete?.description}" sebesar ${formatRupiah(
          expenseToDelete?.amount || 0
        )} akan dihapus.`}
        confirmText="Hapus"
        isDestructive
      />
    </div>
  );
};
