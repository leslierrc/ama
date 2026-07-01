import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { DbProduct, DbOrder, DbCombo, DbSettings, DbComboItem } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type Section = 'dashboard' | 'products' | 'combos' | 'orders' | 'customers' | 'settings';
interface AdminDashboardProps { onLogout: () => void; }

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', processing: 'Procesando',
  delivered: 'Entregado', cancelled: 'Cancelado',
};
const STATUS_COLORS: Record<string, React.CSSProperties> = {
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

// ── Helper components (outside to avoid TS2741) ───────────────────────────────
const TH: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#404944' }}>{children}</th>
);
const TD: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`hidden md:table-cell px-4 py-3 ${className}`}>{children}</td>
);
const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button onClick={onChange} className="relative w-10 h-5 rounded-full transition-colors shrink-0"
    style={{ backgroundColor: checked ? '#003527' : '#bfc9c3' }}>
    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
      style={{ left: checked ? '22px' : '2px' }} />
  </button>
);
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#404944' }}>{label}</label>
    {children}
  </div>
);
const TextInput: React.FC<{ value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string }> = ({ value, onChange, placeholder, type = 'text' }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inp}
    onFocus={e => (e.currentTarget.style.borderColor = '#003527')}
    onBlur={e => (e.currentTarget.style.borderColor = '#bfc9c3')} />
);
const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className="px-2 py-1 rounded-full text-xs font-semibold" style={STATUS_COLORS[status] || {}}>
    {STATUS_LABELS[status] || status}
  </span>
);

// ── Image uploader ────────────────────────────────────────────────────────────
const ImageUploader: React.FC<{
  currentUrl: string;
  onUploaded: (url: string) => void;
  folder?: string;
}> = ({ currentUrl, onUploaded, folder = 'products' }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Solo se aceptan imágenes (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar 5MB.');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${folder}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          alert('El bucket "product-images" no existe en Supabase Storage.\n\nVe a Supabase → Storage → New bucket → nombre: "product-images" → Public.');
        } else if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
          alert('Sin permisos para subir. Ejecuta el archivo supabase_storage.sql en el SQL Editor de Supabase.');
        } else {
          alert(`Error al subir: ${uploadError.message}`);
        }
        return;
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setPreview(data.publicUrl);
      onUploaded(data.publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error inesperado al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Preview */}
      <div
        className="relative w-full h-40 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group"
        style={{ backgroundColor: '#f2eede', border: '2px dashed #bfc9c3' }}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[32px]">photo_camera</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2" style={{ color: '#bfc9c3' }}>
            <span className="material-symbols-outlined text-[40px]">add_photo_alternate</span>
            <span className="text-xs font-semibold uppercase tracking-widest">Subir imagen</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#003527', borderTopColor: 'transparent' }} />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <p className="text-xs" style={{ color: '#707974' }}>
        Click para subir · JPG, PNG, WebP · máx. 5MB
      </p>
      {/* Or paste URL */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px" style={{ backgroundColor: '#e6e3d3' }} />
        <span className="text-xs" style={{ color: '#bfc9c3' }}>o pega URL</span>
        <div className="flex-1 h-px" style={{ backgroundColor: '#e6e3d3' }} />
      </div>
      <input type="url" value={currentUrl} placeholder="https://..." style={inp}
        onChange={e => { setPreview(e.target.value); onUploaded(e.target.value); }}
        onFocus={e => (e.currentTarget.style.borderColor = '#003527')}
        onBlur={e => (e.currentTarget.style.borderColor = '#bfc9c3')} />
    </div>
  );
};

// ── Exports ───────────────────────────────────────────────────────────────────
const exportOrdersPDF = (orders: DbOrder[]) => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text('AMA Store — Pedidos', 14, 22);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
  autoTable(doc, {
    startY: 36,
    head: [['#', 'Cliente', 'Teléfono', 'Total', 'Método', 'Estado', 'Fecha']],
    body: orders.map(o => [o.order_number, o.customer_name, o.customer_phone, `$${Number(o.total).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}`, o.payment_method === 'paypal' ? 'PayPal' : 'WhatsApp', STATUS_LABELS[o.status] || o.status, new Date(o.created_at).toLocaleDateString('es-ES')]),
    styles: { fontSize: 9 }, headStyles: { fillColor: [0, 53, 39] },
  });
  doc.save('pedidos-ama.pdf');
};
const exportOrdersXLSX = (orders: DbOrder[]) => {
  const ws = XLSX.utils.json_to_sheet(orders.map(o => ({ Número: o.order_number, Cliente: o.customer_name, Teléfono: o.customer_phone, Dirección: o.delivery_address, 'Total USD': o.total, Método: o.payment_method, Estado: STATUS_LABELS[o.status] || o.status, Fecha: new Date(o.created_at).toLocaleDateString('es-ES') })));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Pedidos'); XLSX.writeFile(wb, 'pedidos-ama.xlsx');
};
const exportProductsPDF = (products: DbProduct[]) => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('AMA Store — Productos', 14, 22);
  autoTable(doc, { startY: 30, head: [['Nombre', 'Categoría', 'Precio', 'Stock', 'Activo']], body: products.map(p => [p.name, p.category, `$${p.price}`, p.stock, p.active ? 'Sí' : 'No']), styles: { fontSize: 9 }, headStyles: { fillColor: [0, 53, 39] } });
  doc.save('productos-ama.pdf');
};
const exportProductsXLSX = (products: DbProduct[]) => {
  const ws = XLSX.utils.json_to_sheet(products.map(p => ({ Nombre: p.name, Categoría: p.category, Precio: p.price, Stock: p.stock, Activo: p.active ? 'Sí' : 'No' })));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Productos'); XLSX.writeFile(wb, 'productos-ama.xlsx');
};

// ── Combo items editor ────────────────────────────────────────────────────────
interface ComboItemEdit { product_id: string; quantity: number; name: string; price: number; }

const ComboItemsEditor: React.FC<{
  items: ComboItemEdit[];
  products: DbProduct[];
  onChange: (items: ComboItemEdit[]) => void;
}> = ({ items, products, onChange }) => {
  const [selectedId, setSelectedId] = useState('');

  const addItem = () => {
    if (!selectedId) return;
    const prod = products.find(p => p.id === selectedId);
    if (!prod) return;
    const exists = items.find(i => i.product_id === selectedId);
    if (exists) {
      onChange(items.map(i => i.product_id === selectedId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      onChange([...items, { product_id: prod.id, quantity: 1, name: prod.name, price: prod.price }]);
    }
    setSelectedId('');
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) onChange(items.filter(i => i.product_id !== id));
    else onChange(items.map(i => i.product_id === id ? { ...i, quantity: qty } : i));
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Add product selector */}
      <div className="flex gap-2">
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
          style={{ ...inp, flex: 1 }}>
          <option value="">Seleccionar producto…</option>
          {products.filter(p => p.active).map(p => (
            <option key={p.id} value={p.id}>{p.name} — ${Number(p.price).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</option>
          ))}
        </select>
        <button onClick={addItem} disabled={!selectedId}
          className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 hover:opacity-90"
          style={{ backgroundColor: '#003527', color: 'white', whiteSpace: 'nowrap' }}>
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e6e3d3' }}>
          {items.map(item => (
            <div key={item.product_id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
              style={{ borderColor: '#f2eede', backgroundColor: 'white' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#1c1c13' }}>{item.name}</p>
                <p className="text-xs" style={{ color: '#9b4500' }}>${(item.price * item.quantity).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => updateQty(item.product_id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ border: '1px solid #bfc9c3', color: '#1c1c13' }}>
                  <span className="material-symbols-outlined text-[14px]">remove</span>
                </button>
                <span className="w-5 text-center text-sm font-bold" style={{ color: '#1c1c13' }}>{item.quantity}</span>
                <button onClick={() => updateQty(item.product_id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ border: '1px solid #bfc9c3', color: '#1c1c13' }}>
                  <span className="material-symbols-outlined text-[14px]">add</span>
                </button>
                <button onClick={() => updateQty(item.product_id, 0)} className="w-7 h-7 flex items-center justify-center" style={{ color: '#ba1a1a' }}>
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center px-4 py-3" style={{ backgroundColor: '#f8f4e4' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#404944' }}>Total productos</span>
            <span className="font-bold" style={{ color: '#9b4500' }}>${total.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</span>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-center py-4" style={{ color: '#bfc9c3' }}>
          Aún no hay productos en este combo
        </p>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Main AdminDashboard
// ══════════════════════════════════════════════════════════════════════════════
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState<DbProduct[]>([]);
  const [combos, setCombos] = useState<DbCombo[]>([]);
  const [comboItemsMap, setComboItemsMap] = useState<Record<string, { name: string; quantity: number }[]>>({});
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSales: 0, ordersToday: 0, activeProducts: 0, pendingOrders: 0 });

  // Product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<DbProduct> | null>(null);

  // Combo modal
  const [showComboModal, setShowComboModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Partial<DbCombo> | null>(null);
  const [comboItems, setComboItems] = useState<ComboItemEdit[]>([]);

  // Orders
  const [orderFilter, setOrderFilter] = useState('Todos');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Settings
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [settingsSaved, setSettingsSaved] = useState(false);

  // ── Load all data ──────────────────────────────────────────
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

      // Cargar combo_items por separado para evitar problemas de RLS con FK joins
      const { data: ciData } = await supabase
        .from('combo_items')
        .select('combo_id, quantity, product_id');

      if (ciData && ciData.length > 0 && prods) {
        const prodMap: Record<string, string> = {};
        prods.forEach((p: DbProduct) => { prodMap[p.id] = p.name; });

        const ciMap: Record<string, { name: string; quantity: number }[]> = {};
        ciData.forEach((ci: any) => {
          if (!ciMap[ci.combo_id]) ciMap[ci.combo_id] = [];
          ciMap[ci.combo_id].push({ name: prodMap[ci.product_id] || '—', quantity: ci.quantity });
        });
        setComboItemsMap(ciMap);
      } else {
        setComboItemsMap({});
      }

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

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { onLogout(); return; }
      loadAll();
    };
    check();
  }, [onLogout, loadAll]);

  const handleLogout = async () => { await supabase.auth.signOut(); onLogout(); };

  // ── Product CRUD ───────────────────────────────────────────
  const openProductModal = (p?: DbProduct) => {
    setEditingProduct(p ? { ...p } : { active: true, category: 'Mercado', stock: 0, price: 0, image_url: '' });
    setShowProductModal(true);
  };
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

  // ── Combo CRUD ─────────────────────────────────────────────
  const openComboModal = async (c?: DbCombo) => {
    setEditingCombo(c ? { ...c } : { active: true, price: 0, original_price: 0, image_url: '' });
    if (c) {
      // Cargar combo_items por separado para evitar problemas con FK joins
      const { data: ciData } = await supabase
        .from('combo_items')
        .select('product_id, quantity')
        .eq('combo_id', c.id);

      if (ciData && ciData.length > 0) {
        // Traer nombres de productos
        const productIds = ciData.map((ci: any) => ci.product_id);
        const { data: prodsData } = await supabase
          .from('products')
          .select('id, name, price')
          .in('id', productIds);

        const prodMap: Record<string, { name: string; price: number }> = {};
        (prodsData || []).forEach((p: any) => { prodMap[p.id] = { name: p.name, price: p.price }; });

        setComboItems(ciData.map((ci: any) => ({
          product_id: ci.product_id,
          quantity: ci.quantity,
          name: prodMap[ci.product_id]?.name || '—',
          price: prodMap[ci.product_id]?.price || 0,
        })));
      } else {
        setComboItems([]);
      }
    } else {
      setComboItems([]);
    }
    setShowComboModal(true);
  };

  const saveCombo = async () => {
    if (!editingCombo?.name) return;
    const payload = {
      name: editingCombo.name, description: editingCombo.description || '',
      price: Number(editingCombo.price || 0),
      original_price: editingCombo.original_price ? Number(editingCombo.original_price) : null,
      image_url: editingCombo.image_url || '', active: editingCombo.active ?? true,
    };
    let comboId = editingCombo.id;
    if (comboId) {
      await supabase.from('combos').update(payload).eq('id', comboId);
      // Delete old items and re-insert
      await supabase.from('combo_items').delete().eq('combo_id', comboId);
    } else {
      const { data } = await supabase.from('combos').insert(payload).select().single();
      comboId = data?.id;
    }
    // Insert combo items
    if (comboId && comboItems.length > 0) {
      await supabase.from('combo_items').insert(
        comboItems.map(i => ({ combo_id: comboId, product_id: i.product_id, quantity: i.quantity }))
      );
    }
    setShowComboModal(false); setEditingCombo(null); setComboItems([]); loadAll();
  };

  const deleteCombo = async (id: string) => {
    if (!confirm('¿Eliminar este combo?')) return;
    await supabase.from('combo_items').delete().eq('combo_id', id);
    await supabase.from('combos').delete().eq('id', id);
    loadAll();
  };

  // ── Orders ─────────────────────────────────────────────────
  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id); loadAll();
  };

  // ── Settings ───────────────────────────────────────────────
  const saveSettings = async () => {
    for (const [key, value] of Object.entries(settingsForm)) {
      await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); loadAll();
  };

  const customers = Object.values(
    orders.reduce((acc, o) => {
      const key = o.customer_phone;
      if (!acc[key]) acc[key] = { name: o.customer_name, phone: o.customer_phone, count: 0, total: 0 };
      acc[key].count++; acc[key].total += Number(o.total);
      return acc;
    }, {} as Record<string, { name: string; phone: string; count: number; total: number }>)
  ).sort((a, b) => b.total - a.total);

  const filteredOrders = orderFilter === 'Todos' ? orders : orders.filter(o => STATUS_LABELS[o.status] === orderFilter);

  const navItems: { id: Section; icon: string; label: string }[] = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'products', icon: 'inventory_2', label: 'Productos' },
    { id: 'combos', icon: 'restaurant_menu', label: 'Combos' },
    { id: 'orders', icon: 'receipt_long', label: 'Pedidos' },
    { id: 'customers', icon: 'people', label: 'Clientes' },
    { id: 'settings', icon: 'settings', label: 'Config.' },
  ];

  // ── Shared card style for mobile ──────────────────────────
  const cardStyle: React.CSSProperties = { backgroundColor: 'white', border: '1px solid #e6e3d3', borderRadius: '0.75rem', padding: '16px', boxShadow: '0 2px 8px rgba(0,53,39,0.05)' };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#fdf9e9', color: '#1c1c13' }}>

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ width: '220px', backgroundColor: '#003527' }}>
        <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <span className="text-xl font-bold tracking-tighter text-white" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>AMA Admin</span>
          <button className="md:hidden text-white p-1" onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all w-full"
              style={{ backgroundColor: section === item.id ? 'rgba(255,255,255,0.15)' : 'transparent', color: section === item.id ? 'white' : 'rgba(255,255,255,0.65)' }}
              onMouseEnter={e => { if (section !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (section !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'rgba(255,255,255,0.65)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(186,26,26,0.2)'; (e.currentTarget as HTMLElement).style.color = '#fca5a5'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; }}>
            <span className="material-symbols-outlined text-[20px]">logout</span>Cerrar Sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col md:ml-[220px] min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 py-4 border-b"
          style={{ backgroundColor: 'rgba(253,249,233,0.95)', backdropFilter: 'blur(8px)', borderColor: '#e6e3d3' }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1" onClick={() => setSidebarOpen(true)} style={{ color: '#003527' }}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-semibold text-base md:text-lg" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>
              {navItems.find(n => n.id === section)?.label}
            </h1>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#404944' }}>
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#003527', borderTopColor: 'transparent' }} />
              <span className="hidden sm:inline">Cargando…</span>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">

          {/* ══ DASHBOARD ══ */}
          {section === 'dashboard' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                  { label: 'Ventas Totales', value: `$${stats.totalSales.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}`, icon: 'payments', color: '#003527' },
                  { label: 'Pedidos Hoy', value: stats.ordersToday, icon: 'today', color: '#9b4500' },
                  { label: 'Productos Activos', value: stats.activeProducts, icon: 'inventory_2', color: '#059669' },
                  { label: 'Pendientes', value: stats.pendingOrders, icon: 'pending_actions', color: '#d97706' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 flex flex-col gap-2" style={cardStyle}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest" style={{ color: '#404944' }}>{s.label}</span>
                      <span className="material-symbols-outlined text-[20px] md:text-[22px]" style={{ color: s.color }}>{s.icon}</span>
                    </div>
                    <p className="text-lg md:text-2xl font-bold truncate" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent orders — cards on mobile */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
                <div className="px-4 md:px-6 py-4 border-b" style={{ borderColor: '#e6e3d3' }}>
                  <h2 className="font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Pedidos Recientes</h2>
                </div>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ backgroundColor: '#f8f4e4' }}>
                      <TH>#</TH><TH>Cliente</TH><TH>Total</TH><TH>Estado</TH><TH>Fecha</TH>
                    </tr></thead>
                    <tbody>
                      {orders.slice(0, 8).map(o => (
                        <tr key={o.id} className="border-t" style={{ borderColor: '#f2eede' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fdf9e9')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                          <TD><span className="font-mono text-xs" style={{ color: '#003527' }}>{o.order_number}</span></TD>
                          <TD><span className="font-medium">{o.customer_name}</span></TD>
                          <TD><span className="font-semibold" style={{ color: '#9b4500' }}>${Number(o.total).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</span></TD>
                          <TD><StatusBadge status={o.status} /></TD>
                          <TD><span className="text-xs" style={{ color: '#404944' }}>{new Date(o.created_at).toLocaleDateString('es-ES')}</span></TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden flex flex-col divide-y" style={{ borderColor: '#f2eede' }}>
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: '#003527' }}>{o.customer_name}</p>
                        <p className="text-xs font-mono" style={{ color: '#9b4500' }}>{o.order_number}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-bold text-sm" style={{ color: '#9b4500' }}>${Number(o.total).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  ))}
                </div>
                {orders.length === 0 && !loading && <p className="px-6 py-8 text-center text-sm" style={{ color: '#404944' }}>No hay pedidos aún</p>}
              </div>
            </div>
          )}

          {/* ══ PRODUCTS ══ */}
          {section === 'products' && (
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg md:text-xl font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Productos</h2>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => exportProductsPDF(products)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-80" style={{ backgroundColor: '#fee2e2', color: '#ba1a1a', border: '1px solid #fca5a5' }}>
                    <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>PDF
                  </button>
                  <button onClick={() => exportProductsXLSX(products)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-80" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                    <span className="material-symbols-outlined text-[14px]">table_view</span>Excel
                  </button>
                  <button onClick={() => openProductModal()}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                    style={{ backgroundColor: '#003527', color: 'white' }}>
                    <span className="material-symbols-outlined text-[16px]">add</span>Nuevo
                  </button>
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block rounded-xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ backgroundColor: '#f8f4e4' }}>
                      <TH>Img</TH><TH>Nombre</TH><TH>Categoría</TH><TH>Precio</TH><TH>Stock</TH><TH>Activo</TH><TH>Acc.</TH>
                    </tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-t" style={{ borderColor: '#f2eede' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fdf9e9')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                          <TD>{p.image_url ? <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#f2eede' }} />}</TD>
                          <TD><span className="font-medium max-w-[140px] block truncate">{p.name}</span></TD>
                          <TD><span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#f2eede', color: '#003527' }}>{p.category}</span></TD>
                          <TD><span className="font-semibold" style={{ color: '#9b4500' }}>${Number(p.price).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</span></TD>
                          <TD>{p.stock}</TD>
                          <TD><Toggle checked={p.active} onChange={() => toggleProductActive(p)} /></TD>
                          <TD>
                            <div className="flex gap-1">
                              <button onClick={() => openProductModal(p)} className="p-1.5 rounded-lg hover:bg-[#f2eede]" style={{ color: '#003527' }}><span className="material-symbols-outlined text-[16px]">edit</span></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: '#ba1a1a' }}><span className="material-symbols-outlined text-[16px]">delete</span></button>
                            </div>
                          </TD>
                        </tr>
                      ))}
                      {products.length === 0 && !loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: '#404944' }}>Sin productos. Crea uno.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden flex flex-col gap-3">
                {products.length === 0 && !loading && (
                  <p className="text-center py-8 text-sm" style={{ color: '#404944' }}>Sin productos. Toca "Nuevo" para crear uno.</p>
                )}
                {products.map(p => (
                  <div key={p.id} style={cardStyle} className="flex items-center gap-3">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      : <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f2eede' }}><span className="material-symbols-outlined text-[24px]" style={{ color: '#bfc9c3' }}>image</span></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: '#003527' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: '#9b4500' }}>${Number(p.price).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})} · Stock: {p.stock}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: '#f2eede', color: '#003527' }}>{p.category}</span>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Toggle checked={p.active} onChange={() => toggleProductActive(p)} />
                      <div className="flex gap-1">
                        <button onClick={() => openProductModal(p)} className="p-1.5 rounded-lg" style={{ color: '#003527', backgroundColor: '#f2eede' }}><span className="material-symbols-outlined text-[16px]">edit</span></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg" style={{ color: '#ba1a1a', backgroundColor: '#fee2e2' }}><span className="material-symbols-outlined text-[16px]">delete</span></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ COMBOS ══ */}
          {section === 'combos' && (
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg md:text-xl font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Combos</h2>
                <button onClick={() => openComboModal()}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                  style={{ backgroundColor: '#003527', color: 'white' }}>
                  <span className="material-symbols-outlined text-[16px]">add</span>Nuevo
                </button>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block rounded-xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
                <table className="w-full text-sm">
                  <thead><tr style={{ backgroundColor: '#f8f4e4' }}>
                    <TH>Img</TH><TH>Nombre</TH><TH>Precio</TH><TH>P. Original</TH><TH>Estado</TH><TH>Acc.</TH>
                  </tr></thead>
                  <tbody>
                    {combos.map(c => (
                      <tr key={c.id} className="border-t" style={{ borderColor: '#f2eede' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fdf9e9')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <TD>{c.image_url ? <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: '#f2eede' }} />}</TD>
                        <TD><span className="font-medium">{c.name}</span></TD>
                        <TD><span className="font-semibold" style={{ color: '#9b4500' }}>${Number(c.price).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</span></TD>
                        <TD><span style={{ color: '#707974' }}>{c.original_price ? `$${Number(c.original_price).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}` : '—'}</span></TD>
                        <TD><span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: c.active ? 'rgba(16,185,129,0.12)' : 'rgba(112,121,116,0.12)', color: c.active ? '#059669' : '#707974' }}>{c.active ? 'Activo' : 'Inactivo'}</span></TD>
                        <TD>
                          <div className="flex gap-1">
                            <button onClick={() => openComboModal(c)} className="p-1.5 rounded-lg hover:bg-[#f2eede]" style={{ color: '#003527' }}><span className="material-symbols-outlined text-[16px]">edit</span></button>
                            <button onClick={() => deleteCombo(c.id)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: '#ba1a1a' }}><span className="material-symbols-outlined text-[16px]">delete</span></button>
                          </div>
                        </TD>
                      </tr>
                    ))}
                    {combos.length === 0 && !loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: '#404944' }}>Sin combos</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden flex flex-col gap-3">
                {combos.length === 0 && !loading && <p className="text-center py-8 text-sm" style={{ color: '#404944' }}>Sin combos. Toca "Nuevo".</p>}
                {combos.map(c => (
                  <div key={c.id} style={cardStyle} className="flex items-center gap-3">
                    {c.image_url
                      ? <img src={c.image_url} alt={c.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      : <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f2eede' }}><span className="material-symbols-outlined text-[24px]" style={{ color: '#bfc9c3' }}>restaurant_menu</span></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: '#003527' }}>{c.name}</p>
                      <p className="text-xs font-semibold" style={{ color: '#9b4500' }}>${Number(c.price).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                      {c.original_price && <p className="text-xs line-through" style={{ color: '#707974' }}>${Number(c.original_price).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: c.active ? 'rgba(16,185,129,0.12)' : 'rgba(112,121,116,0.12)', color: c.active ? '#059669' : '#707974' }}>{c.active ? 'Activo' : 'Inactivo'}</span>
                      <div className="flex gap-1">
                        <button onClick={() => openComboModal(c)} className="p-1.5 rounded-lg" style={{ color: '#003527', backgroundColor: '#f2eede' }}><span className="material-symbols-outlined text-[16px]">edit</span></button>
                        <button onClick={() => deleteCombo(c.id)} className="p-1.5 rounded-lg" style={{ color: '#ba1a1a', backgroundColor: '#fee2e2' }}><span className="material-symbols-outlined text-[16px]">delete</span></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ ORDERS ══ */}
          {section === 'orders' && (
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg md:text-xl font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Pedidos</h2>
                <div className="flex gap-2">
                  <button onClick={() => exportOrdersPDF(filteredOrders)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-80" style={{ backgroundColor: '#fee2e2', color: '#ba1a1a', border: '1px solid #fca5a5' }}>
                    <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>PDF
                  </button>
                  <button onClick={() => exportOrdersXLSX(filteredOrders)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-80" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                    <span className="material-symbols-outlined text-[14px]">table_view</span>Excel
                  </button>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap gap-2">
                {['Todos', ...Object.values(STATUS_LABELS)].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all"
                    style={{ backgroundColor: orderFilter === f ? '#003527' : '#f2eede', color: orderFilter === f ? 'white' : '#404944' }}>
                    {f}
                  </button>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block rounded-xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ backgroundColor: '#f8f4e4' }}>
                      <TH>#</TH><TH>Cliente</TH><TH>Teléfono</TH><TH>Total</TH><TH>Pago</TH><TH>Estado</TH><TH>Fecha</TH><TH></TH>
                    </tr></thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <React.Fragment key={o.id}>
                          <tr className="border-t" style={{ borderColor: '#f2eede' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fdf9e9')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                            <TD><span className="font-mono text-xs" style={{ color: '#003527' }}>{o.order_number}</span></TD>
                            <TD><span className="font-medium max-w-[110px] block truncate">{o.customer_name}</span></TD>
                            <TD><span className="text-xs">{o.customer_phone}</span></TD>
                            <TD><span className="font-semibold" style={{ color: '#9b4500' }}>${Number(o.total).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</span></TD>
                            <TD><span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: o.payment_method === 'paypal' ? 'rgba(0,112,186,0.12)' : 'rgba(37,211,102,0.12)', color: o.payment_method === 'paypal' ? '#0070BA' : '#15803d' }}>{o.payment_method === 'paypal' ? 'PayPal' : 'WhatsApp'}</span></TD>
                            <TD>
                              <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                                className="rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer border-none"
                                style={{ ...(STATUS_COLORS[o.status] || {}), outline: 'none' }}>
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
                          </tr>
                          {expandedOrder === o.id && (
                            <tr style={{ backgroundColor: '#fdf9e9' }}>
                              <td colSpan={8} className="px-6 py-4 border-t text-sm" style={{ borderColor: '#f2eede' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-semibold mb-1" style={{ color: '#003527' }}>Dirección:</p>
                                    <p style={{ color: '#404944' }}>{o.delivery_address}</p>
                                    {o.notes && <><p className="font-semibold mt-2 mb-1" style={{ color: '#003527' }}>Notas:</p><p style={{ color: '#404944' }}>{o.notes}</p></>}
                                    {o.gps_lat && <a href={`https://maps.google.com/maps?q=${o.gps_lat},${o.gps_lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-semibold" style={{ color: '#0070BA' }}><span className="material-symbols-outlined text-[14px]">location_on</span>Ver en mapa</a>}
                                  </div>
                                  {o.paypal_order_id && <div><p className="font-semibold mb-1" style={{ color: '#003527' }}>PayPal ID:</p><p className="font-mono text-xs" style={{ color: '#404944' }}>{o.paypal_order_id}</p></div>}
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

              {/* Mobile cards */}
              <div className="md:hidden flex flex-col gap-3">
                {filteredOrders.length === 0 && !loading && <p className="text-center py-8 text-sm" style={{ color: '#404944' }}>No hay pedidos</p>}
                {filteredOrders.map(o => (
                  <div key={o.id} style={cardStyle}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#003527' }}>{o.customer_name}</p>
                        <p className="text-xs font-mono" style={{ color: '#9b4500' }}>{o.order_number}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#404944' }}>{o.customer_phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-sm" style={{ color: '#9b4500' }}>${Number(o.total).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: o.payment_method === 'paypal' ? 'rgba(0,112,186,0.12)' : 'rgba(37,211,102,0.12)', color: o.payment_method === 'paypal' ? '#0070BA' : '#15803d' }}>
                          {o.payment_method === 'paypal' ? 'PayPal' : 'WhatsApp'}
                        </span>
                        <span className="text-xs" style={{ color: '#707974' }}>{new Date(o.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                      <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer border"
                        style={{ ...(STATUS_COLORS[o.status] || {}), outline: 'none', borderColor: '#e6e3d3' }}>
                        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    {o.delivery_address && (
                      <p className="mt-2 text-xs truncate" style={{ color: '#707974' }}>
                        📍 {o.delivery_address}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ CUSTOMERS ══ */}
          {section === 'customers' && (
            <div className="flex flex-col gap-4 md:gap-6">
              <h2 className="text-lg md:text-xl font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Clientes</h2>
              {/* Desktop table */}
              <div className="hidden md:block rounded-xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
                <table className="w-full text-sm">
                  <thead><tr style={{ backgroundColor: '#f8f4e4' }}><TH>Nombre</TH><TH>Teléfono</TH><TH>Pedidos</TH><TH>Total Gastado</TH></tr></thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: '#f2eede' }}>
                        <TD><span className="font-medium">{c.name}</span></TD>
                        <TD><span className="text-xs">{c.phone}</span></TD>
                        <TD><span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#f2eede', color: '#003527' }}>{c.count}</span></TD>
                        <TD><span className="font-semibold" style={{ color: '#9b4500' }}>${c.total.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</span></TD>
                      </tr>
                    ))}
                    {customers.length === 0 && !loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: '#404944' }}>No hay clientes</td></tr>}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden flex flex-col gap-3">
                {customers.length === 0 && !loading && <p className="text-center py-8 text-sm" style={{ color: '#404944' }}>No hay clientes aún</p>}
                {customers.map((c, i) => (
                  <div key={i} style={cardStyle} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#003527' }}>{c.name}</p>
                      <p className="text-xs" style={{ color: '#404944' }}>{c.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: '#9b4500' }}>${c.total.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                      <p className="text-xs" style={{ color: '#707974' }}>{c.count} pedido{c.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ SETTINGS ══ */}
          {section === 'settings' && (
            <div className="flex flex-col gap-6 max-w-xl">
              <h2 className="text-lg md:text-xl font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>Configuración General</h2>
              <div className="rounded-xl p-5 md:p-6 flex flex-col gap-5" style={{ backgroundColor: 'white', border: '1px solid #e6e3d3' }}>
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
                {settingsSaved && <p className="text-sm text-center font-semibold" style={{ color: '#059669' }}>✅ Guardado correctamente</p>}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ══ PRODUCT MODAL ══ */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50"
          onClick={() => { setShowProductModal(false); setEditingProduct(null); }}>
          <div className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-5 md:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto"
            style={{ backgroundColor: 'white', boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between sticky top-0 bg-white pt-1 pb-2 -mx-1 px-1" style={{ zIndex: 1 }}>
              <h3 className="text-lg font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>
                {editingProduct.id ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="p-1" style={{ color: '#404944' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <Field label="Imagen del Producto">
              <ImageUploader
                currentUrl={editingProduct.image_url || ''}
                onUploaded={url => setEditingProduct(p => ({ ...p, image_url: url }))}
                folder="products"
              />
            </Field>

            <Field label="Nombre *">
              <TextInput value={editingProduct.name || ''} onChange={v => setEditingProduct(p => ({ ...p, name: v }))} placeholder="Nombre del producto" />
            </Field>

            <Field label="Descripción">
              <textarea value={editingProduct.description || ''} onChange={e => setEditingProduct(p => ({ ...p, description: e.target.value }))} rows={2}
                style={{ ...inp, resize: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#003527')}
                onBlur={e => (e.currentTarget.style.borderColor = '#bfc9c3')} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio (USD) *">
                <TextInput value={editingProduct.price || ''} onChange={v => setEditingProduct(p => ({ ...p, price: Number(v) }))} type="number" placeholder="0" />
              </Field>
              <Field label="Stock">
                <TextInput value={editingProduct.stock || ''} onChange={v => setEditingProduct(p => ({ ...p, stock: Number(v) }))} type="number" placeholder="0" />
              </Field>
            </div>

            <Field label="Categoría">
              <select value={editingProduct.category || 'Mercado'} onChange={e => setEditingProduct(p => ({ ...p, category: e.target.value as DbProduct['category'] }))} style={inp}>
                <option value="Mercado">Mercado</option>
                <option value="Combos">Combos</option>
                <option value="Electrodomésticos">Electrodomésticos</option>
              </select>
            </Field>

            <Field label="Badge (ej: POPULAR)">
              <TextInput value={editingProduct.badge || ''} onChange={v => setEditingProduct(p => ({ ...p, badge: v }))} placeholder="Opcional" />
            </Field>

            <div className="flex items-center gap-3">
              <Toggle checked={editingProduct.active ?? true} onChange={() => setEditingProduct(p => ({ ...p, active: !p?.active }))} />
              <span className="text-sm" style={{ color: '#404944' }}>Producto activo (visible en tienda)</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="flex-1 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: '#bfc9c3', color: '#404944' }}>Cancelar</button>
              <button onClick={saveProduct} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:opacity-90" style={{ backgroundColor: '#003527', color: 'white' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ COMBO MODAL ══ */}
      {showComboModal && editingCombo && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50"
          onClick={() => { setShowComboModal(false); setEditingCombo(null); setComboItems([]); }}>
          <div className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-5 md:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto"
            style={{ backgroundColor: 'white', boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between sticky top-0 bg-white pt-1 pb-2 -mx-1 px-1" style={{ zIndex: 1 }}>
              <h3 className="text-lg font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>
                {editingCombo.id ? 'Editar Combo' : 'Nuevo Combo'}
              </h3>
              <button onClick={() => { setShowComboModal(false); setEditingCombo(null); setComboItems([]); }} className="p-1" style={{ color: '#404944' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <Field label="Imagen del Combo">
              <ImageUploader
                currentUrl={editingCombo.image_url || ''}
                onUploaded={url => setEditingCombo(c => ({ ...c, image_url: url }))}
                folder="combos"
              />
            </Field>

            <Field label="Nombre *">
              <TextInput value={editingCombo.name || ''} onChange={v => setEditingCombo(c => ({ ...c, name: v }))} placeholder="Nombre del combo" />
            </Field>

            <Field label="Descripción breve">
              <textarea value={editingCombo.description || ''} onChange={e => setEditingCombo(c => ({ ...c, description: e.target.value }))} rows={2}
                style={{ ...inp, resize: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#003527')}
                onBlur={e => (e.currentTarget.style.borderColor = '#bfc9c3')} />
              <p className="text-xs mt-1" style={{ color: '#9b4500' }}>
                💡 Si no agregas productos abajo, escribe aquí los contenidos separados por coma:<br />
                Ej: <em>1 pollo, 3 lb arroz, 2 lb frijoles, 1 botella aceite</em>
              </p>
            </Field>

            <Field label="Productos incluidos en el combo">
              <ComboItemsEditor items={comboItems} products={products} onChange={(newItems) => {
                setComboItems(newItems);
                // Auto-calcular precio original = suma de productos
                const autoPrice = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
                setEditingCombo(c => ({ ...c, original_price: autoPrice }));
              }} />
            </Field>

            {/* Precios — van después de los productos */}
            <div className="rounded-xl p-4 flex flex-col gap-4"
              style={{ backgroundColor: '#f8f4e4', border: '1px solid #e6e3d3' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#404944' }}>
                  Precio original (suma de productos)
                </span>
                <span className="font-bold text-base" style={{ color: '#707974', textDecoration: 'line-through' }}>
                  ${(editingCombo.original_price || 0).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}
                </span>
              </div>
              <div className="h-px" style={{ backgroundColor: '#e6e3d3' }} />
              <Field label="Precio de venta (USD) *">
                <div className="relative">
                  <TextInput
                    value={editingCombo.price || ''}
                    onChange={v => setEditingCombo(c => ({ ...c, price: Number(v) }))}
                    type="number"
                    placeholder="Precio al que se venderá el combo"
                  />
                </div>
                {Number(editingCombo.price) > 0 && Number(editingCombo.original_price) > 0 && (() => {
                  const venta = Number(editingCombo.price);
                  const original = Number(editingCombo.original_price);
                  const diff = venta - original;
                  const pct = Math.abs(Math.round((diff / original) * 100));
                  if (diff < 0) return (
                    <p className="text-xs mt-1 font-semibold" style={{ color: '#059669' }}>
                      ✅ {pct}% de descuento — ahorro de ${Math.abs(diff).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}
                    </p>
                  );
                  if (diff > 0) return (
                    <p className="text-xs mt-1 font-semibold" style={{ color: '#9b4500' }}>
                      📈 {pct}% sobre el costo — ganancia de ${diff.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}
                    </p>
                  );
                  return (
                    <p className="text-xs mt-1" style={{ color: '#707974' }}>
                      Precio de venta igual al costo
                    </p>
                  );
                })()}
              </Field>
            </div>

            <div className="flex items-center gap-3">
              <Toggle checked={editingCombo.active ?? true} onChange={() => setEditingCombo(c => ({ ...c, active: !c?.active }))} />
              <span className="text-sm" style={{ color: '#404944' }}>Combo activo (visible en tienda)</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowComboModal(false); setEditingCombo(null); setComboItems([]); }} className="flex-1 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: '#bfc9c3', color: '#404944' }}>Cancelar</button>
              <button
                onClick={saveCombo}
                disabled={!editingCombo.name || !Number(editingCombo.price)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: '#003527', color: 'white' }}
              >
                {!editingCombo.name
                  ? 'Escribe el nombre'
                  : !Number(editingCombo.price)
                  ? 'Define el precio de venta'
                  : 'Guardar Combo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
