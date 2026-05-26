import React from 'react';
import { Navbar } from './Navbar';
import { DeliveryTicker } from './DeliveryTicker';
import { ProductCard } from './ProductCard';
import { Footer } from './Footer';
import { ShoppingBag, Package, Zap, ArrowRight } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
type Page = 'home' | 'catalog' | 'detail' | 'combo' | 'cart';
interface HomeScreenProps {
  navigate?: (page: Page, filter?: any) => void;
}
const FEATURED_PRODUCTS = [{
  id: 'combo-familiar-home', // Unique ID matching the combo family
  title: 'Combo Familiar',
  price: 2500,
  image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
  category: 'Combo'
}, {
  id: 'combo-desayuno',
  title: 'Combo Desayuno',
  price: 800,
  image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=400',
  category: 'Combo'
}, {
  id: 'combo-carnico',
  title: 'Combo Cárnico',
  price: 3200,
  image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=400',
  category: 'Combo'
}, {
  id: 'combo-vegetales',
  title: 'Combo Vegetales',
  price: 1200,
  image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=400',
  category: 'Combo'
}];
interface CategoryCardData {
  title: string;
  description: string;
  iconType: 'bag' | 'package' | 'zap';
  gradient: string;
  page: Page;
}
const CATEGORY_CARDS: CategoryCardData[] = [{
  title: 'Mercado',
  description: 'Víveres, aceite, arroz y más',
  iconType: 'bag',
  gradient: 'from-[#0055FF]/10 to-transparent',
  page: 'catalog'
}, {
  title: 'Combos',
  description: 'Combos listos y arma el tuyo',
  iconType: 'package',
  gradient: 'from-[#FF2D55]/10 to-transparent',
  page: 'combo'
}, {
  title: 'Electrodomésticos',
  description: 'Splits, neveras, freidoras',
  iconType: 'zap',
  gradient: 'from-white/10 to-transparent',
  page: 'catalog'
}];
export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigate
}) => {
  const { addToCart } = useCart();
  return <div className="min-h-screen bg-[#020408] text-white overflow-x-hidden font-sans">
      <Navbar navigate={navigate} />

      <main className="pt-20">
        <DeliveryTicker />

        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-32 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#0055FF]/30 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#FF2D55]/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
              AMA: Lo mejor de <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400">
                La Habana a tu puerta
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium">
              Mercado, combos y electrodomésticos. Entrega en 24 horas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigate?.('catalog', 'Combos')} className="w-full sm:w-auto px-8 py-4 bg-[#0055FF] text-white rounded-xl font-bold text-lg hover:bg-[#0044CC] transition-colors shadow-[0_0_20px_rgba(0,85,255,0.4)] hover:shadow-[0_0_30px_rgba(0,85,255,0.6)] cursor-pointer">
                Ver Combos
              </button>
              <button onClick={() => navigate?.('catalog', 'Todos')} className="w-full sm:w-auto px-8 py-4 bg-transparent text-white border-2 border-white/20 rounded-xl font-bold text-lg hover:bg-white/5 hover:border-white/40 transition-colors cursor-pointer">
                Ver Catálogo
              </button>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORY_CARDS.map(card => <div key={card.title} className="group relative glass rounded-3xl p-8 overflow-hidden transition-transform duration-300 hover:-translate-y-2 cursor-pointer" onClick={() => {
              if (card.title === 'Mercado') {
                navigate?.('catalog', 'Mercado');
              } else if (card.title === 'Electrodomésticos') {
                navigate?.('catalog', 'Electrodomésticos');
              } else {
                navigate?.(card.page);
              }
            }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`} />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:border-white/20 transition-colors">
                    {card.iconType === 'bag' && <ShoppingBag size={32} className="text-[#0055FF]" />}
                    {card.iconType === 'package' && <Package size={32} className="text-[#FF2D55]" />}
                    {card.iconType === 'zap' && <Zap size={32} className="text-white" />}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                  <p className="text-gray-400 font-medium mb-8">{card.description}</p>
                  <div className="flex items-center gap-2 text-white/70 group-hover:text-white font-bold transition-colors">
                    <span>Explorar</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>)}
          </div>
        </section>

        {/* Featured Combos */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Combos más vendidos</h2>
            <button onClick={() => navigate?.('catalog', 'Combos')} className="hidden sm:flex items-center gap-2 text-[#0055FF] font-bold hover:text-[#0044CC] transition-colors cursor-pointer">
              <span>Ver todos</span>
              <ArrowRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_PRODUCTS.map(product => <ProductCard key={product.id} id={product.id} title={product.title} price={product.price} image={product.image} category={product.category} onAdd={() => {
              addToCart({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                category: product.category
              });
              navigate?.('cart');
            }} />)}
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};