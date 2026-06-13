import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { DbProduct, DbOrder, DbCombo, DbSettings } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type Section = 'dashboard' | 'products' | 'combos' | 'orders' | 'customers' | 'settings';

interface AdminDashboardProps {
  onLogout: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', processing: 'Procesando',
  delivered: 'Entregado', cancelled: 'Cancelado',
};
const STATUS_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  pending:    { backgroundColor: 'rgba(217,119,6,0.12)',  color: '#d97706' },
  paid:       { backgroundColor: 'rgba(16,185,129,0.12)', color: '#059669' },
  processing: { backgroundColor: 'rgba(59,130,246,0.12)', color: '#2563eb' },
  delivered:  { backgroundColor: 'rgba(2,44,34,0.12)',    color: '#003527' },
  cancelled:  { backgroundColor: 'rgba(186,26,26,0.12)',  color: '#ba1a1a' },
};

const inp: React.CSSProperties = {
  backgroundColor: '#f8f4e4', border: '1px solid #bfc9c3', color: '#1c1c13',
  borderRadius: '0.75rem', padding: '10px 14px', width: '100%', fontSize: '14px',
  outline: 'none', transition: 'border-color 0.2s',
};

// ── Export helpers ────────────────────────────────────────────────────────────
const exportOrdersPDF = (orders: DbOrder[]) => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text('AMA Store — Pedidos', 14, 22);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
  autoTable(doc, {
    startY: 36,
    head: [['#', 'Cliente', 'Teléfono', 'Total CUP', 'Método', 'Estado', 'Fecha']],
    body: orders.map(o => [
      o.order_number, o.customer_name, o.customer_phone,
      `$${Number(o.total).toLocaleString('es-CU')}`,
      o.payment_method === 'paypal' ? 'PayPal' : 'WhatsApp',
      STATUS_LABELS[o.status] || o.status,
      new Date(o.created_at).toLocaleDateString('es-ES'),
    ]),
    styles: { fontSize: 9 }, headStyles: { fillColor: [0, 53, 39] },
  });
  doc.save('pedidos-ama.pdf');
};

const exportOrdersXLSX = (orders: DbOrder[]) => {
  const ws = XLSX.utils.json_to_sheet(orders.map(o => ({
    'Número': o.order_number, 'Cliente': o.customer_name, 'Teléfono': o.customer_phone,
    'Dirección': o.delivery_address, 'Total CUP': o.total,
    'Método': o.payment_method, 'Estado': STATUS_LABELS[o.status] || o.status,
    'Fecha': new Date(o.created_at).toLocaleDateString('es-ES'),
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
  XLSX.writeFile(wb, 'pedidos-ama.xlsx');
};

const exportProductsPDF = (products: DbProduct[]) => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text('AMA Store — Productos', 14, 22);
  autoTable(doc, {
    startY: 30,
    head: [['Nombre', 'Categoría', 'Precio CUP', 'Stock', 'Activo']],
    body: products.map(p => [p.name, p.category, `$${p.price}`, p.stock, p.active ? 'Sí' : 'No']),
    styles: { fontSize: 9 }, headStyles: { fillColor: [0, 53, 39] },
  });
  doc.save('productos-ama.pdf');
};

const exportProductsXLSX = (products: DbProduct[]) => {
  const ws = XLSX.utils.json_to_sheet(products.map(p => ({
    Nombre: p.name, Descripción: p.description, Categoría: p.category,
    Precio: p.price, Stock: p.stock, Activo: p.active ? 'Sí' : 'No',
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'productos-ama.xlsx');
};

// ── Shared field components ───────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#404944' }}>{label}</label>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text' }: { value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inp}
    onFocus={e => (e.currentTarget.style.borderColor = '#003527')}
    onBlur={e => (e.currentTarget.style.borderColor = '#bfc9c3')} />
);

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button onClick={onChange} className="relative w-10 h-5 rounded-full transition-colors shrink-0"
    style={{ backgroundColor: checked ? '#003527' : '#bfc9c3' }}>
    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
      style={{ left: checked ? '22px' : '2px' }} />
  </button>
);

// ── Main component ────────────────────────────────────────────────────────────
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState<DbProduct[]>([]);
  const [combos, setCombos] = useState<DbCombo[]>([]);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ totalSales: 0, ordersToday: 0, activeProducts: 0, pendingOrders: 0 });

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<DbProduct> | null>(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Partial<DbCombo> | null>(null);

  const [orderFilter, setOrderFilter] = useState('Todos');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [settingsSaved, setSettingsSaved] = useState(false);

  // ── Auth + load ───────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { onLogout(); return; }
      loadAll();
    };
    check();
  }, [onLogout]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: prods }, { data: combosData }, { data: ordersData }, { data: settingsData }] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('combos').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*'),
      ]);
      setProducts(prods || []);
      setCombos(combosData || []);
      setOrders(ordersData || []);
      const s: Record<string, string> = {};
      (settingsData || []).forEach((row: DbSettings) => { s[row.key] = row.value; });
      setSettingsForm(s);
      const today = new Date().toDateString();
      setStats({
        totalSales: (ordersData || []).filter(o => o.status !== 'cancelled').reduce((a, o) => a + Number(o.total), 0),
        ordersToday: (ordersData || []).filter(o => new Date(o.created_at).toDateString() === today).length,
        activeProducts: (prods || []).filter(p => p.active).length,
        pendingOrders: (ordersData || []).filter(o => o.status === 'pending').length,
      });
    } finally { setLoading(false); }
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); onLogout(); };

  // ── Product CRUD ──────────────────────────────────────────
  const saveProduct = async () => {
    if (!editingProduct?.name) return;
    const payload = {
      name: editingProduct.name, description: editingProduct.description || '',
      price: Number(editingProduct.price || 0), category: editingProduct.category || 'Mercado',
      image_url: editingProduct.image_url || '', stock: Number(editingProduct.stock || 0),
      active: editingProduct.active ?? true, badge: editingProduct.badge || null,
    };
    if (editingProduct.id) await supabase.from('products').update(payload).eq('id', editingProduct.id);
    else await supabase.from('products').insert(payload);
    setShowProductModal(false); setEditingProduct(null); loadAll();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await supabase.from('products').delete().eq('id', id); loadAll();
  };

  const toggleProductActive = async (p: DbProduct) => {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id); loadAll();
  };

  // ── Combo CRUD ────────────────────────────────────────────
  const saveCombo = async () => {
    if (!editingCombo?.name) return;
    const payload = {
      name: editingCombo.name, description: editingCombo.description || '',
      price: Number(editingCombo.price || 0),
      original_price: editingCombo.original_price ? Number(editingCombo.original_price) : null,
      image_url: editingCombo.image_url || '', active: editingCombo.active ?? true,
    };
    if (editingCombo.id) await supabase.from('combos').update(payload).eq('id', editingCombo.id);
    else await supabase.from('combos').insert(payload);
    setShowComboModal(false); setEditingCombo(null); loadAll();
  };

  const deleteCombo = async (id: string) => {
    if (!confirm('¿Eliminar este combo?')) return;
    await supabase.from('combos').delete().eq('id', id); loadAll();
  };

  // ── Order status ──────────────────────────────────────────
  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id); loadAll();
  };

  // ── Settings ──────────────────────────────────────────────
  const saveSettings = async () => {
    for (const [key, value] of Object.entries(settingsForm)) {
      await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); loadAll();
  };

  // ── Derived customers ─────────────────────────────────────
  const customers = Object.values(
    orders.reduce((acc, o) => {
      const key = o.customer_phone;
      if (!acc[key]) acc[key] = { name: o.customer_name, phone: o.customer_phone, count: 0, total: 0 };
      acc[key].count++;
      acc[key].total += Number(o.total);
      return acc;
    }, {} as Record<string, { name: string; phone: string; count: number; total: number }>)
  ).sort((a, b) => b.total - a.total);

  const filteredOrders = orderFilter === 'Todos'
    ? orders
    : orders.filter(o => STATUS_LABELS[o.status] === orderFilter);

  const navItems: { id: Section; icon: string; label: string }[] = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'products', icon: 'inventory_2', label: 'Productos' },
    { id: 'combos', icon: 'restaurant_menu', label: 'Combos' },
    { id: 'orders', icon: 'receipt_long', label: 'Pedidos' },
    { id: 'customers', icon: 'people', label: 'Clientes' },
    { id: 'settings', icon: 'settings', label: 'Configuración' },
  ];

  // ── Shared table header ───────────────────────────────────
  const TH = ({ children }: { children: React.ReactNode }) => (
    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#404944' }}>{children}</th>
  );
  const TR = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <tr className="border-t transition-colors" style={{ borderColor: '#f2eede', cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fdf9e9')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      onClick={onClick}>{children}</tr>
  );
  const TD = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <td className={`px-4 py-3 ${className}`}>{children}</td>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#fdf9e9', color: '#1c1c13' }}>

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ width: '240px', backgroundColor: '#003527' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <span className="text-2xl font-bold tracking-tighter text-white" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>AMA</span>
          <button className="md:hidden text-white" onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all"
              style={{
                backgroundColor: section === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: section === item.id ? 'white' : 'rgba(255,255,255,0.65)',
              }}
              onMouseEnter={e => { if (section !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (section !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'rgba(255,255,255,0.65)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(186,26,26,0.2)'; (e.currentTarget as HTMLElement).style.color = '#fca5a5'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; }}>
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col md:ml-[240px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-5 md:px-8 py-4 border-b"
          style={{ backgroundColor: 'rgba(253,249,233,0.95)', backdropFilter: 'blur(8px)', borderColor: '#e6e3d3' }}>
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)} style={{ color: '#003527' }}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-lg font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>
              {navItems.find(n => n.id === section)?.label}
            </h1>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#404944' }}>
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#003527', borderTopColor: 'transparent' }} />
              Cargando…
            </div>
          )}
        </header>

        <main className="flex-1 p-5 md:p-8">

          {/* ══ DASHBOARD ══════════════════════════════════ */}
          {section === 'dashboard' && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Ventas Totales', value: `CUP $${stats.totalSales.toLocaleString('es-CU')}`, icon: 'payments', color: '#003527' },
                  { label: 'Pedidos Hoy', value: stats.ordersToday, icon: 'today', color: '#9b4500' },
                  { label: 'Productos Activos', value: stats.activeProducts, icon: 'inventory_2', color: '#059669' },
                  { label: 'Pedidos Pendientes', value: stats.pendingOrders, icon: 'pending_actions', color: '#d97706' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-5 flex flex-col gap-3"
                    style={{ backgroundColor: 'white', border: '1px solid #e6e3d3', boxShadow: '0 2px 8px rgba(0,53,39,0.06)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#404944' }}>{s.label}</span>
                      <span className="material-symbols-outlined text-[22px]" style={{ color: s.color }}>{s.icon}</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: '#e6e3d3' }}>
                  <h2 className="font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Pedidos Recientes</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ backgroundColor: '#f8f4e4' }}><TH>#</TH><TH>Cliente</TH><TH>Total</TH><TH>Estado</TH><TH>Fecha</TH></tr></thead>
                    <tbody>
                      {orders.slice(0, 8).map(o => (
                        <TR key={o.id}>
                          <TD><span className="font-mono text-xs" style={{ color: '#003527' }}>{o.order_number}</span></TD>
                          <TD><span className="font-medium">{o.customer_name}</span></TD>
                          <TD><span className="font-semibold" style={{ color: '#9b4500' }}>CUP ${Number(o.total).toLocaleString('es-CU')}</span></TD>
                          <TD><span className="px-2 py-1 rounded-full text-xs font-semibold" style={STATUS_COLORS[o.status] || { backgroundColor: '#eee', color: '#333' }}>{STATUS_LABELS[o.status] || o.status}</span></TD>
                          <TD><span className="text-xs" style={{ color: '#404944' }}>{new Date(o.created_at).toLocaleDateString('es-ES')}</span></TD>
                        </TR>
                      ))}
                      {orders.length === 0 && !loading && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: '#404944' }}>No hay pedidos aún</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ PRODUCTS ═══════════════════════════════════ */}
          {section === 'products' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Gestión de Productos</h2>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => exportProductsPDF(products)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80" style={{ backgroundColor: '#fee2e2', color: '#ba1a1a', border: '1px solid #fca5a5' }}>
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>PDF
                  </button>
                  <button onClick={() => exportProductsXLSX(products)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                    <span className="material-symbols-outlined text-[16px]">table_view</span>Excel
                  </button>
                  <button onClick={() => { setEditingProduct({ active: true, category: 'Mercado' }); setShowProductModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                    style={{ backgroundColor: '#003527', color: 'white' }}>
                    <span className="material-symbols-outlined text-[16px]">add</span>Nuevo Producto
                  </button>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ backgroundColor: '#f8f4e4' }}><TH>Img</TH><TH>Nombre</TH><TH>Categoría</TH><TH>Precio</TH><TH>Stock</TH><TH>Activo</TH><TH>Acc.</TH></tr></thead>
                    <tbody>
                      {products.map(p => (
                        <TR key={p.id}>
                          <TD>{p.image_url ? <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#f2eede' }} />}</TD>
                          <TD><span className="font-medium max-w-[140px] block truncate">{p.name}</span></TD>
                          <TD><span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#f2eede', color: '#003527' }}>{p.category}</span></TD>
                          <TD><span className="font-semibold" style={{ color: '#9b4500' }}>CUP ${Number(p.price).toLocaleString('es-CU')}</span></TD>
                          <TD>{p.stock}</TD>
                          <TD><Toggle checked={p.active} onChange={() => toggleProductActive(p)} /></TD>
                          <TD>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="p-1.5 rounded-lg hover:bg-[#f2eede]" style={{ color: '#003527' }}><span className="material-symbols-outlined text-[16px]">edit</span></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: '#ba1a1a' }}><span className="material-symbols-outlined text-[16px]">delete</span></button>
                            </div>
                          </TD>
                        </TR>
                      ))}
                      {products.length === 0 && !loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: '#404944' }}>No hay productos</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ COMBOS ═════════════════════════════════════ */}
          {section === 'combos' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Gestión de Combos</h2>
                <button onClick={() => { setEditingCombo({ active: true }); setShowComboModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                  style={{ backgroundColor: '#003527', color: 'white' }}>
                  <span className="material-symbols-outlined text-[16px]">add</span>Nuevo Combo
                </button>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ backgroundColor: '#f8f4e4' }}><TH>Img</TH><TH>Nombre</TH><TH>Precio</TH><TH>P. Original</TH><TH>Estado</TH><TH>Acc.</TH></tr></thead>
                    <tbody>
                      {combos.map(c => (
                        <TR key={c.id}>
                          <TD>{c.image_url ? <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#f2eede' }} />}</TD>
                          <TD><span className="font-medium">{c.name}</span></TD>
                          <TD><span className="font-semibold" style={{ color: '#9b4500' }}>CUP ${Number(c.price).toLocaleString('es-CU')}</span></TD>
                          <TD><span style={{ color: '#707974' }}>{c.original_price ? `CUP $${Number(c.original_price).toLocaleString('es-CU')}` : '—'}</span></TD>
                          <TD><span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: c.active ? 'rgba(16,185,129,0.12)' : 'rgba(112,121,116,0.12)', color: c.active ? '#059669' : '#707974' }}>{c.active ? 'Activo' : 'Inactivo'}</span></TD>
                          <TD>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditingCombo(c); setShowComboModal(true); }} className="p-1.5 rounded-lg hover:bg-[#f2eede]" style={{ color: '#003527' }}><span className="material-symbols-outlined text-[16px]">edit</span></button>
                              <button onClick={() => deleteCombo(c.id)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: '#ba1a1a' }}><span className="material-symbols-outlined text-[16px]">delete</span></button>
                            </div>
                          </TD>
                        </TR>
                      ))}
                      {combos.length === 0 && !loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: '#404944' }}>No hay combos</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ ORDERS ═════════════════════════════════════ */}
          {section === 'orders' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Gestión de Pedidos</h2>
                <div className="flex gap-3">
                  <button onClick={() => exportOrdersPDF(filteredOrders)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80" style={{ backgroundColor: '#fee2e2', color: '#ba1a1a', border: '1px solid #fca5a5' }}>
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>PDF
                  </button>
                  <button onClick={() => exportOrdersXLSX(filteredOrders)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                    <span className="material-symbols-outlined text-[16px]">table_view</span>Excel
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Todos', ...Object.values(STATUS_LABELS)].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all"
                    style={{ backgroundColor: orderFilter === f ? '#003527' : '#f2eede', color: orderFilter === f ? 'white' : '#404944' }}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ backgroundColor: '#f8f4e4' }}><TH>#</TH><TH>Cliente</TH><TH>Teléfono</TH><TH>Total</TH><TH>Pago</TH><TH>Estado</TH><TH>Fecha</TH><TH children={undefined}></TH></tr></thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <React.Fragment key={o.id}>
                          <TR>
                            <TD><span className="font-mono text-xs" style={{ color: '#003527' }}>{o.order_number}</span></TD>
                            <TD><span className="font-medium max-w-[110px] block truncate">{o.customer_name}</span></TD>
                            <TD><span className="text-xs">{o.customer_phone}</span></TD>
                            <TD><span className="font-semibold" style={{ color: '#9b4500' }}>CUP ${Number(o.total).toLocaleString('es-CU')}</span></TD>
                            <TD>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold"
                                style={{ backgroundColor: o.payment_method === 'paypal' ? 'rgba(0,112,186,0.12)' : 'rgba(37,211,102,0.12)', color: o.payment_method === 'paypal' ? '#0070BA' : '#15803d' }}>
                                {o.payment_method === 'paypal' ? 'PayPal' : 'WhatsApp'}
                              </span>
                            </TD>
                            <TD>
                              <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                                className="rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer border-none"
                                style={{ ...(STATUS_COLORS[o.status] || { backgroundColor: '#eee', color: '#333' }), outline: 'none' }}>
                                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                            </TD>
                            <TD><span className="text-xs" style={{ color: '#404944' }}>{new Date(o.created_at).toLocaleDateString('es-ES')}</span></TD>
                            <TD>
                              <button onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                                className="p-1.5 rounded-lg hover:bg-[#f2eede]" style={{ color: '#003527' }}>
                                <span className="material-symbols-outlined text-[16px]">{expandedOrder === o.id ? 'expand_less' : 'expand_more'}</span>
                              </button>
                            </TD>
                          </TR>
                          {expandedOrder === o.id && (
                            <tr style={{ backgroundColor: '#fdf9e9' }}>
                              <td colSpan={8} className="px-6 py-4 border-t text-sm" style={{ borderColor: '#f2eede' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-semibold mb-1" style={{ color: '#003527' }}>Dirección:</p>
                                    <p style={{ color: '#404944' }}>{o.delivery_address}</p>
                                    {o.notes && <><p className="font-semibold mt-2 mb-1" style={{ color: '#003527' }}>Notas:</p><p style={{ color: '#404944' }}>{o.notes}</p></>}
                                    {o.gps_lat && (
                                      <a href={`https://maps.google.com/maps?q=${o.gps_lat},${o.gps_lng}`} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold" style={{ color: '#0070BA' }}>
                                        <span className="material-symbols-outlined text-[14px]">location_on</span>Ver en mapa
                                      </a>
                                    )}
                                  </div>
                                  <div>
                                    {o.paypal_order_id && <><p className="font-semibold mb-1" style={{ color: '#003527' }}>PayPal ID:</p><p className="font-mono text-xs" style={{ color: '#404944' }}>{o.paypal_order_id}</p></>}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      {filteredOrders.length === 0 && !loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: '#404944' }}>No hay pedidos</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ CUSTOMERS ══════════════════════════════════ */}
          {section === 'customers' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Clientes</h2>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ backgroundColor: '#f8f4e4' }}><TH>Nombre</TH><TH>Teléfono</TH><TH>Pedidos</TH><TH>Total Gastado</TH></tr></thead>
                    <tbody>
                      {customers.map((c, i) => (
                        <TR key={i}>
                          <TD><span className="font-medium">{c.name}</span></TD>
                          <TD><span className="text-xs">{c.phone}</span></TD>
                          <TD><span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#f2eede', color: '#003527' }}>{c.count}</span></TD>
                          <TD><span className="font-semibold" style={{ color: '#9b4500' }}>CUP ${c.total.toLocaleString('es-CU')}</span></TD>
                        </TR>
                      ))}
                      {customers.length === 0 && !loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: '#404944' }}>No hay clientes aún</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ SETTINGS ═══════════════════════════════════ */}
          {section === 'settings' && (
            <div className="flex flex-col gap-6 max-w-xl">
              <h2 className="text-xl font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Configuración General</h2>
              <div className="rounded-xl p-6 flex flex-col gap-5" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
                {[
                  { key: 'business_name', label: 'Nombre del Negocio' },
                  { key: 'whatsapp_number', label: 'WhatsApp del Negocio' },
                  { key: 'banner_text', label: 'Texto del Banner (ticker)' },
                  { key: 'delivery_note', label: 'Nota de Entrega' },
                ].map(({ key, label }) => (
                  <Field key={key} label={label}>
                    <TextInput value={settingsForm[key] || ''} onChange={v => setSettingsForm(prev => ({ ...prev, [key]: v }))} />
                  </Field>
                ))}
                <button onClick={saveSettings}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold uppercase tracking-widest hover:opacity-90 active:scale-95 mt-2"
                  style={{ backgroundColor: '#003527', color: 'white' }}>
                  <span className="material-symbols-outlined text-[18px]">save</span>Guardar Cambios
                </button>
                {settingsSaved && <p className="text-sm text-center font-semibold" style={{ color: '#059669' }}>✅ Configuración guardada</p>}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ══ PRODUCT MODAL ══════════════════════════════════════ */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => { setShowProductModal(false); setEditingProduct(null); }}>
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>
                {editingProduct.id ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} style={{ color: '#404944' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <Field label="Nombre *"><TextInput value={editingProduct.name || ''} onChange={v => setEditingProduct(p => ({ ...p, name: v }))} placeholder="Nombre del producto" /></Field>
            <Field label="Descripción">
              <textarea value={editingProduct.description || ''} onChange={e => setEditingProduct(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#003527')} onBlur={e => (e.currentTarget.style.borderColor = '#bfc9c3')} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio (CUP) *"><TextInput value={editingProduct.price || ''} onChange={v => setEditingProduct(p => ({ ...p, price: Number(v) }))} type="number" placeholder="0" /></Field>
              <Field label="Stock"><TextInput value={editingProduct.stock || ''} onChange={v => setEditingProduct(p => ({ ...p, stock: Number(v) }))} type="number" placeholder="0" /></Field>
            </div>
            <Field label="Categoría">
              <select value={editingProduct.category || 'Mercado'} onChange={e => setEditingProduct(p => ({ ...p, category: e.target.value as DbProduct['category'] }))} style={inp}>
                <option value="Mercado">Mercado</option>
                <option value="Combos">Combos</option>
                <option value="Electrodomésticos">Electrodomésticos</option>
              </select>
            </Field>
            <Field label="URL Imagen"><TextInput value={editingProduct.image_url || ''} onChange={v => setEditingProduct(p => ({ ...p, image_url: v }))} placeholder="https://..." /></Field>
            <Field label="Badge (ej: POPULAR)"><TextInput value={editingProduct.badge || ''} onChange={v => setEditingProduct(p => ({ ...p, badge: v }))} placeholder="Opcional" /></Field>
            <div className="flex items-center gap-3">
              <Toggle checked={editingProduct.active ?? true} onChange={() => setEditingProduct(p => ({ ...p, active: !p?.active }))} />
              <span className="text-sm" style={{ color: '#404944' }}>Producto activo</span>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="flex-1 py-3 rounded-xl text-sm font-semibold border hover:bg-[#f2eede]" style={{ borderColor: '#bfc9c3', color: '#404944' }}>Cancelar</button>
              <button onClick={saveProduct} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:opacity-90" style={{ backgroundColor: '#003527', color: 'white' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ COMBO MODAL ════════════════════════════════════════ */}
      {showComboModal && editingCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => { setShowComboModal(false); setEditingCombo(null); }}>
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>
                {editingCombo.id ? 'Editar Combo' : 'Nuevo Combo'}
              </h3>
              <button onClick={() => { setShowComboModal(false); setEditingCombo(null); }} style={{ color: '#404944' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <Field label="Nombre *"><TextInput value={editingCombo.name || ''} onChange={v => setEditingCombo(c => ({ ...c, name: v }))} placeholder="Nombre del combo" /></Field>
            <Field label="Descripción">
              <textarea value={editingCombo.description || ''} onChange={e => setEditingCombo(c => ({ ...c, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#003527')} onBlur={e => (e.currentTarget.style.borderColor = '#bfc9c3')} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio (CUP) *"><TextInput value={editingCombo.price || ''} onChange={v => setEditingCombo(c => ({ ...c, price: Number(v) }))} type="number" placeholder="0" /></Field>
              <Field label="Precio Original"><TextInput value={editingCombo.original_price || ''} onChange={v => setEditingCombo(c => ({ ...c, original_price: Number(v) }))} type="number" placeholder="Opcional" /></Field>
            </div>
            <Field label="URL Imagen"><TextInput value={editingCombo.image_url || ''} onChange={v => setEditingCombo(c => ({ ...c, image_url: v }))} placeholder="https://..." /></Field>
            <div className="flex items-center gap-3">
              <Toggle checked={editingCombo.active ?? true} onChange={() => setEditingCombo(c => ({ ...c, active: !c?.active }))} />
              <span className="text-sm" style={{ color: '#404944' }}>Combo activo</span>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowComboModal(false); setEditingCombo(null); }} className="flex-1 py-3 rounded-xl text-sm font-semibold border hover:bg-[#f2eede]" style={{ borderColor: '#bfc9c3', color: '#404944' }}>Cancelar</button>
              <button onClick={saveCombo} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:opacity-90" style={{ backgroundColor: '#003527', color: 'white' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
