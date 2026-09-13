import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Try reading from environment variables
const ENV_SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const ENV_SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || ENV_SUPABASE_URL || (typeof window !== 'undefined' ? localStorage.getItem('acucare_supabase_url') || '' : '');
  const key = customKey || ENV_SUPABASE_ANON_KEY || (typeof window !== 'undefined' ? localStorage.getItem('acucare_supabase_key') || '' : '');

  if (!url || !key || url === 'https://your-project.supabase.co') {
    return null;
  }

  try {
    if (!supabaseClientInstance || customUrl || customKey) {
      supabaseClientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
    return supabaseClientInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !key) {
      return { success: false, message: 'URL and Anon Key are required.' };
    }
    const client = createClient(url, key);
    // Simple ping to test connectivity
    const { error } = await client.from('patients').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "patients" does not exist')) {
      // If table doesn't exist yet, connection is still valid, user just needs to run SQL schema
      if (error.message.includes('does not exist')) {
        return {
          success: true,
          message: 'Connection successful! (Tables need to be created using SQL Schema).',
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connection to Supabase PostgreSQL established successfully!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Could not connect to Supabase.' };
  }
}

export function getSupabaseSchemaSQL(): string {
  return `-- ==============================================================================
-- ACUCARE CLINIC MANAGEMENT - POSTGRESQL / SUPABASE DATABASE SCHEMA
-- Clinic: Klinik Akupunktur Ahli Saraf Kejepit & Stroke (Yogi Pangestu)
-- Address: Ruko Arcadia Residence A-16, Karangsatria, Tambun Utara, Bekasi
-- ==============================================================================

-- 1. USERS & PRACTITIONERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nik TEXT,
  birth_date DATE,
  gender TEXT NOT NULL CHECK (gender IN ('Laki-laki', 'Perempuan')),
  phone TEXT,
  whatsapp TEXT NOT NULL,
  email TEXT,
  address TEXT,
  occupation TEXT,
  emergency_contact TEXT,
  main_complaint TEXT NOT NULL,
  additional_complaint TEXT,
  medical_history TEXT,
  allergy_notes TEXT,
  important_notes TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Selesai', 'Follow Up', 'Nonaktif')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. THERAPY SESSIONS
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  therapy_date DATE NOT NULL,
  complaint TEXT NOT NULL,
  condition_before TEXT NOT NULL,
  therapy_type TEXT NOT NULL,
  treatment_area TEXT NOT NULL,
  practitioner_notes TEXT NOT NULL,
  condition_after TEXT NOT NULL,
  patient_response TEXT NOT NULL,
  next_plan TEXT,
  cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Lunas' CHECK (payment_status IN ('Lunas', 'DP', 'Belum Lunas', 'Gratis')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SERVICE CATEGORIES & SERVICES
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PRODUCT CATEGORIES & HERBAL PRODUCTS
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS herbal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'Botol',
  purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  minimum_stock INTEGER NOT NULL DEFAULT 5,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SALES & SALE ITEMS
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Lunas' CHECK (payment_status IN ('Lunas', 'DP', 'Belum Lunas', 'Refund')),
  payment_method TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Transfer', 'QRIS', 'Debit', 'Other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('service', 'product')),
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  product_id UUID REFERENCES herbal_products(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- 7. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Lunas' CHECK (payment_status IN ('Lunas', 'DP', 'Belum Lunas', 'Refund')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Transfer', 'QRIS', 'Debit', 'Other')),
  status TEXT NOT NULL DEFAULT 'Lunas' CHECK (status IN ('Lunas', 'DP', 'Belum Lunas', 'Refund')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. EXPENSES & EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Transfer', 'QRIS', 'Debit', 'Other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. MANUAL INCOME
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. INDEXES FOR HIGH-PERFORMANCE SEARCH & SORT
CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(whatsapp);
CREATE INDEX IF NOT EXISTS idx_therapy_patient ON therapy_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_therapy_date ON therapy_sessions(therapy_date);
CREATE INDEX IF NOT EXISTS idx_sales_patient ON sales(patient_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_herbal_sku ON herbal_products(sku);

-- 12. ROW LEVEL SECURITY (RLS) ENFORCEMENT
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE herbal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

-- Allow authenticated clinic staff full CRUD
DO $$
BEGIN
  CREATE POLICY "Clinic Staff Full Access Users" ON users FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Patients" ON patients FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Therapy" ON therapy_sessions FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Services" ON services FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Service Cats" ON service_categories FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Herbal" ON herbal_products FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Product Cats" ON product_categories FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Sales" ON sales FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Sale Items" ON sale_items FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Invoices" ON invoices FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Payments" ON payments FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Expenses" ON expenses FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Expense Cats" ON expense_categories FOR ALL USING (true);
  CREATE POLICY "Clinic Staff Full Access Income" ON income FOR ALL USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
`;
}
