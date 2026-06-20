import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useCart } from '../../hooks/useCart';
import { supabase } from '../../lib/supabase';
import type { Page, FilterCategory } from '../../App';

interface ProductDetailPageProps {
  navigate?: (page: Page, filter?: FilterCategory, productInfo?: { id: string; isCombo: boolean }) => void;
  selectedProduct?: { id: string; isCombo: boolean } | null;
}

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number | null;
  image_url: string;
  category: string;
  badge?: string | null;
  isCombo: boolean;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ navigate, selectedProduct }) => {
  const { addToCart } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // Default product ID (Split Inverter) if selectedProduct is null
  const defaultProductId = '8575fae6-4b5e-40f0-8c49-f5e32089f738';
  const targetId = selectedProduct?.id || defaultProductId;
  const isCombo = selectedProduct ? selectedProduct.isCombo : false;

  useEffect(() => {
    const loadProductDetails = async () => {
      setLoading(true);
      setError('');
      try {
        if (isCombo) {
          // Fetch combo details
          const { data, error: err } = await supabase
            .from('combos')
            .select('id, name, description, price, original_price, image_url, active')
            .eq('id', targetId)
            .single();
          if (err) throw err;
          if (data) {
            setProduct({
              id: data.id,
              name: data.name,
              description: data.description || '',
              price: data.price,
              original_price: data.original_price,
              image_url: data.image_url || '',
              category: 'Combos',
              badge: data.original_price && data.original_price > data.price ? 'OFERTA' : null,
              isCombo: true,
            });
          } else {
            throw new Error('Combo no encontrado');
          }
        } else {
          // Fetch product details
          const { data, error: err } = await supabase
            .from('products')
            .select('id, name, description, price, image_url, category, badge, active')
            .eq('id', targetId)
            .single();
          if (err) throw err;
          if (data) {
            setProduct({
              id: data.id,
              name: data.name,
              description: data.description || '',
              price: data.price,
              image_url: data.image_url || '',
              category: data.category,
              badge: data.badge,
              isCombo: false,
            });
          } else {
            throw new Error('Producto no encontrado');
          }
        }
      } catch (e) {
        console.error('Error loading product details:', e);
        setError('No se pudo cargar el producto.');
      } finally {
        setLoading(false);
      }
    };

    loadProductDetails();
  }, [targetId, isCombo]);

  useEffect(() => {
    if (!product) return;
    const loadRelated = async () => {
      try {
        if (product.isCombo) {
          const { data } = await supabase
            .from('combos')
            .select('id, name, description, price, original_price, image_url')
            .eq('active', true)
            .neq('id', product.id)
            .limit(3);
          if (data) {
            setRelatedProducts(data.map(c => ({
              id: c.id,
              title: c.name,
              price: c.price,
              image: c.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
              isCombo: true,
            })));
          }
        } else {
          const { data } = await supabase
            .from('products')
            .select('id, name, description, price, image_url, category')
            .eq('active', true)
            .eq('category', product.category)
            .neq('id', product.id)
            .limit(3);
          if (data) {
            setRelatedProducts(data.map(p => ({
              id: p.id,
              title: p.name,
              price: p.price,
              image: p.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
              isCombo: false,
            })));
          }
        }
      } catch (e) {
        console.error('Error loading related products:', e);
      }
    };
    loadRelated();
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      title: product.name,
      price: product.price,
      image: product.image_url,
      category: product.category as FilterCategory,
    });
    navigate?.('cart');
  };

  const getSpecs = () => {
    if (product?.category === 'Electrodomésticos') {
      if (product.name.toLowerCase().includes('split')) {
        return [
          { id: 'btu', label: 'Capacidad', value: '12,000 BTU' },
          { id: 'voltage', label: 'Voltaje', value: '220V' },
          { id: 'power', label: 'Consumo', value: '900W' },
          { id: 'warranty', label: 'Garantía', value: '1 año' },
          { id: 'type', label: 'Tipo', value: 'Inverter' },
          { id: 'coverage', label: 'Cobertura', value: 'Hasta 25 m²' },
        ];
      }
      return [
        { id: 'type', label: 'Tipo', value: 'Electrodoméstico' },
        { id: 'warranty', label: 'Garantía', value: '1 año' },
        { id: 'voltage', label: 'Voltaje', value: '110V / 220V' },
        { id: 'efficiency', label: 'Eficiencia', value: 'Clase A+++' },
      ];
    }
    return [
      { id: 'origin', label: 'Origen', value: 'Nacional / Fresco' },
      { id: 'preservation', label: 'Conservación', value: 'Fresco / Refrigerar' },
      { id: 'delivery', label: 'Entrega', value: 'Menos de 24 horas' },
      { id: 'quality', label: 'Garantía', value: 'Calidad 100% controlada' },
      { id: 'packaging', label: 'Empaque', value: 'Ecológico / Biodegradable' },
    ];
  };

  if (loading) {
    return (
      <div
        className="min-h-screen overflow-x-hidden"
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
      >
        <Navbar navigate={navigate} />
        <main className="pt-20">
          <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-6">
            <div className="h-5 w-48 rounded bg-gray-200 animate-pulse" />
          </div>
          <section className="max-w-[1280px] mx-auto px-5 md:px-16 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              <div className="aspect-square w-full rounded-xl bg-gray-200 animate-pulse" />
              <div className="flex flex-col gap-6 justify-center">
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-12 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-36 bg-gray-200 rounded animate-pulse" />
                <div className="h-20 w-full bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-14 flex-1 bg-gray-200 rounded animate-pulse" />
                  <div className="h-14 flex-1 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        className="min-h-screen overflow-x-hidden"
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
      >
        <Navbar navigate={navigate} />
        <main className="pt-32 pb-24 flex flex-col items-center justify-center text-center px-6">
          <div className="text-7xl mb-6">⚠️</div>
          <h1
            className="font-display font-bold mb-4"
            style={{ color: 'var(--color-primary)', fontSize: 'clamp(1.75rem,4vw,2.5rem)' }}
          >
            {error || 'Producto no encontrado'}
          </h1>
          <p className="text-lg mb-10 max-w-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            No pudimos cargar los detalles del producto. Es posible que ya no esté activo o haya un error de conexión.
          </p>
          <button
            onClick={() => navigate?.('catalog')}
            className="label-caps px-8 py-4 rounded-xl hover:opacity-90 active:scale-95"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            Ir al Catálogo
          </button>
        </main>
        <Footer />
      </div>
    );
  }

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
              onClick={() => navigate?.('catalog', product.category as FilterCategory)}
              className="transition-colors hover:underline"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              {product.category}
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span style={{ color: 'var(--color-on-surface)' }} className="font-medium">
              {product.name}
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
                  src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900';
                  }}
                />
              </div>
              <div className="absolute top-4 left-4">
                <span
                  className="label-caps px-3 py-1.5 rounded-full text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {product.category}
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
                <span className="text-sm font-semibold" style={{ color: 'var(--color-gold-muted)' }}>
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
                  {product.name}
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
                <div className="flex items-baseline gap-3 mb-4">
                  <span
                    className="text-3xl font-semibold"
                    style={{ color: 'var(--color-secondary)', fontFamily: 'Inter' }}
                  >
                    ${Number(product.price).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span
                      className="text-lg line-through"
                      style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Inter' }}
                    >
                      ${Number(product.original_price).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  )}
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
                <span>Pago contra entrega disponible · Garantía de calidad</span>
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
              {getSpecs().map(spec => (
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
            {relatedProducts.map(relProd => (
              <div
                key={relProd.id}
                className="group overflow-hidden rounded-xl cursor-pointer ambient-shadow transition-all duration-300"
                style={{ backgroundColor: 'var(--color-surface-container-low)' }}
                onClick={() => navigate?.('detail', undefined, { id: relProd.id, isCombo: relProd.isCombo })}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={relProd.image}
                    alt={relProd.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600';
                    }}
                  />
                </div>
                <div className="p-5">
                  <h3
                    className="font-display font-semibold mb-1 transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {relProd.title}
                  </h3>
                  <p
                    className="text-lg font-medium"
                    style={{ color: 'var(--color-secondary)', fontFamily: 'Inter' }}
                  >
                    ${relProd.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
            {relatedProducts.length === 0 && (
              <div className="col-span-full py-8 text-center" style={{ color: 'var(--color-on-surface-variant)' }}>
                No hay productos relacionados disponibles.
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer onAdminClick={() => navigate?.('admin-login' as any)} />
    </div>
  );
};
