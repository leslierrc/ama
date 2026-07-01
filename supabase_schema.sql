-- ══════════════════════════════════════════════════════════════
--  AMA Store — Supabase Schema
--  Ejecuta esto en: Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Products ───────────────────────────────────────────────────
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  category text not null check (category in ('Mercado','Combos','Electrodomésticos')),
  image_url text default '',
  stock integer not null default 0,
  active boolean not null default true,
  badge text default null,
  created_at timestamptz default now()
);

-- ── Combos ────────────────────────────────────────────────────
create table if not exists combos (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  original_price numeric(10,2) default null,
  image_url text default '',
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists combo_items (
  id uuid primary key default uuid_generate_v4(),
  combo_id uuid references combos(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity integer not null default 1
);

-- ── Orders ────────────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null default ('ORD-' || to_char(now(),'YYYYMMDD') || '-' || substr(uuid_generate_v4()::text,1,6)),
  customer_name text not null,
  customer_phone text not null,
  customer_email text default null,
  delivery_address text not null,
  municipality text default null,
  province text default null,
  notes text default null,
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','paid','processing','delivered','cancelled')),
  payment_method text not null default 'whatsapp' check (payment_method in ('whatsapp','paypal')),
  paypal_order_id text default null,
  gps_lat double precision default null,
  gps_lng double precision default null,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null default 0,
  total_price numeric(10,2) not null default 0
);

-- ── Settings ──────────────────────────────────────────────────
create table if not exists settings (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  value text not null default '',
  updated_at timestamptz default now()
);

-- Default settings
insert into settings (key, value) values
  ('whatsapp_number', '5351365501'),
  ('business_name', 'AMA Store'),
  ('banner_text', 'Domicilios rápidos en menos de 24 horas 🏎️'),
  ('delivery_note', 'Entrega en menos de 24 horas en La Habana')
on conflict (key) do nothing;

-- ── RLS Policies ──────────────────────────────────────────────
alter table products enable row level security;
alter table combos enable row level security;
alter table combo_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table settings enable row level security;

-- Public read for products/combos/settings
create policy "Public read products" on products for select using (true);
create policy "Public read combos" on combos for select using (true);
create policy "Public read combo_items" on combo_items for select using (true);
create policy "Public read settings" on settings for select using (true);

-- Public insert for orders (customers placing orders)
create policy "Public insert orders" on orders for insert with check (true);
create policy "Public insert order_items" on order_items for insert with check (true);

-- Admin full access (authenticated users)
create policy "Admin all products" on products for all using (auth.role() = 'authenticated');
create policy "Admin all combos" on combos for all using (auth.role() = 'authenticated');
create policy "Admin all combo_items" on combo_items for all using (auth.role() = 'authenticated');
create policy "Admin all orders" on orders for all using (auth.role() = 'authenticated');
create policy "Admin all order_items" on order_items for all using (auth.role() = 'authenticated');
create policy "Admin all settings" on settings for all using (auth.role() = 'authenticated');

-- ── Sample data ───────────────────────────────────────────────
insert into products (name, description, price, category, image_url, stock, badge) values
  ('Aceite de Girasol 1L', 'Prensado en frío, de primera calidad.', 750, 'Mercado', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600', 50, null),
  ('Arroz Super Premium 5kg', 'Grano largo seleccionado, cosecha artesanal.', 950, 'Mercado', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600', 30, 'POPULAR'),
  ('Café Cubita Molido 250g', 'Tostado oscuro, sabor intenso y aromático.', 800, 'Mercado', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600', 40, null),
  ('Leche en Polvo 1kg', 'Entera, alta calidad nutricional.', 1800, 'Mercado', 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=600', 25, null),
  ('Split 1 Ton Inverter', 'Tecnología inverter, bajo consumo energético.', 45000, 'Electrodomésticos', 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600', 10, 'PREMIUM'),
  ('Freidora de Aire 5.5L', 'Cocina más sano con menos aceite.', 14000, 'Electrodomésticos', 'https://images.unsplash.com/photo-1648169668764-0e29a2a75b28?w=600', 15, null)
on conflict do nothing;
