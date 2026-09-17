import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Patient,
  TherapySession,
  Service,
  ServiceCategory,
  HerbalProduct,
  ProductCategory,
  Sale,
  SaleItem,
  Payment,
  Invoice,
  Expense,
  ExpenseCategory,
  Income,
  ClinicSettings,
  DatabaseBackup,
} from '../types';
import { ClinicStore } from '../lib/storage';
import {
  exportFullBackupPDF,
  exportFullDatabaseExcel,
  downloadJsonFile,
  getBackupTimestamp,
} from '../lib/exportUtils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ClinicContextType {
  settings: ClinicSettings;
  updateSettings: (newSettings: Partial<ClinicSettings>) => void;

  // Patients
  patients: Patient[];
  addPatient: (patientData: Omit<Patient, 'id' | 'patient_code' | 'created_at' | 'updated_at'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  deleteAllPatients: () => void;

  // Therapy Sessions
  therapySessions: TherapySession[];
  addTherapySession: (sessionData: Omit<TherapySession, 'id' | 'created_at' | 'updated_at'>) => TherapySession;
  updateTherapySession: (id: string, updates: Partial<TherapySession>) => void;
  deleteTherapySession: (id: string) => void;

  // Services
  services: Service[];
  serviceCategories: ServiceCategory[];
  addService: (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Service;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addServiceCategory: (name: string) => void;
  deleteServiceCategory: (id: string) => void;

  // Herbal Products
  herbalProducts: HerbalProduct[];
  productCategories: ProductCategory[];
  addHerbalProduct: (productData: Omit<HerbalProduct, 'id' | 'created_at' | 'updated_at'>) => HerbalProduct;
  updateHerbalProduct: (id: string, updates: Partial<HerbalProduct>) => void;
  deleteHerbalProduct: (id: string) => void;
  adjustHerbalStock: (productId: string, delta: number, reason?: string, recordExpense?: boolean, expenseAmount?: number) => void;
  addProductCategory: (name: string) => void;
  deleteProductCategory: (id: string) => void;

  // Sales & Invoices
  sales: Sale[];
  saleItems: SaleItem[];
  invoices: Invoice[];
  addSale: (saleData: {
    patient_id: string;
    items: Array<{
      item_type: 'service' | 'product' | 'SERVICE' | 'HERBAL';
      service_id?: string;
      product_id?: string;
      item_name: string;
      quantity: number;
      price?: number;
      unit_price?: number;
      subtotal?: number;
    }>;
    subtotal?: number;
    discount?: number;
    total?: number;
    payment_method: 'Cash' | 'Transfer' | 'QRIS' | 'Debit' | 'Other' | string;
    payment_status: 'Lunas' | 'DP' | 'Belum Lunas' | 'Refund';
    notes?: string;
    amount_paid?: number;
    sale_date?: string;
    payment_date?: string;
  }) => { sale: Sale; invoice: Invoice };
  createSaleTransaction: (
    patientId: string,
    items: Array<{
      item_type: 'service' | 'product';
      service_id?: string;
      product_id?: string;
      item_name: string;
      quantity: number;
      price: number;
    }>,
    discount: number,
    paymentMethod: 'Cash' | 'Transfer' | 'QRIS' | 'Debit' | 'Other' | string,
    paymentStatus: 'Lunas' | 'DP' | 'Belum Lunas' | 'Refund',
    notes?: string,
    paidAmount?: number,
    saleDate?: string,
    paymentDate?: string
  ) => { sale: Sale; invoice: Invoice };
  deleteSaleTransaction: (saleId: string) => void;
  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'created_at'>) => Invoice;
  updateInvoiceStatus: (invoiceId: string, status: 'Lunas' | 'DP' | 'Belum Lunas' | 'Refund') => void;
  deleteInvoice: (invoiceId: string) => void;

  // Payments
  payments: Payment[];
  addPayment: (paymentData: Omit<Payment, 'id' | 'created_at'>) => Payment;

  // Expenses & Categories
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  addExpense: (expenseData: Omit<Expense, 'id' | 'created_at'>) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addExpenseCategory: (name: string) => void;
  deleteExpenseCategory: (id: string) => void;

  // Income
  income: Income[];
  addIncome: (incomeData: Omit<Income, 'id' | 'created_at'>) => Income;
  deleteIncome: (id: string) => void;

  // Database Backup & Reset
  backupDatabase: () => DatabaseBackup;
  restoreDatabase: (backup: DatabaseBackup) => { success: boolean; message: string; counts?: any };
  exportBackupPDF: () => void;
  exportBackupJSON: () => void;
  exportBackupExcel: () => void;
  validateBackupJSON: (jsonText: string) => {
    isValid: boolean;
    message: string;
    backup?: DatabaseBackup;
    counts?: any;
  };
  importBackupJSON: (jsonText: string) => { success: boolean; message: string; counts?: any };
  resetToDemo: () => void;
  resetToSampleData: () => void;

  // Global Search & UI Helpers
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  removeToast: (id: string) => void;
  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ClinicSettings>(ClinicStore.getSettings());
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapySessions, setTherapySessions] = useState<TherapySession[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [herbalProducts, setHerbalProducts] = useState<HerbalProduct[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);

  const addToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Reload all state from store
  const reloadFromStore = useCallback(() => {
    ClinicStore.initialize();
    setSettings(ClinicStore.getSettings());
    setPatients(ClinicStore.getPatients());
    setTherapySessions(ClinicStore.getTherapySessions());
    setServices(ClinicStore.getServices());
    setServiceCategories(ClinicStore.getServiceCategories());
    setHerbalProducts(ClinicStore.getHerbalProducts());
    setProductCategories(ClinicStore.getProductCategories());
    setSales(ClinicStore.getSales());
    setSaleItems(ClinicStore.getSaleItems());
    setInvoices(ClinicStore.getInvoices());
    setPayments(ClinicStore.getPayments());
    setExpenses(ClinicStore.getExpenses());
    setExpenseCategories(ClinicStore.getExpenseCategories());
    setIncome(ClinicStore.getIncome());
  }, []);

  useEffect(() => {
    reloadFromStore();
  }, [reloadFromStore]);

  // Keyboard shortcut Ctrl+K / Cmd+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Settings
  const updateSettings = (newSettings: Partial<ClinicSettings>) => {
    const updated = { ...settings, ...newSettings };
    ClinicStore.saveSettings(updated);
    setSettings(updated);
    addToast('success', 'Pengaturan Disimpan', 'Data pengaturan klinik berhasil diperbarui.');
  };

  // Patients CRUD
  const addPatient = (patientData: Omit<Patient, 'id' | 'patient_code' | 'created_at' | 'updated_at'>): Patient => {
    const now = new Date().toISOString();
    const newCode = ClinicStore.generatePatientCode();
    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      patient_code: newCode,
      ...patientData,
      created_at: now,
      updated_at: now,
    };
    const updated = [newPatient, ...patients];
    ClinicStore.savePatients(updated);
    setPatients(updated);
    addToast('success', 'Pasien Baru Ditambahkan', `${newPatient.full_name} (${newPatient.patient_code})`);
    return newPatient;
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    const now = new Date().toISOString();
    const updated = patients.map((p) => (p.id === id ? { ...p, ...updates, updated_at: now } : p));
    ClinicStore.savePatients(updated);
    setPatients(updated);
    addToast('success', 'Data Pasien Diperbarui', 'Perubahan berhasil disimpan ke database.');
  };

  const deletePatient = (id: string) => {
    const targetPatient = patients.find((p) => p.id === id);
    const updatedPatients = patients.filter((p) => p.id !== id);
    ClinicStore.savePatients(updatedPatients);
    setPatients(updatedPatients);

    // Cascade delete linked records for safety
    const updatedSessions = therapySessions.filter((s) => s.patient_id !== id);
    ClinicStore.saveTherapySessions(updatedSessions);
    setTherapySessions(updatedSessions);

    const updatedSales = sales.filter((s) => s.patient_id !== id);
    ClinicStore.saveSales(updatedSales);
    setSales(updatedSales);

    const updatedInvoices = invoices.filter((i) => i.patient_id !== id);
    ClinicStore.saveInvoices(updatedInvoices);
    setInvoices(updatedInvoices);

    const updatedPayments = payments.filter((pay) => pay.patient_id !== id);
    ClinicStore.savePayments(updatedPayments);
    setPayments(updatedPayments);

    addToast('info', 'Pasien Dihapus', `Data ${targetPatient?.full_name || 'pasien'} dan seluruh riwayatnya telah dihapus permanen.`);
  };

  const deleteAllPatients = () => {
    ClinicStore.deleteAllPatientData();
    reloadFromStore();
    addToast('warning', 'Semua Data Pasien Dihapus', 'Database pasien dan riwayat terkait telah dibersihkan secara permanen.');
  };

  // Therapy Sessions CRUD
  const addTherapySession = (sessionData: Omit<TherapySession, 'id' | 'created_at' | 'updated_at'>): TherapySession => {
    const now = new Date().toISOString();
    const newSession: TherapySession = {
      id: `ses-${Date.now()}`,
      ...sessionData,
      created_at: now,
      updated_at: now,
    };
    const updated = [newSession, ...therapySessions];
    ClinicStore.saveTherapySessions(updated);
    setTherapySessions(updated);

    // Update patient's updated_at
    updatePatient(sessionData.patient_id, { updated_at: now });

    addToast('success', 'Sesi Terapi Dicatat', `Sesi #${newSession.session_number} berhasil disimpan.`);
    return newSession;
  };

  const updateTherapySession = (id: string, updates: Partial<TherapySession>) => {
    const now = new Date().toISOString();
    const updated = therapySessions.map((s) => (s.id === id ? { ...s, ...updates, updated_at: now } : s));
    ClinicStore.saveTherapySessions(updated);
    setTherapySessions(updated);
    addToast('success', 'Sesi Terapi Diperbarui');
  };

  const deleteTherapySession = (id: string) => {
    const updated = therapySessions.filter((s) => s.id !== id);
    ClinicStore.saveTherapySessions(updated);
    setTherapySessions(updated);
    addToast('info', 'Sesi Terapi Dihapus');
  };

  // Services CRUD
  const addService = (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Service => {
    const now = new Date().toISOString();
    const newService: Service = {
      id: `srv-${Date.now()}`,
      ...serviceData,
      created_at: now,
      updated_at: now,
    };
    const updated = [...services, newService];
    ClinicStore.saveServices(updated);
    setServices(updated);
    addToast('success', 'Layanan Ditambahkan', newService.name);
    return newService;
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    const now = new Date().toISOString();
    const updated = services.map((s) => (s.id === id ? { ...s, ...updates, updated_at: now } : s));
    ClinicStore.saveServices(updated);
    setServices(updated);
    addToast('success', 'Layanan Diperbarui');
  };

  const deleteService = (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    ClinicStore.saveServices(updated);
    setServices(updated);
    addToast('info', 'Layanan Dihapus');
  };

  const addServiceCategory = (name: string) => {
    const newCat: ServiceCategory = {
      id: `sc-${Date.now()}`,
      name,
      active: true,
      created_at: new Date().toISOString(),
    };
    const updated = [...serviceCategories, newCat];
    ClinicStore.saveServiceCategories(updated);
    setServiceCategories(updated);
    addToast('success', 'Kategori Layanan Ditambahkan', name);
  };

  const deleteServiceCategory = (id: string) => {
    const updated = serviceCategories.filter((c) => c.id !== id);
    ClinicStore.saveServiceCategories(updated);
    setServiceCategories(updated);
  };

  // Herbal Products CRUD
  const addHerbalProduct = (productData: Omit<HerbalProduct, 'id' | 'created_at' | 'updated_at'>): HerbalProduct => {
    const now = new Date().toISOString();
    const newProduct: HerbalProduct = {
      id: `hrb-${Date.now()}`,
      ...productData,
      created_at: now,
      updated_at: now,
    };
    const updated = [...herbalProducts, newProduct];
    ClinicStore.saveHerbalProducts(updated);
    setHerbalProducts(updated);
    addToast('success', 'Produk Herbal Ditambahkan', newProduct.name);
    return newProduct;
  };

  const updateHerbalProduct = (id: string, updates: Partial<HerbalProduct>) => {
    const now = new Date().toISOString();
    const updated = herbalProducts.map((p) => (p.id === id ? { ...p, ...updates, updated_at: now } : p));
    ClinicStore.saveHerbalProducts(updated);
    setHerbalProducts(updated);
    addToast('success', 'Produk Herbal Diperbarui');
  };

  const deleteHerbalProduct = (id: string) => {
    const updated = herbalProducts.filter((p) => p.id !== id);
    ClinicStore.saveHerbalProducts(updated);
    setHerbalProducts(updated);
    addToast('info', 'Produk Dihapus');
  };

  const adjustHerbalStock = (
    productId: string,
    delta: number,
    reason: string = 'Penyesuaian Stok Manual',
    recordExpense: boolean = false,
    expenseAmount?: number
  ) => {
    const now = new Date().toISOString();
    const product = herbalProducts.find((p) => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, product.stock + delta);
    const updated = herbalProducts.map((p) =>
      p.id === productId ? { ...p, stock: newStock, updated_at: now } : p
    );
    ClinicStore.saveHerbalProducts(updated);
    setHerbalProducts(updated);

    // If restock with expense requested, add expense entry
    if (recordExpense && expenseAmount && expenseAmount > 0) {
      addExpense({
        expense_date: now.slice(0, 10),
        category: 'Pembelian & Restock Herbal',
        description: `Restock ${product.name} (+${delta} ${product.unit}): ${reason}`,
        amount: expenseAmount,
        payment_method: 'Transfer Bank',
        recipient: 'Supplier Herbal',
      });
    }

    addToast(
      'success',
      'Stok Herbal Diperbarui',
      `${product.name} sekarang: ${newStock} ${product.unit} (${delta >= 0 ? '+' : ''}${delta})`
    );
  };

  const addProductCategory = (name: string) => {
    const newCat: ProductCategory = {
      id: `pc-${Date.now()}`,
      name,
      active: true,
      created_at: new Date().toISOString(),
    };
    const updated = [...productCategories, newCat];
    ClinicStore.saveProductCategories(updated);
    setProductCategories(updated);
    addToast('success', 'Kategori Produk Ditambahkan', name);
  };

  const deleteProductCategory = (id: string) => {
    const updated = productCategories.filter((c) => c.id !== id);
    ClinicStore.saveProductCategories(updated);
    setProductCategories(updated);
  };

  // Sales, Invoices & POS Logic with Stock Reduction
  const addSale = (saleData: {
    patient_id: string;
    items: Array<{
      item_type: 'service' | 'product' | 'SERVICE' | 'HERBAL';
      service_id?: string;
      product_id?: string;
      item_name: string;
      quantity: number;
      price?: number;
      unit_price?: number;
      subtotal?: number;
    }>;
    subtotal?: number;
    discount?: number;
    total?: number;
    payment_method: 'Cash' | 'Transfer' | 'QRIS' | 'Debit' | 'Other' | string;
    payment_status: 'Lunas' | 'DP' | 'Belum Lunas' | 'Refund';
    notes?: string;
    amount_paid?: number;
    sale_date?: string;
    payment_date?: string;
  }): { sale: Sale; invoice: Invoice } => {
    const formattedItems = saleData.items.map((it) => ({
      item_type: (it.item_type === 'HERBAL' || it.item_type === 'product' ? 'product' : 'service') as 'service' | 'product',
      service_id: it.service_id,
      product_id: it.product_id,
      item_name: it.item_name,
      quantity: it.quantity,
      price: it.price !== undefined ? it.price : (it.unit_price !== undefined ? it.unit_price : 0),
    }));

    return createSaleTransaction(
      saleData.patient_id,
      formattedItems,
      saleData.discount || 0,
      saleData.payment_method,
      saleData.payment_status,
      saleData.notes,
      saleData.amount_paid,
      saleData.sale_date,
      saleData.payment_date
    );
  };
  const createSaleTransaction = (
    patientId: string,
    items: Array<{
      item_type: 'service' | 'product';
      service_id?: string;
      product_id?: string;
      item_name: string;
      quantity: number;
      price: number;
    }>,
    discount: number,
    paymentMethod: 'Cash' | 'Transfer' | 'QRIS' | 'Debit' | 'Other' | string,
    paymentStatus: 'Lunas' | 'DP' | 'Belum Lunas' | 'Refund',
    notes?: string,
    paidAmount?: number,
    saleDate?: string,
    paymentDate?: string
  ): { sale: Sale; invoice: Invoice } => {
    const saleId = `sale-${Date.now()}`;
    const invoiceId = `inv-${Date.now()}`;
    const invoiceNumber = ClinicStore.generateInvoiceNumber();
    const now = new Date().toISOString();
    const txDate = saleDate || now.slice(0, 10);
    const payDate = paymentDate || txDate;

    const calculatedSubtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const grandTotal = Math.max(0, calculatedSubtotal - (discount || 0));

    // Calculate actual money received at checkout
    let actualPaid = 0;
    if (paymentStatus === 'Lunas') {
      actualPaid = paidAmount !== undefined && paidAmount > 0 ? paidAmount : grandTotal;
    } else if (paymentStatus === 'DP') {
      actualPaid = paidAmount !== undefined ? paidAmount : 0;
    } else {
      actualPaid = 0;
    }

    // Determine finalized status based on actual payment received
    let finalPaymentStatus: 'Lunas' | 'DP' | 'Belum Lunas' = paymentStatus as any;
    if (actualPaid >= grandTotal && grandTotal > 0) {
      finalPaymentStatus = 'Lunas';
    } else if (actualPaid > 0) {
      finalPaymentStatus = 'DP';
    } else {
      finalPaymentStatus = 'Belum Lunas';
    }

    // 1. Create Sale Items
    const newSaleItems: SaleItem[] = items.map((it, idx) => ({
      id: `si-${Date.now()}-${idx}`,
      sale_id: saleId,
      item_type: it.item_type,
      service_id: it.service_id,
      product_id: it.product_id,
      item_name: it.item_name,
      quantity: it.quantity,
      price: it.price,
      subtotal: it.price * it.quantity,
    }));

    // 2. Reduce stock for herbal products purchased
    const currentHerbal = ClinicStore.getHerbalProducts();
    const updatedHerbal = currentHerbal.map((p) => {
      const soldItem = items.find((it) => it.item_type === 'product' && it.product_id === p.id);
      if (soldItem) {
        const newStock = Math.max(0, p.stock - soldItem.quantity);
        return { ...p, stock: newStock, updated_at: now };
      }
      return p;
    });
    ClinicStore.saveHerbalProducts(updatedHerbal);
    setHerbalProducts(updatedHerbal);

    // 3. Create Sale Record (using txDate)
    const newSale: Sale = {
      id: saleId,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      patient_id: patientId,
      sale_date: txDate,
      subtotal: calculatedSubtotal,
      discount: discount || 0,
      total: grandTotal,
      payment_status: finalPaymentStatus,
      payment_method: paymentMethod as any,
      notes: notes,
      created_at: now,
      items: newSaleItems,
    };

    // 4. Create Invoice Record (using txDate)
    const newInvoice: Invoice = {
      id: invoiceId,
      invoice_number: invoiceNumber,
      patient_id: patientId,
      sale_id: saleId,
      invoice_date: txDate,
      subtotal: calculatedSubtotal,
      discount: discount || 0,
      total: grandTotal,
      payment_status: finalPaymentStatus,
      created_at: now,
    };

    // 5. Create Payment record ONLY if money was actually received (actualPaid > 0)
    // STRICT RULE: payment_date is the exact date money was received (payDate)
    if (actualPaid > 0) {
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        patient_id: patientId,
        sale_id: saleId,
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        payment_date: payDate, // STRICTLY payment_date!
        amount: actualPaid,
        payment_method: paymentMethod as any,
        status: finalPaymentStatus,
        notes: notes || (finalPaymentStatus === 'Lunas' ? `Pembayaran lunas ${invoiceNumber}` : `Pembayaran DP ${invoiceNumber}`),
        created_at: now,
      };
      const updatedPayments = [newPayment, ...payments];
      ClinicStore.savePayments(updatedPayments);
      setPayments(updatedPayments);

      // 6. Record in Income strictly on payDate (payment_date)
      const newIncome: Income = {
        id: `inc-${Date.now()}`,
        income_date: payDate, // STRICTLY payment_date!
        category: 'Penjualan Layanan & Herbal',
        description: `Transaksi ${invoiceNumber}`,
        amount: actualPaid,
        source: 'sale',
        sale_id: saleId,
        notes: notes,
        created_at: now,
      };
      const updatedIncome = [newIncome, ...income];
      ClinicStore.saveIncome(updatedIncome);
      setIncome(updatedIncome);
    }

    // Save All Sale & Invoice State
    const allSaleItems = [...ClinicStore.getSaleItems(), ...newSaleItems];
    ClinicStore.saveSaleItems(allSaleItems);
    setSaleItems(allSaleItems);

    const updatedSales = [newSale, ...sales];
    ClinicStore.saveSales(updatedSales);
    setSales(updatedSales);

    const updatedInvoices = [newInvoice, ...invoices];
    ClinicStore.saveInvoices(updatedInvoices);
    setInvoices(updatedInvoices);

    addToast('success', 'Transaksi Berhasil!', `Invoice ${invoiceNumber} telah dibuat.`);
    return { sale: newSale, invoice: newInvoice };
  };

  const deleteSaleTransaction = (saleId: string) => {
    const saleToDelete = sales.find((s) => s.id === saleId);
    if (!saleToDelete) return;

    // Restore stock if herbal products were included
    const currentItems = saleItems.filter((it) => it.sale_id === saleId);
    const currentHerbal = ClinicStore.getHerbalProducts();
    const updatedHerbal = currentHerbal.map((p) => {
      const returnedItem = currentItems.find((it) => it.item_type === 'product' && it.product_id === p.id);
      if (returnedItem) {
        return { ...p, stock: p.stock + returnedItem.quantity };
      }
      return p;
    });
    ClinicStore.saveHerbalProducts(updatedHerbal);
    setHerbalProducts(updatedHerbal);

    // Remove sale items
    const remainingItems = saleItems.filter((it) => it.sale_id !== saleId);
    ClinicStore.saveSaleItems(remainingItems);
    setSaleItems(remainingItems);

    // Remove sale
    const remainingSales = sales.filter((s) => s.id !== saleId);
    ClinicStore.saveSales(remainingSales);
    setSales(remainingSales);

    // Remove invoice
    const remainingInvoices = invoices.filter((inv) => inv.sale_id !== saleId);
    ClinicStore.saveInvoices(remainingInvoices);
    setInvoices(remainingInvoices);

    // Remove payments linked
    const remainingPayments = payments.filter((p) => p.sale_id !== saleId);
    ClinicStore.savePayments(remainingPayments);
    setPayments(remainingPayments);

    // Remove income linked
    const remainingIncome = income.filter((inc) => inc.sale_id !== saleId);
    ClinicStore.saveIncome(remainingIncome);
    setIncome(remainingIncome);

    addToast('info', 'Transaksi Dibatalkan', 'Transaksi dihapus dan stok produk telah dikembalikan.');
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'created_at'>): Invoice => {
    const now = new Date().toISOString();
    const invoiceNumber = invoiceData.invoice_number || ClinicStore.generateInvoiceNumber();
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      ...invoiceData,
      invoice_number: invoiceNumber,
      created_at: now,
    };
    const updated = [newInvoice, ...invoices];
    ClinicStore.saveInvoices(updated);
    setInvoices(updated);
    addToast('success', 'Invoice Ditambahkan', `#${invoiceNumber}`);
    return newInvoice;
  };

  const updateInvoiceStatus = (invoiceId: string, status: 'Lunas' | 'DP' | 'Belum Lunas' | 'Refund') => {
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const updatedInvoices = invoices.map((i) => (i.id === invoiceId ? { ...i, payment_status: status } : i));
    ClinicStore.saveInvoices(updatedInvoices);
    setInvoices(updatedInvoices);

    // Also update associated sale status if linked
    if (inv.sale_id) {
      const updatedSales = sales.map((s) => (s.id === inv.sale_id ? { ...s, payment_status: status } : s));
      ClinicStore.saveSales(updatedSales);
      setSales(updatedSales);
    }

    // If marked Lunas, calculate outstanding balance and record payment for remaining amount
    if (status === 'Lunas') {
      const currentPaid = payments
        .filter((p) => p.invoice_id === invoiceId || (inv.sale_id && p.sale_id === inv.sale_id))
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = Math.max(0, inv.total - currentPaid);

      if (remaining > 0) {
        const newPayment: Payment = {
          id: `pay-${Date.now()}`,
          patient_id: inv.patient_id,
          invoice_id: invoiceId,
          sale_id: inv.sale_id,
          invoice_number: inv.invoice_number,
          payment_date: today, // Tanggal pelunasan = today
          amount: remaining,
          payment_method: 'Transfer',
          status: 'Lunas',
          notes: `Pelunasan Invoice #${inv.invoice_number}`,
          created_at: now,
        };
        const updatedPayments = [newPayment, ...payments];
        ClinicStore.savePayments(updatedPayments);
        setPayments(updatedPayments);

        const newIncome: Income = {
          id: `inc-${Date.now()}`,
          income_date: today,
          category: 'Penjualan Layanan & Herbal',
          description: `Pelunasan Invoice #${inv.invoice_number}`,
          amount: remaining,
          source: 'sale',
          sale_id: inv.sale_id,
          notes: `Pelunasan tagihan`,
          created_at: now,
        };
        const updatedIncome = [newIncome, ...income];
        ClinicStore.saveIncome(updatedIncome);
        setIncome(updatedIncome);
      }
    }

    addToast('success', `Status Invoice Diperbarui`, `#${inv.invoice_number} -> ${status}`);
  };

  const deleteInvoice = (invoiceId: string) => {
    const updated = invoices.filter((i) => i.id !== invoiceId);
    ClinicStore.saveInvoices(updated);
    setInvoices(updated);
    addToast('info', 'Invoice Dihapus');
  };

  // Payments CRUD
  const addPayment = (paymentData: Omit<Payment, 'id' | 'created_at'>): Payment => {
    const now = new Date().toISOString();
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      ...paymentData,
      created_at: now,
    };
    const updatedPayments = [newPayment, ...payments];
    ClinicStore.savePayments(updatedPayments);
    setPayments(updatedPayments);

    // Also record in Income strictly based on payment_date!
    const newIncome: Income = {
      id: `inc-${Date.now()}`,
      income_date: paymentData.payment_date, // STRICTLY payment_date!
      category: 'Penjualan Layanan & Herbal',
      description: paymentData.notes || `Pembayaran Invoice #${paymentData.invoice_number || ''}`,
      amount: paymentData.amount,
      source: 'sale',
      sale_id: paymentData.sale_id,
      notes: paymentData.notes,
      created_at: now,
    };
    const updatedIncome = [newIncome, ...income];
    ClinicStore.saveIncome(updatedIncome);
    setIncome(updatedIncome);

    // If linked to an invoice, recalculate status based on all payments
    if (paymentData.invoice_id) {
      const inv = invoices.find((i) => i.id === paymentData.invoice_id);
      if (inv) {
        const invPayments = updatedPayments.filter((p) => p.invoice_id === inv.id || (inv.sale_id && p.sale_id === inv.sale_id));
        const totalPaid = invPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        let newStatus: 'Lunas' | 'DP' | 'Belum Lunas' = 'Belum Lunas';
        if (totalPaid >= inv.total) {
          newStatus = 'Lunas';
        } else if (totalPaid > 0) {
          newStatus = 'DP';
        }

        const updatedInvoices = invoices.map((i) => (i.id === inv.id ? { ...i, payment_status: newStatus } : i));
        ClinicStore.saveInvoices(updatedInvoices);
        setInvoices(updatedInvoices);

        if (inv.sale_id) {
          const updatedSales = sales.map((s) => (s.id === inv.sale_id ? { ...s, payment_status: newStatus } : s));
          ClinicStore.saveSales(updatedSales);
          setSales(updatedSales);
        }
      }
    }

    addToast('success', 'Pembayaran Berhasil Dicatat', `Nominal: Rp ${paymentData.amount.toLocaleString('id-ID')} (Tgl: ${paymentData.payment_date})`);
    return newPayment;
  };

  // Expenses CRUD
  const addExpense = (expenseData: Omit<Expense, 'id' | 'created_at'>): Expense => {
    const now = new Date().toISOString();
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      ...expenseData,
      created_at: now,
    };
    const updated = [newExpense, ...expenses];
    ClinicStore.saveExpenses(updated);
    setExpenses(updated);
    addToast('success', 'Pengeluaran Dicatat', newExpense.description);
    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    const updated = expenses.map((e) => (e.id === id ? { ...e, ...updates } : e));
    ClinicStore.saveExpenses(updated);
    setExpenses(updated);
    addToast('success', 'Pengeluaran Diperbarui');
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    ClinicStore.saveExpenses(updated);
    setExpenses(updated);
    addToast('info', 'Pengeluaran Dihapus');
  };

  const addExpenseCategory = (name: string) => {
    const newCat: ExpenseCategory = {
      id: `ec-${Date.now()}`,
      name,
      active: true,
      created_at: new Date().toISOString(),
    };
    const updated = [...expenseCategories, newCat];
    ClinicStore.saveExpenseCategories(updated);
    setExpenseCategories(updated);
    addToast('success', 'Kategori Pengeluaran Ditambahkan', name);
  };

  const deleteExpenseCategory = (id: string) => {
    const updated = expenseCategories.filter((c) => c.id !== id);
    ClinicStore.saveExpenseCategories(updated);
    setExpenseCategories(updated);
  };

  // Income CRUD (Manual)
  const addIncome = (incomeData: Omit<Income, 'id' | 'created_at'>): Income => {
    const now = new Date().toISOString();
    const newIncome: Income = {
      id: `inc-${Date.now()}`,
      ...incomeData,
      created_at: now,
    };
    const updated = [newIncome, ...income];
    ClinicStore.saveIncome(updated);
    setIncome(updated);
    addToast('success', 'Pemasukan Dicatat', newIncome.description);
    return newIncome;
  };

  const deleteIncome = (id: string) => {
    const updated = income.filter((i) => i.id !== id);
    ClinicStore.saveIncome(updated);
    setIncome(updated);
    addToast('info', 'Pemasukan Dihapus');
  };

  // Database Backup & Reset
  const backupDatabase = (): DatabaseBackup => {
    const backup = ClinicStore.exportFullDatabase();
    setSettings(ClinicStore.getSettings());
    addToast('success', 'Backup Berhasil', 'Snapshot database berhasil dibuat.');
    return backup;
  };

  const exportBackupPDF = useCallback(() => {
    try {
      const backup = ClinicStore.exportFullDatabase();
      exportFullBackupPDF(backup);
      setSettings(ClinicStore.getSettings());
      addToast('success', 'Backup PDF Berhasil Diunduh', 'Seluruh arsip data klinik ACUCARE telah diekspor ke PDF.');
    } catch (err: any) {
      console.error('exportBackupPDF failed:', err);
      addToast('error', 'Gagal Download PDF', err.message || 'Terjadi kesalahan saat memproses PDF backup.');
    }
  }, [addToast]);

  const exportBackupJSON = useCallback(() => {
    try {
      const backup = ClinicStore.exportFullDatabase();
      const filename = `ACUCARE_Backup_${getBackupTimestamp()}.json`;
      downloadJsonFile(backup, filename);
      setSettings(ClinicStore.getSettings());
      addToast('success', 'Backup berhasil diunduh.', 'File technical JSON backup tersimpan aman.');
    } catch (err: any) {
      console.error('exportBackupJSON failed:', err);
      addToast('error', 'Gagal Download JSON', err.message || 'Terjadi kesalahan saat memproses JSON backup.');
    }
  }, [addToast]);

  const exportBackupExcel = useCallback(() => {
    try {
      const backup = ClinicStore.exportFullDatabase();
      exportFullDatabaseExcel(backup);
      addToast('success', 'Export Excel Berhasil', '12 sheet database ACUCARE berhasil diekspor.');
    } catch (err: any) {
      console.error('exportBackupExcel failed:', err);
      addToast('error', 'Gagal Export Excel', err.message || 'Terjadi kesalahan saat mengekspor file Excel.');
    }
  }, [addToast]);

  const validateBackupJSON = useCallback((jsonText: string) => {
    return ClinicStore.parseAndValidateBackup(jsonText);
  }, []);

  const importBackupJSON = useCallback(
    (jsonText: string) => {
      const valResult = ClinicStore.parseAndValidateBackup(jsonText);
      if (!valResult.isValid || !valResult.backup) {
        addToast('error', 'Validasi File Gagal', valResult.message);
        return { success: false, message: valResult.message };
      }

      const restoreResult = ClinicStore.importFullDatabase(valResult.backup);
      if (restoreResult.success) {
        reloadFromStore();
        addToast('success', 'Database Berhasil Dipulihkan', 'Seluruh data pasien, rekam medis, dan transaksi telah disinkronkan.');
      } else {
        addToast('error', 'Gagal Memulihkan Database', restoreResult.message);
      }
      return restoreResult;
    },
    [reloadFromStore, addToast]
  );

  const restoreDatabase = (backup: DatabaseBackup) => {
    const result = ClinicStore.importFullDatabase(backup);
    if (result.success) {
      reloadFromStore();
      addToast('success', 'Database Dipulihkan', result.message);
    } else {
      addToast('error', 'Gagal Memulihkan Database', result.message);
    }
    return result;
  };

  const resetToDemo = () => {
    ClinicStore.resetToDemoData();
    reloadFromStore();
    addToast('info', 'Data Demo Direset', 'Database dikembalikan ke data peragaan awal.');
  };

  const resetToSampleData = () => {
    resetToDemo();
  };

  return (
    <ClinicContext.Provider
      value={{
        settings,
        updateSettings,
        patients,
        addPatient,
        updatePatient,
        deletePatient,
        deleteAllPatients,
        therapySessions,
        addTherapySession,
        updateTherapySession,
        deleteTherapySession,
        services,
        serviceCategories,
        addService,
        updateService,
        deleteService,
        addServiceCategory,
        deleteServiceCategory,
        herbalProducts,
        productCategories,
        addHerbalProduct,
        updateHerbalProduct,
        deleteHerbalProduct,
        adjustHerbalStock,
        addProductCategory,
        deleteProductCategory,
        sales,
        saleItems,
        invoices,
        addSale,
        createSaleTransaction,
        deleteSaleTransaction,
        addInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        payments,
        addPayment,
        expenses,
        expenseCategories,
        addExpense,
        updateExpense,
        deleteExpense,
        addExpenseCategory,
        deleteExpenseCategory,
        income,
        addIncome,
        deleteIncome,
        backupDatabase,
        restoreDatabase,
        exportBackupPDF,
        exportBackupJSON,
        exportBackupExcel,
        validateBackupJSON,
        importBackupJSON,
        resetToDemo,
        resetToSampleData,
        toasts,
        addToast,
        removeToast,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
