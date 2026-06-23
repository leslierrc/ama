import React, { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { DeliveryTicker } from './DeliveryTicker';
import { Footer } from './Footer';
import { AboutSection } from './AboutSection';
import { useCart } from '../../hooks/useCart';
import { supabase } from '../../lib/supabase';
import type { Page, FilterCategory } from '../../App';
import img from '../../assets/magicpath/tienda.webp';

interface HomeScreenProps {
  navigate?: (page: Page, filter?: FilterCategory, productInfo?: { id: string; isCombo: boolean }) => void;
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
  <div className="rounded-2xl overflow-hidden animate-pulse bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
    <div className="aspect-square w-full bg-gray-100" />
    <div className="p-5 flex flex-col gap-3">
      <div className="h-5 rounded w-3/4 bg-gray-100" />
      <div className="h-4 rounded w-full bg-gray-100" />
      <div className="h-6 rounded w-1/2 mt-2 bg-gray-100" />
    </div>
  </div>
);

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigate }) => {
  const { addToCart } = useCart();
  const [featured, setFeatured] = useState<FeaturedProduct[]>([]);
  const [marketProducts, setMarketProducts] = useState<FeaturedProduct[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [bannerText, setBannerText] = useState('');

  useEffect(() => {
    const loadFeatured = async () => {
      const { data } = await supabase
        .from('combos')
        .select('id, name, description, price, original_price, image_url, active')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(3);
      setFeatured(
        (data || []).map(c => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          price: c.price,
          image_url: c.image_url || '',
          category: 'Combos',
          badge: c.original_price && c.original_price > c.price ? 'OFERTA' : null,
          original_price: c.original_price,
        }))
      );
      setLoadingFeatured(false);
    };

    const loadSettings = async () => {
      const { data } = await supabase.from('settings').select('key, value');
      if (data) {
        const s: Record<string, string> = {};
        data.forEach(r => { s[r.key] = r.value; });
        if (s.banner_text) setBannerText(s.banner_text);
      }
    };

    const loadMarket = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, category, badge')
        .eq('active', true)
        .eq('category', 'Mercado')
        .order('created_at', { ascending: false })
        .limit(6);
      setMarketProducts(
        (data || []).map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: p.price,
          image_url: p.image_url || '',
          category: p.category,
          badge: p.badge || null,
        }))
      );
      setLoadingMarket(false);
    };

    loadFeatured();
    loadMarket();
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
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F7F3EC', color: '#1C3A2F' }}>
      <Navbar navigate={navigate} activePage="home" />
      <main>
        <DeliveryTicker bannerText={bannerText} />

        {/* ── HERO ── */}
        <section className="relative w-full overflow-hidden" style={{ minHeight: '100vh' }}>
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=1600"
              alt="Mercado artesanal de vegetales frescos"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-start pt-20 pb-20">
              <div className="mb-20 select-none animate-fade-in">
              <h2 className="font-display font-bold text-white tracking-tight leading-tight  text-5xl md:text-8xl"
                style={{
                //  fontSize: 'clamp(7rem, 5vw, 3rem)',
                  textShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                  letterSpacing: '-0.01em'
                }}>
                Bienvenido a la tienda virtual de AMA!
              </h2>
            </div>
            <h1 className="font-display font-bold text-white mb-6 leading-tight max-w-4xl"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 3rem)' }}>
              Haga sus compras desde la comodidad de su casa
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-3xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>
              Olvídate de largas caminatas y la búsqueda irritante de cada producto en la calle.
              En AMA te llevamos todo lo que necesitas.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate?.('catalog', 'Todos')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all active:scale-95"
                style={{ backgroundColor: '#E07B39', boxShadow: '0 4px 20px rgba(224,123,57,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c96c30')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#E07B39')}>
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                Explorar Mercado
              </button>
              <button
                onClick={() => navigate?.('combo')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all active:scale-95"
                style={{ border: '1px solid rgba(255,255,255,0.5)', backgroundColor: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                Armar tu Combo
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── CATEGORY CARDS ── */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mercado */}
            <div
              className="relative rounded-2xl overflow-hidden cursor-pointer group"
              style={{ height: '400px', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.25)' }}
              onClick={() => navigate?.('catalog', 'Mercado')}>
              <img src={img} alt="Mercado Premium"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)' }} />
              <div className="absolute top-6 left-6">
                <span className="text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  style={{ backgroundColor: '#1C3A2F' }}>SELECCIÓN</span>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end">
                <h3 className="font-display text-3xl font-bold text-white mb-2">Mercado Premium</h3>
                <p className="mb-6 text-sm md:text-base" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  Frutas, vegetales, carnes y más — frescos cada día, sin que tengas que salir.
                </p>
                <div className="flex items-center font-bold text-sm tracking-widest uppercase text-white transition-colors group-hover:text-[#E07B39]">
                  Descubrir más
                  <span className="material-symbols-outlined text-[18px] ml-2 transition-transform group-hover:translate-x-1">arrow_forward</span>
                </div>
              </div>
            </div>

            {/* Electrodomésticos */}
            <div
              className="relative rounded-2xl overflow-hidden cursor-pointer group"
              style={{ height: '400px', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.25)' }}
              onClick={() => navigate?.('catalog', 'Electrodomésticos')}>
              <img
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=900"
                alt="Electrodomésticos Modernos"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)' }} />
              <div className="absolute top-6 left-6">
                <span className="text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  style={{ backgroundColor: '#E07B39' }}>EXCLUSIVO</span>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end">
                <h3 className="font-display text-3xl font-bold text-white mb-2">Electrodomésticos Modernos</h3>
                <p className="mb-6 text-sm md:text-base" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  Los mejores precios del mercado con garantía real. Eficiencia y diseño para tu hogar.
                </p>
                <div className="flex items-center font-bold text-sm tracking-widest uppercase text-white transition-colors group-hover:text-[#E07B39]">
                  Catálogo
                  <span className="material-symbols-outlined text-[18px] ml-2 transition-transform group-hover:translate-x-1">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMBOS DE TEMPORADA ── */}
        <section className="py-20 reveal-section" style={{ backgroundColor: '#F7F3EC' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: '#E07B39' }}>Esta Semana</p>
                <h2 className="font-display font-bold text-[#1C3A2F]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                  Combos de Temporada
                </h2>
              </div>
              <button
                onClick={() => navigate?.('catalog', 'Combos')}
                className="hidden md:inline-flex items-center text-sm font-bold tracking-widest uppercase transition-colors"
                style={{ color: '#1C3A2F' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#E07B39')}
                onMouseLeave={e => (e.currentTarget.style.color = '#1C3A2F')}>
                Ver Todos
                <span className="material-symbols-outlined text-[16px] ml-1">chevron_right</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loadingFeatured
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                : featured.length === 0
                  ? (
                    <div className="col-span-full py-16 text-center">
                      <p className="text-sm" style={{ color: '#404944' }}>
                        Próximamente combos de temporada. ¡Agrega desde el panel admin!
                      </p>
                    </div>
                  )
                  : featured.map(product => (
                    <div key={product.id}
                      className="bg-white rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                      style={{ boxShadow: '0 4px_24px_rgba(0,0,0,0.08)'.replace(/_/g,' ') }}
                      onClick={() => navigate?.('detail', undefined, { id: product.id, isCombo: true })}>
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <img
                          src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'; }}
                        />
                        {product.badge && (
                          <span className="absolute top-4 right-4 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm z-10"
                            style={{ backgroundColor: '#16a34a' }}>
                            {product.badge}
                          </span>
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-1 relative">
                        <h3 className="text-xl font-bold mb-1" style={{ color: '#1C3A2F', fontFamily: 'Playfair Display, serif' }}>
                          {product.name}
                        </h3>
                        <p className="text-sm mb-4 line-clamp-2 flex-1" style={{ color: '#6b7280' }}>
                          {product.description}
                        </p>
                        <div className="mt-auto flex items-center justify-between">
                          <div>
                            <p className="text-xl font-bold" style={{ color: '#E07B39', fontFamily: 'Inter, sans-serif' }}>
                              ${Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            {product.original_price && product.original_price > product.price && (
                              <p className="text-sm line-through" style={{ color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
                                ${Number(product.original_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              addToCart({ id: product.id, title: product.name, price: product.price, image: product.image_url, category: product.category });
                              navigate?.('cart');
                            }}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors shadow-lg active:scale-90"
                            style={{ backgroundColor: '#E07B39' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c96c30')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#E07B39')}
                            aria-label={`Añadir ${product.name} al carrito`}>
                            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>

            {/* Mobile ver todos */}
            <div className="mt-8 text-center md:hidden">
              <button
                onClick={() => navigate?.('catalog', 'Combos')}
                className="inline-flex items-center text-sm font-bold tracking-widest uppercase transition-colors pb-1"
                style={{ color: '#1C3A2F', borderBottom: '2px solid transparent' }}
                onMouseEnter={e => { (e.currentTarget.style.color = '#E07B39'); (e.currentTarget.style.borderBottomColor = '#E07B39'); }}
                onMouseLeave={e => { (e.currentTarget.style.color = '#1C3A2F'); (e.currentTarget.style.borderBottomColor = 'transparent'); }}>
                Ver Todos Los Combos
                <span className="material-symbols-outlined text-[16px] ml-1">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── DEL MERCADO PARA TU MESA ── */}
        <section className="py-20 reveal-section" style={{ backgroundColor: '#F7F3EC' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: '#E07B39' }}>Disponible Hoy</p>
                <h2 className="font-display font-bold text-[#1C3A2F]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                  Del Mercado para tu Mesa
                </h2>
              </div>
              <button
                onClick={() => navigate?.('catalog', 'Mercado')}
                className="hidden md:inline-flex items-center text-sm font-bold tracking-widest uppercase transition-colors"
                style={{ color: '#1C3A2F' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#E07B39')}
                onMouseLeave={e => (e.currentTarget.style.color = '#1C3A2F')}>
                Ver Todos
                <span className="material-symbols-outlined text-[16px] ml-1">chevron_right</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {loadingMarket
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : marketProducts.map(product => (
                  <div key={product.id}
                    className="bg-white rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300 cursor-pointer relative"
                    style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
                    onClick={() => navigate?.('detail', undefined, { id: product.id, isCombo: false })}>
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'; }}
                      />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                        <button
                          onClick={ev => {
                            ev.stopPropagation();
                            addToCart({ id: product.id, title: product.name, price: product.price, image: product.image_url, category: product.category as FilterCategory });
                            navigate?.('cart');
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all translate-y-4 group-hover:translate-y-0 duration-300 active:scale-90"
                          style={{ backgroundColor: 'white', color: '#1C3A2F' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#E07B39'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'white'; (e.currentTarget as HTMLElement).style.color = '#1C3A2F'; }}
                          aria-label={`Añadir ${product.name} al carrito`}>
                          <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                        </button>
                      </div>
                      {product.badge && (
                        <span className="absolute top-2 left-2 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                          style={{ backgroundColor: '#E07B39' }}>
                          {product.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-sm font-bold mb-2 leading-snug line-clamp-2 flex-1" style={{ color: '#1C3A2F' }}>
                        {product.name}
                      </h3>
                      <p className="text-sm font-bold" style={{ color: '#E07B39', fontFamily: 'Inter, sans-serif' }}>
                        ${Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))
              }
            </div>

            <div className="mt-12 text-center">
              <button
                onClick={() => navigate?.('catalog', 'Mercado')}
                className="px-8 py-3 font-semibold rounded-xl transition-all border"
                style={{ backgroundColor: 'white', color: '#1C3A2F', borderColor: 'rgba(28,58,47,0.2)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1C3A2F'; (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.borderColor = '#1C3A2F'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'white'; (e.currentTarget as HTMLElement).style.color = '#1C3A2F'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(28,58,47,0.2)'; }}>
                Ver todos los productos
              </button>
            </div>
          </div>
        </section>

        {/* ── Gradiente: crema → verde oscuro ── */}
        <div style={{ height: '100px', background: 'linear-gradient(to bottom, #F7F3EC, #1C3A2F)' }} />

        {/* ── ARMA TU COMBO CTA ── */}
        <section className="py-24 reveal-section" style={{ backgroundColor: '#1C3A2F', color: 'white' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: '#E07B39' }}>Personaliza</p>
                <h2 className="font-display font-bold text-white mb-6 leading-tight"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
                  Arma tu Combo Perfecto <span className="inline-block animate-bounce">🍳</span>
                </h2>
                <p className="text-lg mb-10 max-w-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  Elige proteínas, viandas, granos y bebidas a tu medida. Nosotros lo preparamos y
                  entregamos en menos de 24 horas, garantizando frescura y calidad. Combos fitness
                  incluidos para nuestros atletas del hogar 💪
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate?.('combo')}
                    className="px-8 py-4 rounded-xl font-bold transition-all active:scale-95"
                    style={{ backgroundColor: 'white', color: '#1C3A2F' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
                    Crear mi Combo
                  </button>
                  <button
                    onClick={() => navigate?.('catalog', 'Combos')}
                    className="px-8 py-4 rounded-xl font-bold transition-all active:scale-95"
                    style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'white', backgroundColor: 'transparent' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'white'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                    Ver combos listos
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { emoji: '🥩', label: 'Proteínas', sub: 'Pollo, Cerdo, Pescado' },
                  { emoji: '🌿', label: 'Viandas', sub: 'Boniato, Plátanos, Tomate' },
                  { emoji: '🌾', label: 'Granos', sub: 'Arroz, Frijoles, Pasta' },
                  { emoji: '🥛', label: 'Bebidas', sub: 'Jugo, Refresco, Agua' },
                ].map(item => (
                  <div key={item.label}
                    className="p-6 rounded-2xl cursor-pointer transition-colors"
                    style={{ backgroundColor: '#2A4B3F', border: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#34584A')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2A4B3F')}>
                    <div className="text-2xl mb-4">{item.emoji}</div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.label}</h3>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Gradiente: verde oscuro → negro verde (About) ── */}
        <div style={{ height: '100px', background: 'linear-gradient(to bottom, #1C3A2F, #0F2318)' }} />

        {/* ── SOBRE NOSOTROS ── */}
        <AboutSection />

        {/* ── Gradiente: negro verde → crema (Visítanos) ── */}
        <div style={{ height: '100px', background: 'linear-gradient(to bottom, #0F2318, #F7F3EC)' }} />

        {/* ── VISÍTANOS ── */}
        <section className="py-24 reveal-section" style={{ backgroundColor: '#F7F3EC' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              {/* Mapa */}
              <div className="rounded-2xl overflow-hidden relative" style={{ height: '400px', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.2)' }}>
                <iframe
                  title="Ubicación AMA Store"
                  width="100%"
                  height="100%"
                  style={{ border: 0, position: 'absolute', inset: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src="https://www.google.com/maps?q=Calle+Lasola+21+entre+Ave+Lacret+y+General+Lee+La+Habana+Cuba&output=embed"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-center">
                <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: '#E07B39' }}>Encuéntranos</p>
                <h2 className="font-display font-bold mb-10 leading-tight" style={{ color: '#1C3A2F', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                  Visítanos en Persona
                </h2>

                <div className="space-y-4 mb-10">
                  {[
                    { icon: 'location_on', title: 'Calle Lasola #21', sub: 'Entre Ave. Lacret y General Lee, La Habana, Cuba' },
                    { icon: 'schedule', title: 'Horario de atención', sub: 'Lunes a Domingo · Hasta las 6:00 PM' },
                  ].map(item => (
                    <div key={item.title}
                      className="flex items-start gap-4 p-6 rounded-xl bg-white transition-colors"
                      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(28,58,47,0.05)' }}>
                      <div className="p-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#F7F3EC' }}>
                        <span className="material-symbols-outlined text-[22px]" style={{ color: '#1C3A2F' }}>{item.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg" style={{ color: '#1C3A2F' }}>{item.title}</h4>
                        <p className="text-sm" style={{ color: '#6b7280' }}>{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(28,58,47,0.05)', border: '1px solid rgba(28,58,47,0.1)' }}>
                  <h4 className="font-bold text-lg mb-2" style={{ color: '#1C3A2F' }}>¿Tienes dudas?</h4>
                  <p className="mb-6 text-sm" style={{ color: '#6b7280' }}>Escríbenos por WhatsApp y te respondemos de inmediato</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Calle+Lasola+21+entre+Ave+Lacret+y+General+Lee+La+Habana+Cuba"
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all"
                      style={{ backgroundColor: '#1C3A2F' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2a5545')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1C3A2F')}>
                      <span className="material-symbols-outlined text-[18px]">map</span>
                      Cómo llegar
                    </a>
                    <a
                      href="https://wa.me/5355542936"
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all"
                      style={{ backgroundColor: '#25D366' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#20bd5a')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#25D366')}>
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer onAdminClick={() => navigate?.('admin-login')} />
    </div>
  );
};
