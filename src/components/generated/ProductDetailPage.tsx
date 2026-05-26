import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Star, CheckCircle2, Truck, ShieldCheck, ChevronRight, ShoppingCart, Zap } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
type Page = 'home' | 'catalog' | 'detail' | 'combo' | 'cart';
interface ProductDetailPageProps {
  navigate?: (page: Page) => void;
}
interface SpecItem {
  id: string;
  label: string;
  value: string;
}
interface RelatedProduct {
  id: string;
  title: string;
  price: number;
  image: string;
}
const SPECS: SpecItem[] = [{
  id: 'btu',
  label: 'Capacidad',
  value: '12,000 BTU'
}, {
  id: 'voltage',
  label: 'Voltaje',
  value: '220V'
}, {
  id: 'power',
  label: 'Consumo',
  value: '900W'
}, {
  id: 'warranty',
  label: 'Garantía',
  value: '1 año'
}, {
  id: 'type',
  label: 'Tipo',
  value: 'Inverter'
}, {
  id: 'coverage',
  label: 'Cobertura',
  value: 'Hasta 25 m²'
}];
const RELATED_PRODUCTS: RelatedProduct[] = [{
  id: 'freidora',
  title: 'Freidora de Aire',
  price: 12000,
  image: 'https://images.unsplash.com/photo-1648169668764-0e29a2a75b28?auto=format&fit=crop&q=80&w=400'
}, {
  id: 'refrigerador',
  title: 'Refrigerador',
  price: 38000,
  image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&q=80&w=400'
}, {
  id: 'ventilador',
  title: 'Ventilador de Torre',
  price: 4500,
  image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=400'
}];
export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  navigate
}) => {
  const { addToCart } = useCart();
  return <div className="min-h-screen bg-[#020408] text-white overflow-x-hidden font-sans">
      <Navbar navigate={navigate} />

      <main className="pt-24">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <button onClick={() => navigate?.('home')} className="hover:text-white transition-colors">
              Inicio
            </button>
            <ChevronRight size={14} className="text-gray-600" />
            <button onClick={() => navigate?.('catalog')} className="hover:text-white transition-colors">
              Electrodomésticos
            </button>
            <ChevronRight size={14} className="text-gray-600" />
            <span className="text-white font-medium">Split 1 Ton Inverter</span>
          </nav>
        </div>

        {/* Main Product Section */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Image */}
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden glass border border-white/10">
                <img src="https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=800" alt="Split Inverter 1 Tonelada" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 bg-[#0055FF] text-white text-xs font-black uppercase tracking-wider rounded-full shadow-[0_0_16px_rgba(0,85,255,0.5)]">
                  Electrodoméstico
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} size={16} className={star <= 5 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />)}
                  </div>
                  <span className="text-yellow-400 font-bold text-sm">4.9</span>
                  <span className="text-gray-500 text-sm">(128 reseñas)</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Split Inverter<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0055FF] to-white">1 Tonelada</span>
                </h1>
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span className="text-emerald-400 font-bold text-sm">En stock — Entrega en 24h</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">CUP $45,000</span>
                </div>
              </div>

              {/* Delivery Note */}
              <div className="glass rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                <Truck size={22} className="text-[#0055FF] shrink-0" />
                <p className="text-sm text-gray-300">
                  <span className="text-white font-bold">Entrega gratis en La Habana</span> en menos de 24 horas
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => {
                  addToCart({
                    id: 'split',
                    title: 'Split 1 Ton Inverter',
                    price: 45000,
                    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=300',
                    category: 'Electrodoméstico'
                  });
                  navigate?.('cart');
                }} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#0055FF] text-white rounded-xl font-black text-lg hover:bg-[#0044CC] transition-colors shadow-[0_0_20px_rgba(0,85,255,0.4)] hover:shadow-[0_0_30px_rgba(0,85,255,0.6)]">
                  <ShoppingCart size={20} />
                  <span>Agregar al Carrito</span>
                </button>
                <button onClick={() => {
                  addToCart({
                    id: 'split',
                    title: 'Split 1 Ton Inverter',
                    price: 45000,
                    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=300',
                    category: 'Electrodoméstico'
                  });
                  navigate?.('cart');
                }} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#FF2D55] text-white rounded-xl font-black text-lg hover:bg-[#e02249] transition-colors shadow-[0_0_20px_rgba(255,45,85,0.35)] hover:shadow-[0_0_30px_rgba(255,45,85,0.55)]">
                  <Zap size={20} />
                  <span>Comprar Ahora</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck size={14} />
                <span>Pago contra entrega disponible · Garantía de 1 año</span>
              </div>
            </div>
          </div>
        </section>

        {/* Specs */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <h2 className="text-2xl font-black mb-6">Especificaciones técnicas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {SPECS.map(spec => <div key={spec.id} className="glass rounded-2xl p-5 border border-white/10">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-1">{spec.label}</p>
                <p className="text-white font-black text-lg">{spec.value}</p>
              </div>)}
          </div>
        </section>

        {/* Related Products */}
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <h2 className="text-2xl font-black mb-8">Productos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {RELATED_PRODUCTS.map(product => <div key={product.id} className="group glass rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_24px_rgba(0,85,255,0.15)]" onClick={() => navigate?.('detail')}>
                <div className="aspect-video overflow-hidden">
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-white group-hover:text-[#0055FF] transition-colors mb-1">
                    {product.title}
                  </h3>
                  <p className="text-lg font-black">
                    <span className="text-gray-400 text-sm font-medium mr-1">CUP</span>
                    ${product.price.toLocaleString('es-CU')}
                  </p>
                </div>
              </div>)}
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};