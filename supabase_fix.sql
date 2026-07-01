-- ══════════════════════════════════════════════════════════════
--  AMA Store — Fix definitivo RLS
--  Pega esto en: Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- ── 1. Constraints (por si acaso no se ejecutaron antes) ───────
alter table orders drop constraint if exists orders_payment_method_check;
alter table orders drop constraint if exists orders_status_check;

alter table orders add constraint orders_payment_method_check
  check (payment_method in ('whatsapp', 'paypal', 'tropipay'));

alter table orders add constraint orders_status_check
  check (status in ('pending', 'awaiting_payment', 'paid', 'processing', 'delivered', 'cancelled'));

-- ── 2. Recrear políticas INSERT ────────────────────────────────
drop policy if exists "Public insert orders" on orders;
drop policy if exists "Public insert order_items" on order_items;

create policy "Public insert orders" on orders
  for insert with check (true);

create policy "Public insert order_items" on order_items
  for insert with check (true);

-- ── 3. El problema real: .select().single() después del INSERT
--    necesita permiso SELECT también para usuarios anónimos.
--    Supabase reporta esto como error 42501 (RLS violation).
drop policy if exists "Public select own order" on orders;
drop policy if exists "Public select order_items" on order_items;

-- Permitir SELECT de orders a usuarios anónimos
-- (necesario para que .insert().select().single() funcione)
create policy "Public select own order" on orders
  for select using (true);

create policy "Public select order_items" on order_items
  for select using (true);

-- ── Verificación final ─────────────────────────────────────────
select tablename, policyname, cmd
from pg_policies
where tablename in ('orders', 'order_items')
order by tablename, policyname;
