import React, { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { DeliveryTicker } from './DeliveryTicker';
import { Footer } from './Footer';
import { AboutSection } from './AboutSection';
import { useCart } from '../../hooks/useCart';
import { supabase } from '../../lib/supabase';
import type { Page, FilterCategory } from '../../App';

interface HomeScreenProps {
  navigate?: (page: Page, filter?: FilterCategory) => void;
}

interface FeaturedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number | null;
  image_url: string;
  category: string;
  badge?: string | null;
}

const SkeletonCard = () => (
  <div className="rounded-xl overflow-hidden animate-pulse"
    style={{ backgroundColor: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
    <div className="aspect-square w-full" style={{ backgroundColor: 'var(--color-surface-container)' }} />
    <div className="p-6 flex flex-col gap-3">
      <div className="h-5 rounded-lg w-3/4" style={{ backgroundColor: 'var(--color-surface-container)' }} />
      <div className="h-4 rounded-lg w-full" style={{ backgroundColor: 'var(--color-surface-container)' }} />
      <div className="h-6 rounded-lg w-1/2 mt-2" style={{ backgroundColor: 'var(--color-surface-container)' }} />
    </div>
  </div>
);

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigate }) => {
  const { addToCart } = useCart();
  const [featured, setFeatured] = useState<FeaturedProduct[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [bannerText, setBannerText] = useState('');

  useEffect(() => {
    // Carga combos predefinidos desde la tabla "combos" (los que crea el admin)
    const loadFeatured = async () => {
      const { data } = await supabase
        .from('combos')
        .select('id, name, description, price, original_price, image_url, active')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(3);
      // Mapea la estructura de combos a FeaturedProduct
      setFeatured(
        (data || []).map(c => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          price: c.price,
          image_url: c.image_url || '',
          category: 'Combos',
          badge: c.original_price && c.original_price > c.price ? 'OFERTA' : null,
        }))
      );
      setLoadingFeatured(false);
    };

    // Load settings (business name, banner text)
    const loadSettings = async () => {
      const { data } = await supabase.from('settings').select('key, value');
      if (data) {
        const s: Record<string, string> = {};
        data.forEach(r => { s[r.key] = r.value; });
        if (s.banner_text) setBannerText(s.banner_text);
      }
    };

    loadFeatured();
    loadSettings();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal-section').forEach(el => {
      el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)' }}>
      <Navbar navigate={navigate} activePage="home" />

      <main>
        <DeliveryTicker bannerText={bannerText} />

        {/* ── Hero ── */}
        <section className="relative flex items-center overflow-hidden" style={{ minHeight: '100vh' }}>
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=1600"
              alt="Mercado artesanal de vegetales frescos"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, rgba(2,44,34,0.55) 0%, rgba(2,44,34,0.15) 60%, transparent 100%)' }} />
          </div>
          <div className="relative z-10 w-full px-5 md:px-16 max-w-[1280px] mx-auto text-white pt-24">
            <div className="max-w-2xl flex flex-col gap-6">
              <h1 className="font-display font-bold leading-tight"
                style={{ fontSize: 'clamp(2.25rem,5vw,3rem)', letterSpacing: '-0.01em' }}>
                AMA: Lo mejor del campo a tu hogar
              </h1>
              <p className="text-lg leading-relaxed opacity-90 max-w-lg">
                Cosechamos calidad y tecnología premium para elevar tu experiencia culinaria diaria.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <button onClick={() => navigate?.('catalog', 'Todos')}
                  className="label-caps px-8 py-4 rounded-xl transition-all active:scale-95 hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-cream-surface)' }}>
                  Explorar Mercado
                </button>
                <button onClick={() => navigate?.('catalog', 'Electrodomésticos')}
                  className="label-caps px-8 py-4 rounded-xl transition-all active:scale-95"
                  style={{ border: '1px solid var(--color-gold-muted)', color: 'var(--color-gold-muted)', backgroundColor: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(217,119,6,0.1)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}>
                  Ver Electrodomésticos
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Category Cards ── */}
        <section className="py-12 md:py-16 px-5 md:px-16 max-w-[1280px] mx-auto reveal-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group relative overflow-hidden rounded-xl cursor-pointer ambient-shadow"
              style={{ aspectRatio: '16/9' }}
              onClick={() => navigate?.('catalog', 'Mercado')}>
              <img src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=900"
                alt="Mercado Premium"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-0 left-0 p-8 w-full text-white">
                <span className="label-caps inline-block px-3 py-1 rounded mb-4"
                  style={{ backgroundColor: 'rgba(2,44,34,0.6)', backdropFilter: 'blur(4px)' }}>Selección</span>
                <h2 className="font-display text-2xl font-semibold mb-2">Mercado Premium</h2>
                <p className="text-sm opacity-90 mb-4">Ingredientes orgánicos directos de pequeños productores.</p>
                <span className="label-caps border-b border-white pb-1 hover:text-yellow-400 hover:border-yellow-400 transition-colors cursor-pointer">
                  DESCUBRIR MÁS
                </span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl cursor-pointer ambient-shadow"
              style={{ aspectRatio: '16/9' }}
              onClick={() => navigate?.('catalog', 'Electrodomésticos')}>
              <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=900"
                alt="Electrodomésticos Modernos"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-0 left-0 p-8 w-full text-white">
                <span className="label-caps inline-block px-3 py-1 rounded mb-4"
                  style={{ backgroundColor: 'rgba(2,44,34,0.6)', backdropFilter: 'blur(4px)' }}>Exclusivo</span>
                <h2 className="font-display text-2xl font-semibold mb-2">Electrodomésticos Modernos</h2>
                <p className="text-sm opacity-90 mb-4">Eficiencia y diseño para la cocina contemporánea.</p>
                <span className="label-caps border-b border-white pb-1 hover:text-yellow-400 hover:border-yellow-400 transition-colors cursor-pointer">
                  CATÁLOGO
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Featured Products (from Supabase) ── */}
        <section className="py-12 md:py-16 px-5 md:px-16 max-w-[1280px] mx-auto reveal-section">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="label-caps block mb-1" style={{ color: 'var(--color-gold-muted)' }}>ESTA SEMANA</span>
              <h2 className="font-display text-3xl font-semibold" style={{ color: 'var(--color-primary)' }}>
                Combos de Temporada
              </h2>
            </div>
            <button onClick={() => navigate?.('catalog', 'Combos')}
              className="label-caps transition-colors duration-300 hidden sm:block"
              style={{ color: 'var(--color-primary-container)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-primary-container)')}>
              VER TODOS
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingFeatured
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : featured.length === 0
                ? (
                  <div className="col-span-full py-16 text-center">
                    <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                      Próximamente combos de temporada. ¡Agrega productos desde el panel admin!
                    </p>
                  </div>
                )
                : featured.map(product => (
                  <div key={product.id}
                    className="group flex flex-col overflow-hidden rounded-xl ambient-shadow transition-transform duration-300"
                    style={{ backgroundColor: 'var(--color-surface-container-low)' }}>
                    <div className="relative overflow-hidden aspect-square">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'; }}
                      />
                      <button
                        onClick={() => {
                          addToCart({ id: product.id, title: product.name, price: product.price, image: product.image_url, category: product.category });
                          navigate?.('cart');
                        }}
                        className="absolute bottom-4 right-4 p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 active:scale-90"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                        aria-label={`Añadir ${product.name} al carrito`}>
                        <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                      </button>
                    </div>
                    <div className="p-6 flex flex-col gap-2 flex-1">
                      <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--color-primary)' }}>
                        {product.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {product.description}
                      </p>
                      <div className="pt-4 flex justify-between items-center mt-auto">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xl font-medium" style={{ color: 'var(--color-secondary)', fontFamily: 'Inter' }}>
                            ${Number(product.price).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}
                          </span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-sm line-through" style={{ color: 'var(--color-on-surface-variant)' }}>
                              ${Number(product.original_price).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}
                            </span>
                          )}
                        </div>
                        {product.badge && (
                          <span className="label-caps" style={{ color: 'var(--color-emerald-deep)' }}>
                            {product.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </section>

        {/* ── Arma tu Combo CTA ── */}
        <section className="py-12 md:py-20 px-5 md:px-16 reveal-section"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          <div className="max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="flex flex-col gap-5">
                <span className="label-caps" style={{ color: 'var(--color-inverse-primary)', letterSpacing: '0.2em' }}>
                  PERSONALIZA
                </span>
                <h2 className="font-display font-bold leading-tight text-white"
                  style={{ fontSize: 'clamp(1.75rem,3.5vw,2.5rem)', letterSpacing: '-0.01em' }}>
                  Arma tu Combo Perfecto 🍳
                </h2>
                <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Elige proteínas, viandas, granos y bebidas a tu medida. Nosotros lo preparamos y entregamos en menos de 24 horas.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => navigate?.('combo')}
                    className="label-caps px-7 py-3.5 rounded-xl transition-all active:scale-95 hover:opacity-90"
                    style={{ backgroundColor: 'white', color: 'var(--color-primary)' }}>
                    Crear mi Combo
                  </button>
                  <button onClick={() => navigate?.('catalog', 'Combos')}
                    className="label-caps px-7 py-3.5 rounded-xl transition-all active:scale-95"
                    style={{ border: '1px solid rgba(255,255,255,0.4)', color: 'white', backgroundColor: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}>
                    Ver Combos Listos
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: '🥩', label: 'Proteínas', sub: 'Pollo, Cerdo, Pescado' },
                  { emoji: '🌿', label: 'Viandas', sub: 'Boniato, Plátanos, Tomate' },
                  { emoji: '🌾', label: 'Granos', sub: 'Arroz, Frijoles, Pasta' },
                  { emoji: '🥤', label: 'Bebidas', sub: 'Jugo, Refresco, Agua' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-4 flex flex-col gap-1"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <span className="text-2xl">{item.emoji}</span>
                    <p className="font-semibold text-sm text-white">{item.label}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── About / Historia con fotos y video ── */}
        <AboutSection />
      </main>

      <Footer onAdminClick={() => navigate?.('admin-login')} />
    </div>
  );
};
