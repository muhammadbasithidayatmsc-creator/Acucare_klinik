export type UserRole = 'OWNER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type PatientStatus = 'Aktif' | 'Selesai' | 'Follow Up' | 'Nonaktif';

export interface Patient {
  id: string;
  patient_code: string; // e.g. ACU-000001
  full_name: string;
  nik?: string;
  birth_date?: string;
  gender: 'Laki-laki' | 'Perempuan';
  phone?: string;
  whatsapp: string;
  email?: string;
  address?: string;
  occupation?: string;
  emergency_contact?: string;
  main_complaint: string;
  additional_complaint?: string;
  medical_history?: string;
  allergy_notes?: string;
  important_notes?: string;
  status: PatientStatus;
  created_at: string;
  updated_at: string;
}

export interface TherapySession {
  id: string;
  patient_id: string;
  session_number: number;
  therapy_date: string;
  complaint: string;
  condition_before: string;
  therapy_type: string; // e.g. Akupunktur Saraf Kejepit, Elektroakupunktur, Terapi Stroke, Moksa, Bekam
  treatment_area: string; // e.g. Lumbal L4-L5, Cervical C5-C7, Hemiparese Dextra
  practitioner_notes: string;
  condition_after: string;
  patient_response: string;
  next_plan?: string;
  cost: number;
  payment_status: 'Lunas' | 'DP' | 'Belum Lunas' | 'Gratis';
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
  duration: number; // in minutes
  duration_minutes?: number;
  price: number;
  active: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface HerbalProduct {
  id: string;
  sku: string;
  code?: string;
  name: string;
  category: string;
  description?: string;
  unit: string; // e.g. Botol, Box, Sachet, Pcs
  purchase_price: number;
  buying_price?: number;
  selling_price: number;
  stock: number;
  minimum_stock: number;
  active: boolean;
  is_active?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  item_type: 'service' | 'product' | 'SERVICE' | 'HERBAL';
  item_id?: string;
  service_id?: string;
  product_id?: string;
  item_name: string;
  quantity: number;
  price: number;
  unit_price?: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoice_id?: string;
  invoice_number?: string;
  patient_id: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_status: 'Lunas' | 'DP' | 'Belum Lunas' | 'Refund';
  payment_method: 'Cash' | 'Transfer' | 'QRIS' | 'Debit' | 'Other';
  notes?: string;
  created_at: string;
  items?: SaleItem[];
}

export interface Payment {
  id: string;
  patient_id: string;
  sale_id?: string;
  invoice_id?: string;
  invoice_number?: string;
  payment_date: string;
  amount: number;
  payment_method: 'Cash' | 'Transfer' | 'QRIS' | 'Debit' | 'Other';
  status: 'Lunas' | 'DP' | 'Belum Lunas' | 'Refund';
  notes?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string; // INV-YYYYMM-XXXX
  patient_id: string;
  sale_id: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  discount: number;
  tax?: number;
  total: number;
  payment_status: 'Lunas' | 'DP' | 'Belum Lunas' | 'Refund';
  items?: any[];
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: 'Cash' | 'Transfer' | 'QRIS' | 'Debit' | 'Other' | 'Transfer Bank' | 'Tunai';
  recipient?: string;
  notes?: string;
  created_at: string;
}

export interface Income {
  id: string;
  income_date: string;
  category: string;
  description: string;
  amount: number;
  source: string; // e.g. 'manual' or 'sale'
  sale_id?: string;
  notes?: string;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface ClinicSettings {
  clinic_name: string;
  specialty: string;
  address: string;
  practitioner_name: string;
  whatsapp: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  invoice_footer: string;
  logo_url?: string;
  last_backup_date?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  is_supabase_connected?: boolean;
}

export interface DatabaseBackup {
  version: string;
  timestamp: string;
  exported_by: string;
  settings: ClinicSettings;
  users: User[];
  patients: Patient[];
  therapy_sessions: TherapySession[];
  services: Service[];
  service_categories: ServiceCategory[];
  herbal_products: HerbalProduct[];
  product_categories: ProductCategory[];
  sales: Sale[];
  sale_items: SaleItem[];
  payments: Payment[];
  invoices: Invoice[];
  expenses: Expense[];
  expense_categories: ExpenseCategory[];
  income: Income[];
}
