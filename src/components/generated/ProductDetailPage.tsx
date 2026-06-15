import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useCart } from '../../hooks/useCart';
import type { Page, FilterCategory } from '../../App';

interface ProductDetailPageProps {
  navigate?: (page: Page, filter?: FilterCategory) => void;
}

const SPECS = [
  { id: 'btu', label: 'Capacidad', value: '12,000 BTU' },
  { id: 'voltage', label: 'Voltaje', value: '220V' },
  { id: 'power', label: 'Consumo', value: '900W' },
  { id: 'warranty', label: 'Garantía', value: '1 año' },
  { id: 'type', label: 'Tipo', value: 'Inverter' },
  { id: 'coverage', label: 'Cobertura', value: 'Hasta 25 m²' },
];

const RELATED = [
  {
    id: 'freidora',
    title: 'Freidora de Aire',
    price: 14000,
    image: 'https://images.unsplash.com/photo-1648169668764-0e29a2a75b28?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'refrigerador',
    title: 'Refrigerador',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'batidora',
    title: 'Batidora de Vaso',
    price: 6500,
    image: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&q=80&w=600',
  },
];

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ navigate }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      id: 'split',
      title: 'Split 1 Ton Inverter',
      price: 45000,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=600',
      category: 'Electrodomésticos',
    });
    navigate?.('cart');
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
    >
      <Navbar navigate={navigate} />

      <main className="pt-20">
        {/* Breadcrumb */}
        <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-6">
          <nav className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            <button
              onClick={() => navigate?.('home')}
              className="transition-colors hover:underline"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              Inicio
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <button
              onClick={() => navigate?.('catalog')}
              className="transition-colors hover:underline"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              Electrodomésticos
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span style={{ color: 'var(--color-on-surface)' }} className="font-medium">
              Split 1 Ton Inverter
            </span>
          </nav>
        </div>

        {/* Main product */}
        <section className="max-w-[1280px] mx-auto px-5 md:px-16 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Image */}
            <div className="relative">
              <div
                className="aspect-square rounded-xl overflow-hidden ambient-shadow"
                style={{ border: '1px solid var(--color-surface-variant)' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=900"
                  alt="Split Inverter 1 Tonelada"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-4 left-4">
                <span
                  className="label-caps px-3 py-1.5 rounded-full text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Electrodoméstico
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center gap-6">
              {/* Stars */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span
                      key={s}
                      className="material-symbols-outlined text-[18px]"
                      style={{
                        color: 'var(--color-gold-muted)',
                        fontVariationSettings: "'FILL' 1",
                      }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-gold-muted)' }}
                >
                  4.9
                </span>
                <span className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  (128 reseñas)
                </span>
              </div>

              <div>
                <h1
                  className="font-display font-bold leading-tight mb-4"
                  style={{
                    color: 'var(--color-primary)',
                    fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Split Inverter<br />1 Tonelada
                </h1>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ color: '#10b981', fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
                    En stock — Entrega en 24h
                  </span>
                </div>
                <div className="text-3xl font-semibold" style={{ color: 'var(--color-secondary)', fontFamily: 'Inter' }}>
                  $45,000
                </div>
              </div>

              {/* Delivery note */}
              <div
                className="rounded-xl p-4 flex items-center gap-3"
                style={{
                  backgroundColor: 'var(--color-surface-container)',
                  border: '1px solid var(--color-outline-variant)',
                }}
              >
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{ color: 'var(--color-primary)' }}
                >
                  local_shipping
                </span>
                <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  <span style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>
                    Entrega gratis en La Habana
                  </span>{' '}
                  en menos de 24 horas
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl label-caps transition-all active:scale-95 hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                  }}
                >
                  <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                  Agregar al Carrito
                </button>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl label-caps transition-all active:scale-95 hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--color-secondary)',
                    color: 'white',
                  }}
                >
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  Comprar Ahora
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Pago contra entrega disponible · Garantía de 1 año</span>
              </div>
            </div>
          </div>
        </section>

        {/* Specs */}
        <section
          className="py-16 px-5 md:px-16"
          style={{ backgroundColor: 'var(--color-surface-container-low)' }}
        >
          <div className="max-w-[1280px] mx-auto">
            <h2
              className="font-display text-2xl font-semibold mb-8"
              style={{ color: 'var(--color-primary)' }}
            >
              Especificaciones técnicas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {SPECS.map(spec => (
                <div
                  key={spec.id}
                  className="rounded-xl p-5 ambient-shadow"
                  style={{
                    backgroundColor: 'var(--color-surface-container-lowest)',
                    border: '1px solid var(--color-outline-variant)',
                  }}
                >
                  <p
                    className="label-caps mb-1"
                    style={{ color: 'var(--color-on-surface-variant)' }}
                  >
                    {spec.label}
                  </p>
                  <p
                    className="text-lg font-semibold"
                    style={{ color: 'var(--color-on-surface)' }}
                  >
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Products */}
        <section className="py-16 px-5 md:px-16 max-w-[1280px] mx-auto pb-24">
          <h2
            className="font-display text-2xl font-semibold mb-8"
            style={{ color: 'var(--color-primary)' }}
          >
            Productos relacionados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {RELATED.map(product => (
              <div
                key={product.id}
                className="group overflow-hidden rounded-xl cursor-pointer ambient-shadow transition-all duration-300"
                style={{ backgroundColor: 'var(--color-surface-container-low)' }}
                onClick={() => navigate?.('detail')}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3
                    className="font-display font-semibold mb-1 transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {product.title}
                  </h3>
                  <p
                    className="text-lg font-medium"
                    style={{ color: 'var(--color-secondary)', fontFamily: 'Inter' }}
                  >
                    ${product.price.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer onAdminClick={() => navigate?.('admin-login' as any)} />
    </div>
  );
};
