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
  User,
  DatabaseBackup,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_PATIENTS,
  INITIAL_THERAPY_SESSIONS,
  INITIAL_SERVICES,
  INITIAL_SERVICE_CATEGORIES,
  INITIAL_HERBAL_PRODUCTS,
  INITIAL_PRODUCT_CATEGORIES,
  INITIAL_SALES,
  INITIAL_SALE_ITEMS,
  INITIAL_PAYMENTS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_INCOME,
} from './sampleData';
import { getSupabaseClient } from './supabase';

const STORAGE_KEYS = {
  SETTINGS: 'acucare_settings',
  USERS: 'acucare_users',
  PATIENTS: 'acucare_patients',
  THERAPY_SESSIONS: 'acucare_therapy_sessions',
  SERVICES: 'acucare_services',
  SERVICE_CATEGORIES: 'acucare_service_categories',
  HERBAL_PRODUCTS: 'acucare_herbal_products',
  PRODUCT_CATEGORIES: 'acucare_product_categories',
  SALES: 'acucare_sales',
  SALE_ITEMS: 'acucare_sale_items',
  PAYMENTS: 'acucare_payments',
  INVOICES: 'acucare_invoices',
  EXPENSES: 'acucare_expenses',
  EXPENSE_CATEGORIES: 'acucare_expense_categories',
  INCOME: 'acucare_income',
};

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export class ClinicStore {
  // --- Initialize Store ---
  static initialize(): void {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
      setItem(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.THERAPY_SESSIONS)) {
      setItem(STORAGE_KEYS.THERAPY_SESSIONS, INITIAL_THERAPY_SESSIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      setItem(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICE_CATEGORIES)) {
      setItem(STORAGE_KEYS.SERVICE_CATEGORIES, INITIAL_SERVICE_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HERBAL_PRODUCTS)) {
      setItem(STORAGE_KEYS.HERBAL_PRODUCTS, INITIAL_HERBAL_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCT_CATEGORIES)) {
      setItem(STORAGE_KEYS.PRODUCT_CATEGORIES, INITIAL_PRODUCT_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      setItem(STORAGE_KEYS.SALES, INITIAL_SALES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALE_ITEMS)) {
      setItem(STORAGE_KEYS.SALE_ITEMS, INITIAL_SALE_ITEMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
      setItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      setItem(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      setItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES)) {
      setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, INITIAL_EXPENSE_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INCOME)) {
      setItem(STORAGE_KEYS.INCOME, INITIAL_INCOME);
    }

    // Ensure initial sample invoices, sales, payments, and income are strictly synchronized
    const existingInvoices = this.getInvoices();
    let invoicesUpdated = false;
    INITIAL_INVOICES.forEach((initInv) => {
      const idx = existingInvoices.findIndex((inv) => inv.id === initInv.id || inv.invoice_number === initInv.invoice_number);
      if (idx === -1) {
        existingInvoices.push(initInv);
        invoicesUpdated = true;
      } else if (existingInvoices[idx].total !== initInv.total || existingInvoices[idx].invoice_date !== initInv.invoice_date) {
        existingInvoices[idx] = { ...existingInvoices[idx], ...initInv };
        invoicesUpdated = true;
      }
    });
    if (invoicesUpdated) {
      this.saveInvoices(existingInvoices);
    }

    const existingSales = this.getSales();
    let salesUpdated = false;
    INITIAL_SALES.forEach((initSale) => {
      const idx = existingSales.findIndex((s) => s.id === initSale.id);
      if (idx === -1) {
        existingSales.push(initSale);
        salesUpdated = true;
      } else if (existingSales[idx].total !== initSale.total || existingSales[idx].sale_date !== initSale.sale_date) {
        existingSales[idx] = { ...existingSales[idx], ...initSale };
        salesUpdated = true;
      }
    });
    if (salesUpdated) {
      this.saveSales(existingSales);
    }

    const existingPayments = this.getPayments();
    let paymentsUpdated = false;
    INITIAL_PAYMENTS.forEach((initPay) => {
      const idx = existingPayments.findIndex((p) => p.id === initPay.id || (p.invoice_number === initPay.invoice_number && p.payment_date === initPay.payment_date));
      if (idx === -1) {
        existingPayments.push(initPay);
        paymentsUpdated = true;
      } else if (existingPayments[idx].amount !== initPay.amount || existingPayments[idx].payment_date !== initPay.payment_date) {
        existingPayments[idx] = { ...existingPayments[idx], ...initPay };
        paymentsUpdated = true;
      }
    });
    if (paymentsUpdated) {
      this.savePayments(existingPayments);
    }

    const existingIncome = this.getIncome();
    let incomeUpdated = false;
    INITIAL_INCOME.forEach((initInc) => {
      const idx = existingIncome.findIndex((inc) => inc.id === initInc.id);
      if (idx === -1) {
        existingIncome.push(initInc);
        incomeUpdated = true;
      } else if (existingIncome[idx].amount !== initInc.amount || existingIncome[idx].income_date !== initInc.income_date) {
        existingIncome[idx] = { ...existingIncome[idx], ...initInc };
        incomeUpdated = true;
      }
    });
    if (incomeUpdated) {
      this.saveIncome(existingIncome);
    }
  }

  // --- Settings ---
  static getSettings(): ClinicSettings {
    return getItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }
  static saveSettings(settings: ClinicSettings): void {
    setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  // --- Users ---
  static getUsers(): User[] {
    return getItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  }
  static saveUsers(users: User[]): void {
    setItem(STORAGE_KEYS.USERS, users);
  }

  // --- Patients ---
  static getPatients(): Patient[] {
    return getItem(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
  }
  static savePatients(patients: Patient[]): void {
    setItem(STORAGE_KEYS.PATIENTS, patients);
  }
  static generatePatientCode(): string {
    const patients = this.getPatients();
    let maxNum = 0;
    patients.forEach((p) => {
      const match = p.patient_code.match(/ACU-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `ACU-${String(nextNum).padStart(6, '0')}`;
  }

  // --- Therapy Sessions ---
  static getTherapySessions(): TherapySession[] {
    return getItem(STORAGE_KEYS.THERAPY_SESSIONS, INITIAL_THERAPY_SESSIONS);
  }
  static saveTherapySessions(sessions: TherapySession[]): void {
    setItem(STORAGE_KEYS.THERAPY_SESSIONS, sessions);
  }

  // --- Services ---
  static getServices(): Service[] {
    return getItem(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  }
  static saveServices(services: Service[]): void {
    setItem(STORAGE_KEYS.SERVICES, services);
  }

  static getServiceCategories(): ServiceCategory[] {
    return getItem(STORAGE_KEYS.SERVICE_CATEGORIES, INITIAL_SERVICE_CATEGORIES);
  }
  static saveServiceCategories(categories: ServiceCategory[]): void {
    setItem(STORAGE_KEYS.SERVICE_CATEGORIES, categories);
  }

  // --- Herbal Products ---
  static getHerbalProducts(): HerbalProduct[] {
    return getItem(STORAGE_KEYS.HERBAL_PRODUCTS, INITIAL_HERBAL_PRODUCTS);
  }
  static saveHerbalProducts(products: HerbalProduct[]): void {
    setItem(STORAGE_KEYS.HERBAL_PRODUCTS, products);
  }

  static getProductCategories(): ProductCategory[] {
    return getItem(STORAGE_KEYS.PRODUCT_CATEGORIES, INITIAL_PRODUCT_CATEGORIES);
  }
  static saveProductCategories(categories: ProductCategory[]): void {
    setItem(STORAGE_KEYS.PRODUCT_CATEGORIES, categories);
  }

  // --- Sales & Sale Items ---
  static getSales(): Sale[] {
    return getItem(STORAGE_KEYS.SALES, INITIAL_SALES);
  }
  static saveSales(sales: Sale[]): void {
    setItem(STORAGE_KEYS.SALES, sales);
  }

  static getSaleItems(): SaleItem[] {
    return getItem(STORAGE_KEYS.SALE_ITEMS, INITIAL_SALE_ITEMS);
  }
  static saveSaleItems(items: SaleItem[]): void {
    setItem(STORAGE_KEYS.SALE_ITEMS, items);
  }

  // --- Invoices ---
  static getInvoices(): Invoice[] {
    return getItem(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  }
  static saveInvoices(invoices: Invoice[]): void {
    setItem(STORAGE_KEYS.INVOICES, invoices);
  }
  static generateInvoiceNumber(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${yyyy}${mm}-`;

    const invoices = this.getInvoices();
    let maxSeq = 0;
    invoices.forEach((inv) => {
      if (inv.invoice_number.startsWith(prefix)) {
        const seqPart = inv.invoice_number.substring(prefix.length);
        const seq = parseInt(seqPart, 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  // --- Payments ---
  static getPayments(): Payment[] {
    return getItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }
  static savePayments(payments: Payment[]): void {
    setItem(STORAGE_KEYS.PAYMENTS, payments);
  }

  // --- Expenses ---
  static getExpenses(): Expense[] {
    return getItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  }
  static saveExpenses(expenses: Expense[]): void {
    setItem(STORAGE_KEYS.EXPENSES, expenses);
  }

  static getExpenseCategories(): ExpenseCategory[] {
    return getItem(STORAGE_KEYS.EXPENSE_CATEGORIES, INITIAL_EXPENSE_CATEGORIES);
  }
  static saveExpenseCategories(categories: ExpenseCategory[]): void {
    setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, categories);
  }

  // --- Income ---
  static getIncome(): Income[] {
    return getItem(STORAGE_KEYS.INCOME, INITIAL_INCOME);
  }
  static saveIncome(income: Income[]): void {
    setItem(STORAGE_KEYS.INCOME, income);
  }

  // --- Full Database Backup & Restore ---
  static exportFullDatabase(exportedBy: string = 'Yogi Pangestu'): DatabaseBackup {
    const backup: DatabaseBackup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      exported_by: exportedBy,
      settings: this.getSettings(),
      users: this.getUsers(),
      patients: this.getPatients(),
      therapy_sessions: this.getTherapySessions(),
      services: this.getServices(),
      service_categories: this.getServiceCategories(),
      herbal_products: this.getHerbalProducts(),
      product_categories: this.getProductCategories(),
      sales: this.getSales(),
      sale_items: this.getSaleItems(),
      payments: this.getPayments(),
      invoices: this.getInvoices(),
      expenses: this.getExpenses(),
      expense_categories: this.getExpenseCategories(),
      income: this.getIncome(),
    };

    // Update settings with last backup date
    const currentSettings = this.getSettings();
    currentSettings.last_backup_date = backup.timestamp;
    this.saveSettings(currentSettings);

    return backup;
  }

  static importFullDatabase(backup: DatabaseBackup): { success: boolean; message: string } {
    try {
      if (!backup || !backup.patients) {
        return { success: false, message: 'Invalid backup file format.' };
      }
      if (backup.settings) this.saveSettings(backup.settings);
      if (backup.users) this.saveUsers(backup.users);
      if (backup.patients) this.savePatients(backup.patients);
      if (backup.therapy_sessions) this.saveTherapySessions(backup.therapy_sessions);
      if (backup.services) this.saveServices(backup.services);
      if (backup.service_categories) this.saveServiceCategories(backup.service_categories);
      if (backup.herbal_products) this.saveHerbalProducts(backup.herbal_products);
      if (backup.product_categories) this.saveProductCategories(backup.product_categories);
      if (backup.sales) this.saveSales(backup.sales);
      if (backup.sale_items) this.saveSaleItems(backup.sale_items);
      if (backup.payments) this.savePayments(backup.payments);
      if (backup.invoices) this.saveInvoices(backup.invoices);
      if (backup.expenses) this.saveExpenses(backup.expenses);
      if (backup.expense_categories) this.saveExpenseCategories(backup.expense_categories);
      if (backup.income) this.saveIncome(backup.income);

      return { success: true, message: 'Database successfully restored from backup!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to restore database.' };
    }
  }

  // --- Reset to Demo Data ---
  static resetToDemoData(): void {
    setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    setItem(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    setItem(STORAGE_KEYS.THERAPY_SESSIONS, INITIAL_THERAPY_SESSIONS);
    setItem(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    setItem(STORAGE_KEYS.SERVICE_CATEGORIES, INITIAL_SERVICE_CATEGORIES);
    setItem(STORAGE_KEYS.HERBAL_PRODUCTS, INITIAL_HERBAL_PRODUCTS);
    setItem(STORAGE_KEYS.PRODUCT_CATEGORIES, INITIAL_PRODUCT_CATEGORIES);
    setItem(STORAGE_KEYS.SALES, INITIAL_SALES);
    setItem(STORAGE_KEYS.SALE_ITEMS, INITIAL_SALE_ITEMS);
    setItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    setItem(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    setItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, INITIAL_EXPENSE_CATEGORIES);
    setItem(STORAGE_KEYS.INCOME, INITIAL_INCOME);
  }

  // --- Delete All Patient Data (Requirement 31) ---
  static deleteAllPatientData(): void {
    // Clear all patients
    setItem(STORAGE_KEYS.PATIENTS, []);
    // Clear all therapy sessions linked to patients
    setItem(STORAGE_KEYS.THERAPY_SESSIONS, []);
    // Clear all patient-linked sales
    setItem(STORAGE_KEYS.SALES, []);
    setItem(STORAGE_KEYS.SALE_ITEMS, []);
    // Clear all patient-linked invoices
    setItem(STORAGE_KEYS.INVOICES, []);
    // Clear all patient-linked payments
    setItem(STORAGE_KEYS.PAYMENTS, []);
    // Clear income derived from sales (keep manual income)
    const currentIncome = this.getIncome();
    const manualIncomeOnly = currentIncome.filter((inc) => inc.source !== 'sale');
    setItem(STORAGE_KEYS.INCOME, manualIncomeOnly);
  }

  // --- Synchronize to Supabase if connected ---
  static async syncToSupabase(): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Supabase is not configured or connected.' };
    }
    try {
      const patients = this.getPatients();
      if (patients.length > 0) {
        await client.from('patients').upsert(patients);
      }
      const services = this.getServices();
      if (services.length > 0) {
        await client.from('services').upsert(services);
      }
      const products = this.getHerbalProducts();
      if (products.length > 0) {
        await client.from('herbal_products').upsert(products);
      }
      return { success: true, message: 'Data synced to Supabase successfully!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Sync failed.' };
    }
  }
}
