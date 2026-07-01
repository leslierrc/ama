-- ══════════════════════════════════════════════════════════════
--  AMA Store — Fix urgente
--  Pega esto en: Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- ── Paso 1: Eliminar los check constraints restrictivos ────────
alter table orders drop constraint if exists orders_payment_method_check;
alter table orders drop constraint if exists orders_status_check;

-- ── Paso 2: Recrearlos con los valores correctos ───────────────
alter table orders add constraint orders_payment_method_check
  check (payment_method in ('whatsapp', 'paypal', 'tropipay'));

alter table orders add constraint orders_status_check
  check (status in ('pending', 'awaiting_payment', 'paid', 'processing', 'delivered', 'cancelled'));

-- ── Paso 3: Asegurar que la política RLS permite insert público ─
drop policy if exists "Public insert orders" on orders;
drop policy if exists "Public insert order_items" on order_items;

create policy "Public insert orders" on orders
  for insert with check (true);

create policy "Public insert order_items" on order_items
  for insert with check (true);

-- ── Verificación: muestra las políticas activas ─────────────────
select tablename, policyname, cmd
from pg_policies
where tablename in ('orders', 'order_items')
order by tablename, policyname;
