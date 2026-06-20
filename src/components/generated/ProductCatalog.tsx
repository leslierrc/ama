import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { DeliveryTicker } from './DeliveryTicker';
import { Footer } from './Footer';
import { useCart } from '../../hooks/useCart';
import { supabase } from '../../lib/supabase';
import type { Page, FilterCategory } from '../../App';

interface ProductCatalogProps {
  navigate?: (page: Page, filter?: FilterCategory, productInfo?: { id: string; isCombo: boolean }) => void;
  activeFilter?: FilterCategory;
  setActiveFilter?: (filter: FilterCategory) => void;
}

interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: FilterCategory;
  badge?: string | null;
}

const FILTER_PILLS: FilterCategory[] = ['Todos', 'Mercado', 'Combos', 'Electrodomésticos'];

// Skeleton card for loading state
const SkeletonCard = () => (
  <div className="rounded-xl overflow-hidden animate-pulse"
    style={{ backgroundColor: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
    <div className="aspect-square w-full" style={{ backgroundColor: 'var(--color-surface-container)' }} />
    <div className="p-6 flex flex-col gap-3">
      <div className="h-5 rounded-lg w-3/4" style={{ backgroundColor: 'var(--color-surface-container)' }} />
      <div className="h-4 rounded-lg w-full" style={{ backgroundColor: 'var(--color-surface-container)' }} />
      <div className="h-4 rounded-lg w-2/3" style={{ backgroundColor: 'var(--color-surface-container)' }} />
      <div className="mt-2 h-6 rounded-lg w-1/2" style={{ backgroundColor: 'var(--color-surface-container)' }} />
    </div>
  </div>
);

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  navigate,
  activeFilter: propActiveFilter,
  setActiveFilter: propSetActiveFilter,
}) => {
  const [localFilter, setLocalFilter] = useState<FilterCategory>('Todos');
  const activeFilter = propActiveFilter ?? localFilter;
  const setActiveFilter = (f: FilterCategory) => {
    propSetActiveFilter ? propSetActiveFilter(f) : setLocalFilter(f);
  };

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        let items: CatalogProduct[] = [];

        if (activeFilter === 'Combos') {
          // Los combos predefinidos viven en la tabla "combos"
          const { data, error: err } = await supabase
            .from('combos')
            .select('id, name, description, price, original_price, image_url, active')
            .eq('active', true)
            .order('created_at', { ascending: false });
          if (err) throw err;
          items = (data || []).map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || '',
            price: c.price,
            image_url: c.image_url || '',
            category: 'Combos' as FilterCategory,
            badge: c.original_price && c.original_price > c.price ? 'OFERTA' : null,
          }));
        } else {
          // Mercado, Electrodomésticos y Todos vienen de "products"
          // Para "Todos" también mezclamos los combos
          let query = supabase
            .from('products')
            .select('id, name, description, price, image_url, category, badge')
            .eq('active', true)
            .order('created_at', { ascending: false });

          if (activeFilter !== 'Todos') {
            query = query.eq('category', activeFilter);
          }

          const { data, error: err } = await query;
          if (err) throw err;
          const prods = (data || []).map(p => ({ ...p, category: p.category as FilterCategory }));

          // Si es "Todos", también traemos los combos
          if (activeFilter === 'Todos') {
            const { data: combosData } = await supabase
              .from('combos')
              .select('id, name, description, price, original_price, image_url')
              .eq('active', true)
              .order('created_at', { ascending: false });
            const combos = (combosData || []).map(c => ({
              id: c.id,
              name: c.name,
              description: c.description || '',
              price: c.price,
              image_url: c.image_url || '',
              category: 'Combos' as FilterCategory,
              badge: c.original_price && c.original_price > c.price ? 'OFERTA' : null,
            }));
            items = [...prods, ...combos];
          } else {
            items = prods;
          }
        }

        setProducts(items);
      } catch (e) {
        console.error('Error loading products:', e);
        setError('No se pudieron cargar los productos. Verifica tu conexión.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeFilter]);

  return (
    <div className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)' }}>
      <Navbar navigate={navigate} activePage="catalog" />

      <main className="pt-16">
        <DeliveryTicker />

        {/* Header */}
        <section className="max-w-[1280px] mx-auto px-5 md:px-16 pt-14 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="label-caps block mb-2" style={{ color: 'var(--color-gold-muted)' }}>CATÁLOGO</span>
              <h1 className="font-display font-bold"
                style={{ color: 'var(--color-primary)', fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.02em' }}>
                Todo lo que necesitas
              </h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--color-surface-container)', borderColor: 'var(--color-outline-variant)', color: 'var(--color-on-surface-variant)' }}>
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>{loading ? '…' : `${products.length} productos`}</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-3 mt-8 flex-wrap">
            {FILTER_PILLS.map(pill => (
              <button key={pill} onClick={() => setActiveFilter(pill)}
                className="label-caps px-5 py-2 rounded-full transition-all duration-200"
                style={activeFilter === pill
                  ? { backgroundColor: 'var(--color-primary)', color: 'white' }
                  : { backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)', border: '1px solid var(--color-outline-variant)' }
                }
                onMouseEnter={e => { if (activeFilter !== pill) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'; } }}
                onMouseLeave={e => { if (activeFilter !== pill) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-outline-variant)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-on-surface-variant)'; } }}>
                {pill}
              </button>
            ))}
          </div>
        </section>

        {/* Products Grid */}
        <section className="max-w-[1280px] mx-auto px-5 md:px-16 pb-24">

          {/* Error state */}
          {error && (
            <div className="rounded-xl p-8 text-center mb-8"
              style={{ backgroundColor: 'rgba(186,26,26,0.08)', border: '1px solid rgba(186,26,26,0.2)' }}>
              <span className="material-symbols-outlined text-[32px] mb-3 block" style={{ color: '#ba1a1a' }}>wifi_off</span>
              <p className="font-semibold mb-1" style={{ color: '#ba1a1a' }}>Error de conexión</p>
              <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{error}</p>
              <button onClick={() => setActiveFilter(activeFilter)}
                className="mt-4 label-caps px-5 py-2 rounded-xl hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                Reintentar
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Loading skeletons */}
            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

            {/* Products */}
            {!loading && !error && products.map((product, i) => (
              <div key={product.id}
                className="group flex flex-col overflow-hidden rounded-xl ambient-shadow transition-all duration-300 cursor-pointer"
                style={{ backgroundColor: 'var(--color-surface-container-low)', animationDelay: `${i * 40}ms` }}
                onClick={() => navigate?.('detail', undefined, { id: product.id, isCombo: product.category === 'Combos' })}>
                <div className="relative overflow-hidden aspect-square">
                  <img src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'; }} />
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      addToCart({ id: product.id, title: product.name, price: product.price, image: product.image_url, category: product.category });
                      navigate?.('cart');
                    }}
                    className="absolute bottom-4 right-4 p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 active:scale-90"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                    aria-label={`Añadir ${product.name}`}>
                    <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                  </button>
                  <div className="absolute top-3 left-3">
                    <span className="label-caps px-3 py-1 rounded-full"
                      style={{ backgroundColor: 'rgba(2,44,34,0.75)', color: 'white', backdropFilter: 'blur(4px)' }}>
                      {product.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col gap-2 flex-1">
                  <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--color-primary)' }}>
                    {product.name}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {product.description}
                  </p>
                  <div className="pt-4 flex justify-between items-center mt-auto">
                    <span className="text-xl font-medium" style={{ color: 'var(--color-secondary)', fontFamily: 'Inter' }}>
                      ${Number(product.price).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}
                    </span>
                    {product.badge && (
                      <span className="label-caps" style={{ color: 'var(--color-emerald-deep)' }}>
                        {product.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Empty state */}
            {!loading && !error && products.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <span className="material-symbols-outlined text-[48px] mb-4 block" style={{ color: 'var(--color-outline-variant)' }}>inventory_2</span>
                <p className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--color-primary)' }}>
                  No hay productos en esta categoría
                </p>
                <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Pronto agregaremos más productos. ¡Vuelve pronto!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer onAdminClick={() => navigate?.('admin-login')} />
    </div>
  );
};
