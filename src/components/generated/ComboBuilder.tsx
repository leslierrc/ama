import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Plus, Minus, ShoppingCart, ChefHat } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
type Page = 'home' | 'catalog' | 'detail' | 'combo' | 'cart';
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
  items: ComboItem[];
}
const COMBO_CATEGORIES: ComboCategory[] = [{
  id: 'proteinas',
  label: 'Proteínas 🥩',
  items: [{
    id: 'pollo',
    name: 'Pollo',
    price: 1200,
    category: 'Proteínas'
  }, {
    id: 'cerdo',
    name: 'Cerdo',
    price: 800,
    category: 'Proteínas'
  }, {
    id: 'pescado',
    name: 'Pescado',
    price: 950,
    category: 'Proteínas'
  }]
}, {
  id: 'viandas',
  label: 'Viandas 🌿',
  items: [{
    id: 'boniato',
    name: 'Boniato',
    price: 120,
    category: 'Viandas'
  }, {
    id: 'platanos',
    name: 'Plátanos',
    price: 90,
    category: 'Viandas'
  }, {
    id: 'tomate',
    name: 'Tomate',
    price: 150,
    category: 'Viandas'
  }]
}, {
  id: 'granos',
  label: 'Granos 🌾',
  items: [{
    id: 'arroz',
    name: 'Arroz',
    price: 180,
    category: 'Granos'
  }, {
    id: 'frijoles',
    name: 'Frijoles',
    price: 200,
    category: 'Granos'
  }, {
    id: 'pasta',
    name: 'Pasta',
    price: 160,
    category: 'Granos'
  }]
}, {
  id: 'bebidas',
  label: 'Bebidas 🥤',
  items: [{
    id: 'jugo',
    name: 'Jugo',
    price: 180,
    category: 'Bebidas'
  }, {
    id: 'refresco',
    name: 'Refresco',
    price: 120,
    category: 'Bebidas'
  }, {
    id: 'agua',
    name: 'Agua',
    price: 60,
    category: 'Bebidas'
  }]
}];
type QuantityMap = Record<string, number>;
export const ComboBuilderScreen: React.FC<ComboBuilderScreenProps> = ({
  navigate
}) => {
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const [comboName, setComboName] = useState('');
  const { addToCart } = useCart();
  const setQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] ?? 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [id]: next
      };
    });
  };
  const allItems = COMBO_CATEGORIES.flatMap(cat => cat.items);
  const selectedItems = allItems.filter(item => (quantities[item.id] ?? 0) > 0);
  const total = selectedItems.reduce((sum, item) => sum + item.price * (quantities[item.id] ?? 0), 0);
  const itemCount = selectedItems.reduce((sum, item) => sum + (quantities[item.id] ?? 0), 0);
  return <div className="min-h-screen bg-[#020408] text-white overflow-x-hidden font-sans">
      <Navbar navigate={navigate} />

      <main className="pt-24 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <p className="text-[#FF2D55] font-bold text-sm uppercase tracking-widest mb-3">Personaliza</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Arma tu Combo Perfecto 🍳
            </h1>
            <p className="text-gray-400 mt-3 text-lg">
              Selecciona los productos que quieres y creamos un combo a tu medida.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* LEFT: Item Selectors */}
            <div className="lg:col-span-3 flex flex-col gap-8">
              {COMBO_CATEGORIES.map(cat => <div key={cat.id} className="glass rounded-3xl p-6 border border-white/10">
                  <h2 className="text-lg font-black mb-5">{cat.label}</h2>
                  <div className="flex flex-col gap-3">
                    {cat.items.map(item => {
                  const qty = quantities[item.id] ?? 0;
                  return <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                          <div>
                            <p className="font-bold text-white">{item.name}</p>
                            <p className="text-sm text-gray-400">
                              <span className="text-gray-500">CUP</span> ${item.price.toLocaleString('es-CU')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setQty(item.id, -1)} disabled={qty === 0} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-[#FF2D55] hover:text-[#FF2D55] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                <Minus size={14} />
                            </button>
                            <span className="w-6 text-center font-black text-white text-sm">{qty}</span>
                            <button onClick={() => setQty(item.id, 1)} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-[#0055FF] hover:text-[#0055FF] transition-colors">
                                <Plus size={14} />
                            </button>
                          </div>
                        </div>;
                })}
                  </div>
                </div>)}
            </div>

            {/* RIGHT: Live Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 glass rounded-3xl p-6 border border-white/10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF2D55]/10 border border-[#FF2D55]/20 flex items-center justify-center">
                    <ChefHat size={20} className="text-[#FF2D55]" />
                  </div>
                  <div>
                    <h3 className="font-black text-white">Tu Combo</h3>
                    <p className="text-gray-400 text-xs">
                      {itemCount > 0 ? `${itemCount} producto${itemCount > 1 ? 's' : ''}` : 'Aún vacío'}
                    </p>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">
                    Nombre del combo
                  </label>
                  <input type="text" value={comboName} onChange={e => setComboName(e.target.value)} placeholder="Ej: Combo del domingo..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#0055FF] transition-colors" />
                </div>

                {/* Selected Items */}
                <div className="min-h-[120px]">
                  {selectedItems.length === 0 ? <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-4xl mb-3">🛒</p>
                      <p className="text-gray-500 text-sm">Agrega productos para ver tu combo aquí</p>
                    </div> : <div className="flex flex-col gap-2">
                      {selectedItems.map(item => <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">
                            <span className="text-white font-bold">{quantities[item.id]}×</span> {item.name}
                          </span>
                          <span className="text-gray-400">
                            ${(item.price * (quantities[item.id] ?? 0)).toLocaleString('es-CU')}
                          </span>
                        </div>)}
                    </div>}
                </div>

                {/* Divider */}
                <div className="border-t border-white/10" />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Total estimado</span>
                  <span className="text-2xl font-black text-white">
                    <span className="text-sm text-gray-400 font-medium mr-1">CUP</span>
                    ${total.toLocaleString('es-CU')}
                  </span>
                </div>

                {/* CTA */}
                <button onClick={() => {
                  const customId = `combo-custom-${Date.now()}`;
                  const customItemsDetail = selectedItems.map(item => ({
                    name: item.name,
                    quantity: quantities[item.id],
                    price: item.price
                  }));
                  addToCart({
                    id: customId,
                    title: comboName.trim() || 'Combo Personalizado',
                    price: total,
                    image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400',
                    category: 'Combo Personalizado',
                    isCombo: true,
                    comboItems: customItemsDetail
                  });
                  navigate?.('cart');
                }} disabled={selectedItems.length === 0} className="w-full flex items-center justify-center gap-2 py-4 bg-[#0055FF] text-white rounded-xl font-black text-base hover:bg-[#0044CC] transition-colors shadow-[0_0_20px_rgba(0,85,255,0.35)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
                  <ShoppingCart size={20} />
                  <span>Agregar Combo al Carrito</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
};