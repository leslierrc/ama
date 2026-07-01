-- ══════════════════════════════════════════════════════════════
--  AMA Store — SQL de correcciones
--  Ejecuta esto en: Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. Arreglar el check constraint de payment_method en orders
--    (agrega 'tropipay' como método válido)
-- ─────────────────────────────────────────────────────────────
alter table orders
  drop constraint if exists orders_payment_method_check;

alter table orders
  add constraint orders_payment_method_check
  check (payment_method in ('whatsapp', 'paypal', 'tropipay'));

-- ─────────────────────────────────────────────────────────────
-- 2. Arreglar el check constraint de status en orders
--    (agrega 'awaiting_payment' como estado válido para TropiPay)
-- ─────────────────────────────────────────────────────────────
alter table orders
  drop constraint if exists orders_status_check;

alter table orders
  add constraint orders_status_check
  check (status in ('pending', 'awaiting_payment', 'paid', 'processing', 'delivered', 'cancelled'));

-- ─────────────────────────────────────────────────────────────
-- 3. Verificar que combo_items tenga lectura pública
--    (ejecutar aunque ya exista — es idempotente)
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- 4. Ejemplo: cómo insertar productos en un combo existente
--    INSTRUCCIONES:
--    a) Ve a Supabase → Table Editor → combos → copia el ID del combo
--    b) Ve a Table Editor → products → copia los IDs de los productos
--    c) Reemplaza los UUIDs de abajo y ejecuta
--
--    Si prefieres hacerlo desde el panel Admin:
--    → Combos → Editar (ícono lápiz) → agrega productos → Guardar
-- ─────────────────────────────────────────────────────────────

-- EJEMPLO (reemplaza los UUIDs con los reales de tu BD):
-- 
-- insert into combo_items (combo_id, product_id, quantity) values
--   ('UUID-DEL-COMBO-AQUI', 'UUID-PRODUCTO-1', 2),
--   ('UUID-DEL-COMBO-AQUI', 'UUID-PRODUCTO-2', 1),
--   ('UUID-DEL-COMBO-AQUI', 'UUID-PRODUCTO-3', 3)
-- on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- 5. Ver los combos y sus productos actuales (diagnóstico)
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- 6. Ver en detalle qué productos tiene cada combo
-- ─────────────────────────────────────────────────────────────
select
  c.name  as combo,
  p.name  as producto,
  ci.quantity
from combo_items ci
join combos  c on c.id = ci.combo_id
join products p on p.id = ci.product_id
order by c.name, p.name;
