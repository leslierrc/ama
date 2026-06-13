import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
  console.warn('⚠️  Supabase no configurado. Agrega VITE_SUPABASE_URL en tu .env');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DbProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Mercado' | 'Combos' | 'Electrodomésticos';
  image_url: string;
  stock: number;
  active: boolean;
  badge?: string | null;
  created_at: string;
}

export interface DbCombo {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number | null;
  image_url: string;
  active: boolean;
  created_at: string;
}

export interface DbComboItem {
  id: string;
  combo_id: string;
  product_id: string;
  quantity: number;
}

export interface DbOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_address: string;
  municipality?: string | null;
  province?: string | null;
  notes?: string | null;
  subtotal: number;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'delivered' | 'cancelled';
  payment_method: 'whatsapp' | 'paypal';
  paypal_order_id?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  created_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface DbSettings {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}
