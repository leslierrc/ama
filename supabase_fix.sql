-- ══════════════════════════════════════════════════════════════
--  AMA Store — SQL de correcciones
--  Ejecuta esto en: Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- ── 1. Permitir 'tropipay' como método de pago ─────────────────
alter table orders
  drop constraint if exists orders_payment_method_check;

alter table orders
  add constraint orders_payment_method_check
  check (payment_method in ('whatsapp', 'paypal', 'tropipay'));

-- ── 2. Permitir 'awaiting_payment' como estado ─────────────────
alter table orders
  drop constraint if exists orders_status_check;

alter table orders
  add constraint orders_status_check
  check (status in ('pending', 'awaiting_payment', 'paid', 'processing', 'delivered', 'cancelled'));

-- ── 3. Confirmar que combo_items tiene lectura pública ──────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'combo_items'
    and policyname = 'Public read combo_items'
  ) then
    create policy "Public read combo_items"
      on combo_items for select using (true);
  end if;
end $$;

-- ── 4. Diagnóstico: combos y cuántos productos tienen ──────────
select
  c.id        as combo_id,
  c.name      as combo_name,
  c.price,
  c.active,
  count(ci.id) as total_productos
from combos c
left join combo_items ci on ci.combo_id = c.id
group by c.id, c.name, c.price, c.active
order by c.created_at desc;
