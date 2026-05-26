import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { DeliveryTicker } from './DeliveryTicker';
import { Footer } from './Footer';
import { SlidersHorizontal } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
type Page = 'home' | 'catalog' | 'detail' | 'combo' | 'cart';
type FilterCategory = 'Todos' | 'Mercado' | 'Combos' | 'Electrodomésticos';

interface ProductCatalogProps {
  navigate?: (page: Page, filter?: FilterCategory) => void;
  activeFilter?: FilterCategory;
  setActiveFilter?: (filter: FilterCategory) => void;
}

interface CatalogProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  category: FilterCategory;
}

const ALL_PRODUCTS: CatalogProduct[] = [
  // --- MERCADO (Productos Variados) ---
  {
    id: 'aceite',
    title: 'Aceite de Girasol 1L',
    price: 750,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400',
    category: 'Mercado'
  },
  {
    id: 'arroz',
    title: 'Arroz Super Premium 5kg',
    price: 950,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
    category: 'Mercado'
  },
  {
    id: 'cafe',
    title: 'Café Cubita Molido 250g',
    price: 800,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=400',
    category: 'Mercado'
  },
  {
    id: 'leche-polvo',
    title: 'Leche en Polvo 1kg',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?auto=format&fit=crop&q=80&w=400',
    category: 'Mercado'
  },
  {
    id: 'frijoles',
    title: 'Frijoles Negros 1kg',
    price: 450,
    image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&q=80&w=400',
    category: 'Mercado'
  },
  {
    id: 'harina-trigo',
    title: 'Harina de Trigo 1kg',
    price: 300,
    image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=400',
    category: 'Mercado'
  },
  {
    id: 'detergente',
    title: 'Detergente Líquido 1L',
    price: 650,
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=400',
    category: 'Mercado'
  },
  {
    id: 'pasta-dental',
    title: 'Pasta Dental Colgate',
    price: 350,
    image: 'https://images.unsplash.com/photo-1559599189-fe84dea4eb79?auto=format&fit=crop&q=80&w=400',
    category: 'Mercado'
  },

  // --- COMBOS (Combos de Comida) ---
  {
    id: 'combo-carnico',
    title: 'Combo Cárnico Familiar',
    price: 7500,
    image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=400',
    category: 'Combos'
  },
  {
    id: 'combo-vegetales',
    title: 'Combo Vegetales Frescos',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=400',
    category: 'Combos'
  },
  {
    id: 'combo-familiar-premium',
    title: 'Combo Familiar Deluxe',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
    category: 'Combos'
  },
  {
    id: 'combo-desayuno-completo',
    title: 'Combo Desayuno Completo',
    price: 2400,
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=400',
    category: 'Combos'
  },
  {
    id: 'combo-aseo',
    title: 'Combo de Aseo Diario',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400',
    category: 'Combos'
  },

  // --- ELECTRODOMÉSTICOS ---
  {
    id: 'split',
    title: 'Split 1 Ton Inverter',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=400',
    category: 'Electrodomésticos'
  },
  {
    id: 'freidora',
    title: 'Freidora de Aire 5.5L',
    price: 14000,
    image: 'https://images.unsplash.com/photo-1648169668764-0e29a2a75b28?auto=format&fit=crop&q=80&w=400',
    category: 'Electrodomésticos'
  },
  {
    id: 'refrigerador',
    title: 'Refrigerador Semiautomático',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&q=80&w=400',
    category: 'Electrodomésticos'
  },
  {
    id: 'batidora',
    title: 'Batidora de Vaso',
    price: 6500,
    image: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&q=80&w=400',
    category: 'Electrodomésticos'
  },
  {
    id: 'olla-reina',
    title: 'Olla Reina Multiuso',
    price: 9800,
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=400',
    category: 'Electrodomésticos'
  },
  {
    id: 'microondas',
    title: 'Microondas Digital 20L',
    price: 15500,
    image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=400',
    category: 'Electrodomésticos'
  }
];

const FILTER_PILLS: FilterCategory[] = ['Todos', 'Mercado', 'Combos', 'Electrodomésticos'];

const containerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07
    }
  }
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 24
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35
    }
  }
};

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  navigate,
  activeFilter: propActiveFilter,
  setActiveFilter: propSetActiveFilter
}) => {
  const [localActiveFilter, setLocalActiveFilter] = useState<FilterCategory>('Todos');
  const activeFilter = propActiveFilter ?? localActiveFilter;
  const setActiveFilter = (filter: FilterCategory) => {
    if (propSetActiveFilter) {
      propSetActiveFilter(filter);
    } else {
      setLocalActiveFilter(filter);
    }
  };

  const { addToCart } = useCart();
  const filtered = activeFilter === 'Todos' ? ALL_PRODUCTS : ALL_PRODUCTS.filter(p => p.category === activeFilter);

  return <div className="min-h-screen bg-[#020408] text-white overflow-x-hidden font-sans">
      <Navbar navigate={navigate} />

      <main className="pt-20">
        <DeliveryTicker />

        {/* Header */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[#0055FF] font-bold text-sm uppercase tracking-widest mb-3">Catálogo</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                Todo lo que <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">necesitas</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm glass px-4 py-2 rounded-xl border border-white/10">
              <SlidersHorizontal size={16} />
              <span>{filtered.length} productos</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-3 mt-10 flex-wrap">
            {FILTER_PILLS.map(pill => <button key={pill} onClick={() => setActiveFilter(pill)} className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-200 border ${activeFilter === pill ? 'bg-[#0055FF] border-[#0055FF] text-white shadow-[0_0_16px_rgba(0,85,255,0.4)]' : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:text-white'}`}>
                {pill}
              </button>)}
          </div>
        </section>

        {/* Products Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <motion.div key={activeFilter} variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(product => <motion.div key={product.id} variants={cardVariants} className="group relative glass rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,85,255,0.15)] hover:-translate-y-1" onClick={() => navigate?.('detail')}>
                <div className="aspect-video w-full overflow-hidden">
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="p-5">
                  <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/10 mb-3">
                    {product.category}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#0055FF] transition-colors mb-3">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-white">
                      <span className="text-sm font-medium text-gray-400 mr-1">CUP</span>
                      ${product.price.toLocaleString('es-CU')}
                    </span>
                    <button onClick={e => {
                  e.stopPropagation();
                  addToCart({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.image,
                    category: product.category
                  });
                  navigate?.('cart');
                }} className="px-4 py-2 bg-[#0055FF] text-white rounded-xl font-bold text-sm hover:bg-[#0044CC] transition-colors">
                      Añadir
                    </button>
                  </div>
                </div>
              </motion.div>)}
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>;
};