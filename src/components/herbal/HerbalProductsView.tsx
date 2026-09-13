import React, { useState, useMemo } from 'react';
import { HerbalProduct } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Search,
  CheckCircle2,
  X,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { formatRupiah, exportToExcel } from '../../lib/exportUtils';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const HerbalProductsView: React.FC = () => {
  const { herbalProducts, addHerbalProduct, updateHerbalProduct, deleteHerbalProduct, adjustHerbalStock, addToast } =
    useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<HerbalProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<HerbalProduct | null>(null);

  // Stock Adjust Modal
  const [stockAdjustProduct, setStockAdjustProduct] = useState<HerbalProduct | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(10);
  const [stockReason, setStockReason] = useState<string>('Restock / Pembelian Baru');

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Herbal Saraf & Sendi');
  const [buyingPrice, setBuyingPrice] = useState(60000);
  const [sellingPrice, setSellingPrice] = useState(95000);
  const [stock, setStock] = useState(25);
  const [minimumStock, setMinimumStock] = useState(5);
  const [unit, setUnit] = useState('Botol');
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setProductToEdit(null);
    setCode(`HRB-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setCategory('Herbal Saraf & Sendi');
    setBuyingPrice(60000);
    setSellingPrice(95000);
    setStock(20);
    setMinimumStock(5);
    setUnit('Botol');
    setDescription('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (prod: HerbalProduct) => {
    setProductToEdit(prod);
    setCode(prod.code);
    setName(prod.name);
    setCategory(prod.category);
    setBuyingPrice(prod.buying_price);
    setSellingPrice(prod.selling_price);
    setStock(prod.stock);
    setMinimumStock(prod.minimum_stock);
    setUnit(prod.unit);
    setDescription(prod.description || '');
    setIsFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (productToEdit) {
      updateHerbalProduct(productToEdit.id, {
        code,
        name: name.trim(),
        category,
        buying_price: Number(buyingPrice),
        selling_price: Number(sellingPrice),
        stock: Number(stock),
        minimum_stock: Number(minimumStock),
        unit,
        description: description.trim() || undefined,
        is_active: true,
      });
      addToast('success', 'Produk Herbal Berhasil Diperbarui');
    } else {
      addHerbalProduct({
        code,
        name: name.trim(),
        category,
        buying_price: Number(buyingPrice),
        selling_price: Number(sellingPrice),
        stock: Number(stock),
        minimum_stock: Number(minimumStock),
        unit,
        description: description.trim() || undefined,
        is_active: true,
      });
      addToast('success', 'Produk Herbal Baru Berhasil Ditambahkan');
    }
    setIsFormModalOpen(false);
  };

  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct) return;
    adjustHerbalStock(stockAdjustProduct.id, Number(stockDelta), stockReason);
    addToast('success', `Stok ${stockAdjustProduct.name} Berhasil Disesuaikan`);
    setStockAdjustProduct(null);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteHerbalProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const filteredProducts = useMemo(() => {
    return herbalProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [herbalProducts, searchQuery]);

  const handleExportExcel = () => {
    const data = filteredProducts.map((p) => ({
      'Kode SKU': p.code,
      'Nama Produk': p.name,
      Kategori: p.category,
      'Harga Beli': p.buying_price,
      'Harga Jual': p.selling_price,
      'Margin (Rp)': p.selling_price - p.buying_price,
      'Stok Saat Ini': p.stock,
      'Min. Stok': p.minimum_stock,
      Satuan: p.unit,
      Status: p.stock <= 0 ? 'Habis' : p.stock <= p.minimum_stock ? 'Menipis' : 'Aman',
    }));
    exportToExcel(data, `ACUCARE_Stok_Herbal_${new Date().toISOString().slice(0, 10)}`, 'Stok Herbal');
    addToast('success', 'Export Excel Stok Herbal Berhasil');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Katalog Produk Herbal & Stok</h1>
          <p className="text-xs text-slate-500 mt-1">
            Inventori obat herbal, minyak gosok meridian, kapsul herbal saraf, harga modal, margin, dan peringatan stok.
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
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Herbal</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode SKU, nama produk herbal, kategori..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Kode SKU</th>
                <th className="py-3.5 px-4">Nama Produk Herbal</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Harga Beli (Modal)</th>
                <th className="py-3.5 px-4">Harga Jual</th>
                <th className="py-3.5 px-4">Margin Laba</th>
                <th className="py-3.5 px-4 text-center">Stok / Satuan</th>
                <th className="py-3.5 px-4">Status Stok</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">Tidak ada produk herbal yang sesuai.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margin = p.selling_price - p.buying_price;
                  const isLow = p.stock <= p.minimum_stock && p.stock > 0;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-teal-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">{p.code}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        {p.description && <p className="text-[10px] text-slate-400 line-clamp-1">{p.description}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{formatRupiah(p.buying_price)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{formatRupiah(p.selling_price)}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">+{formatRupiah(margin)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-slate-900">
                          {p.stock} {p.unit}
                        </span>
                        <p className="text-[10px] text-slate-400">Min: {p.minimum_stock}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOut ? 'Habis (0)' : isLow ? 'Stok Menipis' : 'Stok Aman'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setStockAdjustProduct(p);
                              setStockDelta(10);
                            }}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-[10px] transition-colors"
                            title="Atur / Sesuaikan Stok"
                          >
                            ± Stok
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Edit Herbal"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                            title="Hapus Produk"
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
      </div>

      {/* Add / Edit Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base">
                  {productToEdit ? 'Edit Produk Herbal' : 'Tambah Produk Herbal Baru'}
                </h3>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode SKU *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Herbal Saraf & Sendi">Herbal Saraf & Sendi</option>
                    <option value="Minyak Terapi & Gosok">Minyak Terapi & Gosok</option>
                    <option value="Herbal Sirkulasi Darah">Herbal Sirkulasi Darah</option>
                    <option value="Alat & Perlengkapan">Alat & Perlengkapan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk Herbal *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kapsul Herbal Saraf Kejepit (Formula YP)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Beli / Modal (Rp) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual Pasien (Rp) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Stok</label>
                  <input
                    type="number"
                    min={0}
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Botol">Botol</option>
                    <option value="Box">Box</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Paket">Paket</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi & Khasiat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Khasiat untuk pelancaran Qi, pereda nyeri lumbal..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm">Penyesuaian Stok: {stockAdjustProduct.name}</h3>
              <button onClick={() => setStockAdjustProduct(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Stok Saat Ini:</span>
                <span className="font-bold font-mono text-sm text-slate-900">
                  {stockAdjustProduct.stock} {stockAdjustProduct.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Perubahan (+ Masuk / - Keluar)
                </label>
                <input
                  type="number"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Stok setelah penyesuaian:{' '}
                  <b>
                    {stockAdjustProduct.stock + Number(stockDelta)} {stockAdjustProduct.unit}
                  </b>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Penyesuaian</label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Restock / Pembelian Baru">Restock / Pembelian Baru</option>
                  <option value="Koreksi Opname Fisik">Koreksi Opname Fisik</option>
                  <option value="Rusak / Kadaluarsa">Rusak / Kadaluarsa</option>
                  <option value="Retur Pasien">Retur Pasien</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStockAdjustProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md"
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Produk Herbal?"
        message={`Produk ${productToDelete?.name} (${productToDelete?.code}) akan dihapus permanen dari inventori.`}
        confirmText="Hapus Produk"
        isDestructive
      />
    </div>
  );
};
