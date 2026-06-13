import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useCart } from '../../hooks/useCart';
import { supabase } from '../../lib/supabase';
import type { Page } from '../../App';

interface ComboBuilderScreenProps {
  navigate?: (page: Page) => void;
}

interface ComboItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface ComboCategory {
  id: string;
  label: string;
  emoji: string;
  items: ComboItem[];
}

type QuantityMap = Record<string, number>;

// Map DB categories to display groups with emojis
const CATEGORY_EMOJI: Record<string, string> = {
  'Mercado': '🛒',
  'Combos': '📦',
  'Electrodomésticos': '⚡',
};

// Fallback static categories when Supabase isn't configured
const FALLBACK_CATEGORIES: ComboCategory[] = [
  {
    id: 'proteinas', label: 'Proteínas', emoji: '🥩',
    items: [
      { id: 'pollo', name: 'Pollo', price: 1200, category: 'Proteínas' },
      { id: 'cerdo', name: 'Cerdo', price: 800, category: 'Proteínas' },
      { id: 'pescado', name: 'Pescado', price: 950, category: 'Proteínas' },
    ],
  },
  {
    id: 'viandas', label: 'Viandas', emoji: '🌿',
    items: [
      { id: 'boniato', name: 'Boniato', price: 120, category: 'Viandas' },
      { id: 'platanos', name: 'Plátanos', price: 90, category: 'Viandas' },
      { id: 'tomate', name: 'Tomate', price: 150, category: 'Viandas' },
    ],
  },
  {
    id: 'granos', label: 'Granos', emoji: '🌾',
    items: [
      { id: 'arroz', name: 'Arroz', price: 180, category: 'Granos' },
      { id: 'frijoles', name: 'Frijoles', price: 200, category: 'Granos' },
      { id: 'pasta', name: 'Pasta', price: 160, category: 'Granos' },
    ],
  },
  {
    id: 'bebidas', label: 'Bebidas', emoji: '🥤',
    items: [
      { id: 'jugo', name: 'Jugo Natural', price: 180, category: 'Bebidas' },
      { id: 'refresco', name: 'Refresco', price: 120, category: 'Bebidas' },
      { id: 'agua', name: 'Agua Mineral', price: 60, category: 'Bebidas' },
    ],
  },
];

export const ComboBuilderScreen: React.FC<ComboBuilderScreenProps> = ({ navigate }) => {
  const [categories, setCategories] = useState<ComboCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const [comboName, setComboName] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        // Load all active Mercado products and group by category
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, category')
          .eq('active', true)
          .eq('category', 'Mercado')
          .order('name');

        if (error || !data || data.length === 0) {
          // Fall back to static data if Supabase not configured or no products
          setCategories(FALLBACK_CATEGORIES);
          return;
        }

        // Group products by their name patterns into logical combo categories
        // Since DB products are flat, we group them into meaningful combo sections
        const grouped: Record<string, ComboItem[]> = {};
        data.forEach(p => {
          // Simple grouping heuristic based on product names
          let group = 'Otros';
          const lower = p.name.toLowerCase();
          if (lower.includes('pollo') || lower.includes('cerdo') || lower.includes('carne') ||
              lower.includes('pescado') || lower.includes('res') || lower.includes('jamón')) {
            group = 'Proteínas 🥩';
          } else if (lower.includes('arroz') || lower.includes('frijol') || lower.includes('pasta') ||
                     lower.includes('harina') || lower.includes('maíz') || lower.includes('lenteja')) {
            group = 'Granos 🌾';
          } else if (lower.includes('tomate') || lower.includes('cebolla') || lower.includes('ajo') ||
                     lower.includes('boniato') || lower.includes('plátano') || lower.includes('yuca') ||
                     lower.includes('vegetal') || lower.includes('verdura') || lower.includes('lechuga')) {
            group = 'Viandas y Vegetales 🌿';
          } else if (lower.includes('leche') || lower.includes('jugo') || lower.includes('refresco') ||
                     lower.includes('agua') || lower.includes('café') || lower.includes('bebida')) {
            group = 'Lácteos y Bebidas 🥤';
          } else if (lower.includes('aceite') || lower.includes('azúcar') || lower.includes('sal') ||
                     lower.includes('vinagre') || lower.includes('salsa') || lower.includes('detergente') ||
                     lower.includes('jabón') || lower.includes('aseo') || lower.includes('pasta dental')) {
            group = 'Básicos del Hogar 🏠';
          } else {
            group = 'Mercado General 🛒';
          }
          if (!grouped[group]) grouped[group] = [];
          grouped[group].push({ id: p.id, name: p.name, price: p.price, category: p.category });
        });

        const built: ComboCategory[] = Object.entries(grouped)
          .filter(([, items]) => items.length > 0)
          .map(([label, items]) => ({
            id: label.toLowerCase().replace(/\s+/g, '-'),
            label: label.replace(/\s*[^\w\s]+$/, '').trim(), // remove emoji for id
            emoji: label.match(/[\u{1F000}-\u{1FFFF}]|[\u2600-\u26FF]|[\u2700-\u27BF]/u)?.[0] || '📦',
            items,
          }));

        setCategories(built.length > 0 ? built : FALLBACK_CATEGORIES);
      } catch {
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      return { ...prev, [id]: next };
    });
  };

  const allItems = categories.flatMap(c => c.items);
  const selectedItems = allItems.filter(i => (quantities[i.id] ?? 0) > 0);
  const total = selectedItems.reduce((sum, i) => sum + i.price * (quantities[i.id] ?? 0), 0);
  const itemCount = selectedItems.reduce((sum, i) => sum + (quantities[i.id] ?? 0), 0);

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface-container)',
    border: '1px solid var(--color-outline-variant)',
    color: 'var(--color-on-surface)',
    borderRadius: '0.75rem',
    padding: '12px 16px',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)' }}>
      <Navbar navigate={navigate} />

      <main className="pt-20 pb-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-16">
          {/* Header */}
          <div className="pt-10 pb-10">
            <span className="label-caps block mb-2" style={{ color: 'var(--color-gold-muted)' }}>
              PERSONALIZA
            </span>
            <h1 className="font-display font-bold mb-3"
              style={{ color: 'var(--color-primary)', fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.02em' }}>
              Arma tu Combo Perfecto
            </h1>
            <p className="text-lg" style={{ color: 'var(--color-on-surface-variant)' }}>
              Selecciona los productos que quieres y creamos un combo a tu medida.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* LEFT: Item selectors */}
            <div className="lg:col-span-3 flex flex-col gap-6">

              {/* Loading skeleton */}
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden animate-pulse"
                  style={{ backgroundColor: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                  <div className="h-14" style={{ backgroundColor: 'var(--color-surface-container)' }} />
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between px-6 py-5 border-t"
                      style={{ borderColor: 'var(--color-outline-variant)' }}>
                      <div className="flex flex-col gap-2">
                        <div className="h-4 w-28 rounded" style={{ backgroundColor: 'var(--color-surface-container)' }} />
                        <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--color-surface-container)' }} />
                      </div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--color-surface-container)' }} />
                        <div className="w-6 h-8 rounded" style={{ backgroundColor: 'var(--color-surface-container)' }} />
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--color-surface-container)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Categories */}
              {!loading && categories.map(cat => (
                <div key={cat.id} className="rounded-xl overflow-hidden ambient-shadow"
                  style={{ backgroundColor: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                  <div className="px-6 py-4 border-b"
                    style={{ borderColor: 'var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container)' }}>
                    <h2 className="font-display font-semibold text-lg" style={{ color: 'var(--color-primary)' }}>
                      {cat.emoji} {cat.label}
                    </h2>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
                    {cat.items.map(item => {
                      const qty = quantities[item.id] ?? 0;
                      return (
                        <div key={item.id} className="flex items-center justify-between px-6 py-4">
                          <div>
                            <p className="font-medium" style={{ color: 'var(--color-on-surface)' }}>{item.name}</p>
                            <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                              CUP ${Number(item.price).toLocaleString('es-CU')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setQty(item.id, -1)} disabled={qty === 0}
                              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
                              onMouseEnter={e => { if (qty > 0) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-secondary)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-secondary)'; } }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-outline-variant)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-on-surface)'; }}>
                              <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <span className="w-6 text-center font-bold text-sm" style={{ color: 'var(--color-on-surface)' }}>
                              {qty}
                            </span>
                            <button onClick={() => setQty(item.id, 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                              style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-outline-variant)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-on-surface)'; }}>
                              <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT: Live Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-xl ambient-shadow flex flex-col gap-6 p-6"
                style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}>
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
                    <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--color-primary)' }}>restaurant</span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold" style={{ color: 'var(--color-primary)' }}>Tu Combo</h3>
                    <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                      {itemCount > 0 ? `${itemCount} producto${itemCount > 1 ? 's' : ''}` : 'Aún vacío'}
                    </p>
                  </div>
                </div>

                {/* Combo name */}
                <div className="flex flex-col gap-2">
                  <label className="label-caps" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Nombre del combo
                  </label>
                  <input type="text" value={comboName} onChange={e => setComboName(e.target.value)}
                    placeholder="Ej: Combo del domingo…" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-outline-variant)')} />
                </div>

                {/* Selected items */}
                <div className="min-h-[120px]">
                  {selectedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-4xl mb-3">🛒</p>
                      <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Agrega productos para ver tu combo aquí
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selectedItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span style={{ color: 'var(--color-on-surface-variant)' }}>
                            <span className="font-bold" style={{ color: 'var(--color-on-surface)' }}>
                              {quantities[item.id]}×
                            </span>{' '}
                            {item.name}
                          </span>
                          <span style={{ color: 'var(--color-on-surface-variant)' }}>
                            ${(item.price * (quantities[item.id] ?? 0)).toLocaleString('es-CU')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t" style={{ borderColor: 'var(--color-outline-variant)' }} />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Total estimado
                  </span>
                  <span className="text-2xl font-semibold"
                    style={{ color: 'var(--color-secondary)', fontFamily: 'Inter' }}>
                    CUP ${total.toLocaleString('es-CU')}
                  </span>
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    addToCart({
                      id: `combo-custom-${Date.now()}`,
                      title: comboName.trim() || 'Combo Personalizado',
                      price: total,
                      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
                      category: 'Combo Personalizado',
                      isCombo: true,
                      comboItems: selectedItems.map(item => ({
                        name: item.name,
                        quantity: quantities[item.id],
                        price: item.price,
                      })),
                    });
                    navigate?.('cart');
                  }}
                  disabled={selectedItems.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl label-caps transition-all active:scale-95 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                  <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                  Agregar Combo al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer onAdminClick={() => navigate?.('admin-login')} />
    </div>
  );
};
