-- ══════════════════════════════════════════════════════════════
--  AMA Store — Fix completo
--  Pega TODO esto en: Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- ── 1. Arreglar check constraint payment_method ────────────────
-- Agrega 'tropipay' como valor válido
alter table orders
  drop constraint if exists orders_payment_method_check;

alter table orders
  add constraint orders_payment_method_check
  check (payment_method in ('whatsapp', 'paypal', 'tropipay'));

-- ── 2. Arreglar check constraint status ───────────────────────
-- Agrega 'awaiting_payment' para pagos TropiPay pendientes
alter table orders
  drop constraint if exists orders_status_check;

alter table orders
  add constraint orders_status_check
  check (status in ('pending', 'awaiting_payment', 'paid', 'processing', 'delivered', 'cancelled'));

-- ── 3. Garantizar que las políticas RLS permiten insert público ─
-- Primero eliminar si existen (para evitar conflictos)
drop policy if exists "Public insert orders" on orders;
drop policy if exists "Public insert order_items" on order_items;

-- Recrear con check explícito
create policy "Public insert orders"
  on orders for insert
  with check (true);

create policy "Public insert order_items"
  on order_items for insert
  with check (true);

-- ── 4. Confirmar lectura pública de combo_items ────────────────
drop policy if exists "Public read combo_items" on combo_items;

create policy "Public read combo_items"
  on combo_items for select
  using (true);

-- ── 5. Verificación final — debe mostrar las políticas activas ─
select
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where tablename in ('orders', 'order_items', 'combo_items')
order by tablename, policyname;
