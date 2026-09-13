import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { SaleItem, Patient, Service, HerbalProduct } from '../../types';
import {
  ShoppingCart,
  Plus,
  Trash2,
  User,
  Package,
  Sparkles,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  Search,
  Receipt,
  FileText,
  DollarSign,
  UserPlus,
  PlusCircle,
  Tag,
  Clock,
  ArrowRight,
  X,
  Store,
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '../../lib/exportUtils';

interface SalesViewProps {
  onViewInvoice: (invoiceId: string) => void;
  onOpenNewPatientModal: () => void;
  preselectedPatientId?: string;
}

export const SalesView: React.FC<SalesViewProps> = ({
  onViewInvoice,
  onOpenNewPatientModal,
  preselectedPatientId,
}) => {
  const {
    patients,
    services,
    herbalProducts,
    therapySessions,
    addSale,
    addHerbalProduct,
    addService,
    settings,
    addToast,
  } = useClinic();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    preselectedPatientId || (patients[0]?.id ?? 'WALK_IN_CUSTOMER')
  );
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'QRIS' | 'Debit'>('Transfer Bank');
  const [paymentStatus, setPaymentStatus] = useState<'Lunas' | 'Belum Lunas' | 'DP'>('Lunas');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Tab for item picker: Layanan, Herbal, or Custom Item
  const [catalogTab, setCatalogTab] = useState<'services' | 'herbal' | 'custom'>('services');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Quick Modal: Add New Herbal Product on the fly
  const [isQuickHerbalModalOpen, setIsQuickHerbalModalOpen] = useState(false);
  const [newHerbalName, setNewHerbalName] = useState('');
  const [newHerbalCategory, setNewHerbalCategory] = useState('Herbal Saraf & Sendi');
  const [newHerbalBuyingPrice, setNewHerbalBuyingPrice] = useState(50000);
  const [newHerbalSellingPrice, setNewHerbalSellingPrice] = useState(85000);
  const [newHerbalStock, setNewHerbalStock] = useState(20);
  const [newHerbalUnit, setNewHerbalUnit] = useState('Botol');

  // Quick Modal: Add New Service on the fly
  const [isQuickServiceModalOpen, setIsQuickServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Terapi Saraf Kejepit (HNP)');
  const [newServicePrice, setNewServicePrice] = useState(200000);
  const [newServiceDuration, setNewServiceDuration] = useState(60);

  // Custom Item on the fly state
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(50000);
  const [customItemQty, setCustomItemQty] = useState<number>(1);

  // Selected Patient Details
  const selectedPatient = useMemo(() => {
    if (selectedPatientId === 'WALK_IN_CUSTOMER') return null;
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  const patientSessionsCount = useMemo(() => {
    if (!selectedPatient) return 0;
    return therapySessions.filter((s) => s.patient_id === selectedPatient.id).length;
  }, [therapySessions, selectedPatient]);

  // Filtered catalog
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const isActive = s.active !== false && s.is_active !== false;
      const matches = s.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(catalogSearch.toLowerCase());
      return isActive && matches;
    });
  }, [services, catalogSearch]);

  const filteredHerbal = useMemo(() => {
    return herbalProducts.filter((h) => {
      const isActive = h.active !== false && h.is_active !== false;
      const sku = (h as any).sku || (h as any).code || '';
      const matches = h.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        h.category.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        sku.toLowerCase().includes(catalogSearch.toLowerCase());
      return isActive && matches;
    });
  }, [herbalProducts, catalogSearch]);

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartItems]);

  const total = Math.max(0, subtotal - discount + tax);

  // Auto-set amountPaid when total changes if status is Lunas
  const handlePaymentStatusChange = (status: 'Lunas' | 'Belum Lunas' | 'DP') => {
    setPaymentStatus(status);
    if (status === 'Lunas') {
      setAmountPaid(total);
    } else if (status === 'Belum Lunas') {
      setAmountPaid(0);
    }
  };

  const addItemToCart = (
    itemType: 'SERVICE' | 'HERBAL',
    itemId: string,
    name: string,
    unitPrice: number,
    availableStock?: number
  ) => {
    // Check if herbal has stock
    if (itemType === 'HERBAL' && availableStock !== undefined && availableStock <= 0) {
      alert(`Stok produk "${name}" habis.`);
      return;
    }

    const existingIndex = cartItems.findIndex(
      (ci) => (ci.item_id === itemId || ci.product_id === itemId || ci.service_id === itemId) && ci.item_type === itemType
    );

    if (existingIndex > -1) {
      const currentQty = cartItems[existingIndex].quantity;
      if (itemType === 'HERBAL' && availableStock !== undefined && currentQty + 1 > availableStock) {
        alert(`Jumlah melebihi stok yang tersedia (${availableStock}).`);
        return;
      }

      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      const uPrice = updated[existingIndex].unit_price || updated[existingIndex].price;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * uPrice;
      setCartItems(updated);
    } else {
      const newItem: SaleItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sale_id: '',
        item_type: itemType,
        item_id: itemId,
        product_id: itemType === 'HERBAL' ? itemId : undefined,
        service_id: itemType === 'SERVICE' ? itemId : undefined,
        item_name: name,
        quantity: 1,
        price: unitPrice,
        unit_price: unitPrice,
        subtotal: unitPrice,
      };
      setCartItems((prev) => [...prev, newItem]);
    }
  };

  const addCustomItemToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || customItemPrice <= 0 || customItemQty <= 0) {
      alert('Isi nama item, harga, dan jumlah dengan benar.');
      return;
    }

    const newItem: SaleItem = {
      id: `custom-${Date.now()}`,
      sale_id: '',
      item_type: 'HERBAL',
      item_name: customItemName.trim(),
      quantity: Number(customItemQty),
      price: Number(customItemPrice),
      unit_price: Number(customItemPrice),
      subtotal: Number(customItemQty) * Number(customItemPrice),
    };

    setCartItems((prev) => [...prev, newItem]);
    setCustomItemName('');
    setCustomItemPrice(50000);
    setCustomItemQty(1);
    addToast('success', 'Item Kustom Ditambahkan ke Keranjang');
  };

  const handleSaveQuickHerbal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHerbalName.trim()) return;

    const generatedSku = `HRB-${Math.floor(1000 + Math.random() * 9000)}`;
    const created = addHerbalProduct({
      sku: generatedSku,
      code: generatedSku,
      name: newHerbalName.trim(),
      category: newHerbalCategory,
      purchase_price: Number(newHerbalBuyingPrice),
      buying_price: Number(newHerbalBuyingPrice),
      selling_price: Number(newHerbalSellingPrice),
      stock: Number(newHerbalStock),
      minimum_stock: 5,
      unit: newHerbalUnit,
      active: true,
      is_active: true,
      description: 'Produk herbal toko klinis',
    });

    // Automatically add to cart!
    addItemToCart('HERBAL', created.id, created.name, created.selling_price, created.stock);
    setIsQuickHerbalModalOpen(false);
    setNewHerbalName('');
    addToast('success', 'Produk Herbal Berhasil Didaftarkan & Masuk Keranjang');
  };

  const handleSaveQuickService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const created = addService({
      name: newServiceName.trim(),
      category: newServiceCategory,
      price: Number(newServicePrice),
      duration: Number(newServiceDuration),
      duration_minutes: Number(newServiceDuration),
      active: true,
      is_active: true,
    });

    // Automatically add to cart!
    addItemToCart('SERVICE', created.id, created.name, created.price);
    setIsQuickServiceModalOpen(false);
    setNewServiceName('');
    addToast('success', 'Layanan Berhasil Ditambahkan & Masuk Keranjang');
  };

  const updateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItemFromCart(index);
      return;
    }

    const item = cartItems[index];
    if (item.item_type === 'HERBAL' && item.item_id) {
      const prod = herbalProducts.find((h) => h.id === item.item_id || h.id === item.product_id);
      if (prod && newQty > prod.stock) {
        alert(`Stok tidak mencukupi. Tersisa ${prod.stock} ${prod.unit}.`);
        return;
      }
    }

    const updated = [...cartItems];
    updated[index].quantity = newQty;
    const uPrice = updated[index].unit_price || updated[index].price;
    updated[index].subtotal = newQty * uPrice;
    setCartItems(updated);
  };

  const removeItemFromCart = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Keranjang transaksi masih kosong. Silakan pilih layanan atau produk herbal.');
      return;
    }

    const patientTargetId = selectedPatientId === 'WALK_IN_CUSTOMER' 
      ? (patients[0]?.id || 'pat-general') 
      : selectedPatientId;

    const paid = paymentStatus === 'Lunas' ? total : (paymentStatus === 'DP' ? amountPaid : 0);

    const { sale, invoice } = addSale({
      patient_id: patientTargetId,
      items: cartItems,
      subtotal,
      discount,
      total,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      notes: notes ? `${notes}${selectedPatientId === 'WALK_IN_CUSTOMER' ? ' (Pelanggan Toko Umum / Non-Pasien)' : ''}` : (selectedPatientId === 'WALK_IN_CUSTOMER' ? 'Pelanggan Toko Umum / Non-Pasien' : undefined),
      amount_paid: paid,
      sale_date: saleDate,
      payment_date: paymentDate,
    });

    addToast('success', 'Transaksi Penjualan Berhasil Disimpan!');

    // Reset Cart
    setCartItems([]);
    setDiscount(0);
    setTax(0);
    setNotes('');
    setAmountPaid(0);

    // If invoice created, view invoice
    if (invoice?.id) {
      onViewInvoice(invoice.id);
    } else if (sale.invoice_id) {
      onViewInvoice(sale.invoice_id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Store className="w-7 h-7 text-teal-600" />
            <span>Kasir & Penjualan Terintegrasi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penjualan layanan terapi, obat herbal toko, pengurangan stok otomatis, dan cetak invoice resmi pasien.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQuickHerbalModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Input Herbal Baru</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQuickServiceModalOpen(true)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Input Layanan Baru</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Catalog Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            {/* Tab switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCatalogTab('services')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    catalogTab === 'services'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Layanan Terapi ({services.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCatalogTab('herbal')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    catalogTab === 'herbal'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Produk Toko Herbal ({herbalProducts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCatalogTab('custom')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    catalogTab === 'custom'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Item Manual / Kustom</span>
                </button>
              </div>

              {/* Search catalog */}
              {catalogTab !== 'custom' && (
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Cari item..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            {/* Catalog Grid / Tab View */}
            <div className="mt-4">
              {catalogTab === 'services' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredServices.map((svc) => (
                    <div
                      key={svc.id}
                      onClick={() => addItemToCart('SERVICE', svc.id, svc.name, svc.price)}
                      className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-teal-400 hover:bg-teal-50/40 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-teal-800">
                            {svc.name}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {svc.duration_minutes || svc.duration}m
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{svc.description || svc.category}</p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <span className="font-bold text-xs text-teal-700 font-mono">{formatRupiah(svc.price)}</span>
                        <span className="text-[10px] font-bold text-teal-600 group-hover:underline flex items-center gap-0.5">
                          <Plus className="w-3.5 h-3.5" /> Tambah
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {catalogTab === 'herbal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredHerbal.map((prod) => {
                    const sku = (prod as any).sku || (prod as any).code || 'HRB';
                    const sPrice = prod.selling_price || (prod as any).price || 0;
                    const isOutOfStock = prod.stock <= 0;

                    return (
                      <div
                        key={prod.id}
                        onClick={() =>
                          addItemToCart('HERBAL', prod.id, prod.name, sPrice, prod.stock)
                        }
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                          isOutOfStock
                            ? 'border-rose-200 bg-rose-50/30 opacity-60'
                            : 'border-slate-200/80 hover:border-emerald-400 hover:bg-emerald-50/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-800">
                              {prod.name}
                            </h4>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-800'
                                  : prod.stock <= prod.minimum_stock
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              Stok: {prod.stock} {prod.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[10px] text-teal-700">{sku}</span>
                            <span className="text-[10px] text-slate-400">• {prod.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                          <span className="font-bold text-xs text-slate-900 font-mono">
                            {formatRupiah(sPrice)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 group-hover:underline flex items-center gap-0.5">
                            <Plus className="w-3.5 h-3.5" /> Tambah
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {catalogTab === 'custom' && (
                <form onSubmit={addCustomItemToCart} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Tag className="w-4 h-4 text-teal-600" />
                    <span>Tambah Item Manual / Toko Bebas ke Keranjang</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Item / Produk / Jasa *</label>
                      <input
                        type="text"
                        required
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        placeholder="Contoh: Koyo Herbal Magnetik (1 Sachet) / Biaya Konsultasi Tambahan"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Harga Satuan (Rp) *</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={customItemPrice}
                        onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-600">Jumlah (Qty):</label>
                      <input
                        type="number"
                        min={1}
                        value={customItemQty}
                        onChange={(e) => setCustomItemQty(Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center text-xs font-mono font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Masukkan ke Keranjang</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Cart & Checkout Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleCheckout}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4"
          >
            {/* Patient Header Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>Pasien / Pelanggan *</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenNewPatientModal}
                  className="text-[11px] text-teal-600 font-bold hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Pasien Baru</span>
                </button>
              </div>

              <select
                id="pos-patient-select"
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="WALK_IN_CUSTOMER">
                  🛍️ Pelanggan Toko Herbal (Umum / Non-Pasien)
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patient_code} - {p.full_name} ({p.whatsapp})
                  </option>
                ))}
              </select>

              {/* Selected Patient Brief Card */}
              {selectedPatient && (
                <div className="p-2.5 bg-teal-50/60 border border-teal-200/60 rounded-xl text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-900">{selectedPatient.full_name}</span>
                    <span className="text-teal-800 font-mono font-semibold">{patientSessionsCount} Sesi Terapi</span>
                  </div>
                  <p className="text-slate-600 line-clamp-1">
                    <span className="font-medium text-slate-700">Keluhan:</span> {selectedPatient.main_complaint}
                  </p>
                </div>
              )}
            </div>

            {/* Cart Table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Daftar Item ({cartItems.length})</span>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="text-rose-600 hover:underline lowercase font-normal"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 p-1 custom-scrollbar">
                {cartItems.length === 0 ? (
                  <div className="py-7 text-center text-xs text-slate-400">
                    <ShoppingCart className="w-6 h-6 mx-auto mb-1 opacity-40 text-slate-400" />
                    <p>Keranjang kosong. Pilih layanan atau herbal di samping.</p>
                  </div>
                ) : (
                  cartItems.map((item, idx) => {
                    const uPrice = item.unit_price || item.price;
                    return (
                      <div key={item.id} className="p-2 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 truncate">{item.item_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{formatRupiah(uPrice)}</p>
                        </div>

                        {/* Qty Stepper */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItemQty(idx, Number(e.target.value))}
                            className="w-12 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-center text-xs font-mono font-bold"
                          />
                          <span className="font-bold text-slate-800 w-20 text-right font-mono">
                            {formatRupiah(item.subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItemFromCart(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Calculations & Discounts */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">{formatRupiah(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Diskon (Rp):</span>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Akhir:</span>
                <span className="text-teal-800 font-mono">{formatRupiah(total)}</span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tgl Invoice / Transaksi</label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => {
                      setSaleDate(e.target.value);
                      if (paymentDate === saleDate) setPaymentDate(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => handlePaymentStatusChange(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Lunas">Lunas (100%)</option>
                    <option value="DP">DP (Uang Muka)</option>
                    <option value="Belum Lunas">Belum Lunas (Tempo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Metode Bayar</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Transfer Bank">Transfer Bank (BSI)</option>
                    <option value="Tunai">Tunai / Cash</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Debit">Debit Card</option>
                  </select>
                </div>

                {paymentStatus !== 'Belum Lunas' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">Tgl Uang Diterima</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Uang Diterima</label>
                    <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono">
                      Rp 0 (Tempo)
                    </div>
                  </div>
                )}
              </div>

              {paymentStatus === 'DP' && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 mb-1">Jumlah DP yang Diterima (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      max={total}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-amber-900 font-medium pt-1 border-t border-amber-200/60">
                    <span>Sisa Piutang:</span>
                    <span className="font-mono font-bold text-rose-700">{formatRupiah(Math.max(0, total - amountPaid))}</span>
                  </div>
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan transaksi (opsional)..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400"
                />
              </div>
            </div>

            {/* Checkout Submit Button */}
            <button
              id="pos-submit-btn"
              type="submit"
              disabled={cartItems.length === 0}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-900/20 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesaikan Transaksi & Cetak Invoice</span>
            </button>
          </form>
        </div>
      </div>

      {/* QUICK MODAL: ADD HERBAL ON THE FLY */}
      {isQuickHerbalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between border-b border-emerald-900">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Input Produk Herbal Toko Baru</h3>
              </div>
              <button onClick={() => setIsQuickHerbalModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickHerbal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk Herbal *</label>
                <input
                  type="text"
                  required
                  value={newHerbalName}
                  onChange={(e) => setNewHerbalName(e.target.value)}
                  placeholder="Contoh: Kapsul Herbal Saraf Lumbal L4-L5"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={newHerbalCategory}
                    onChange={(e) => setNewHerbalCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Herbal Saraf & Sendi">Herbal Saraf & Sendi</option>
                    <option value="Herbal Sirkulasi Darah & Stroke">Herbal Sirkulasi Darah & Stroke</option>
                    <option value="Minyak Gosok & Herbal Topikal">Minyak Gosok & Herbal Topikal</option>
                    <option value="Suplemen Sendi & Tulang">Suplemen Sendi & Tulang</option>
                    <option value="Koyo & Plester Medis">Koyo & Plester Medis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={newHerbalUnit}
                    onChange={(e) => setNewHerbalUnit(e.target.value)}
                    placeholder="Botol / Kotak / Sachet"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Beli (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newHerbalBuyingPrice}
                    onChange={(e) => setNewHerbalBuyingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newHerbalSellingPrice}
                    onChange={(e) => setNewHerbalSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newHerbalStock}
                    onChange={(e) => setNewHerbalStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickHerbalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Simpan & Masukkan ke Keranjang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK MODAL: ADD SERVICE ON THE FLY */}
      {isQuickServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between border-b border-teal-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-base">Input Layanan Terapi Baru</h3>
              </div>
              <button onClick={() => setIsQuickServiceModalOpen(false)} className="text-teal-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickService} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Layanan *</label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Contoh: Akupunktur & Dry Needling Trigger Point"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Terapi Saraf Kejepit (HNP)">Terapi Saraf Kejepit (HNP)</option>
                    <option value="Terapi Pemulihan Stroke">Terapi Pemulihan Stroke</option>
                    <option value="Akupunktur Medis & Nyeri">Akupunktur Medis & Nyeri</option>
                    <option value="Konsultasi & Pemeriksaan">Konsultasi & Pemeriksaan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Menit)</label>
                  <input
                    type="number"
                    min={15}
                    step={5}
                    required
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tarif Layanan (Rp) *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-teal-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Simpan & Masukkan ke Keranjang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
