import React, { useState } from 'react';
import { ShoppingCart, Menu, X, Search } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
type Page = 'home' | 'catalog' | 'detail' | 'combo' | 'cart';
interface NavbarProps {
  navigate?: (page: Page, filter?: any) => void;
}
export const Navbar: React.FC<NavbarProps> = ({
  navigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { cartCount } = useCart();
  const go = (page: Page, filter?: any) => {
    setIsOpen(false);
    navigate?.(page, filter);
  };
  return <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-4 md:px-8 py-4 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-1 text-2xl font-black tracking-tighter cursor-pointer" onClick={() => go('home')}>
          <span className="text-white">A</span>
          <span className="text-[#0055FF]">M</span>
          <span className="text-[#FF2D55]">A</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <button onClick={() => go('catalog', 'Mercado')} className="hover:text-white transition-colors cursor-pointer">Mercado</button>
          <button onClick={() => go('catalog', 'Combos')} className="hover:text-white transition-colors cursor-pointer">Combos</button>
          <button onClick={() => go('catalog', 'Electrodomésticos')} className="hover:text-white transition-colors cursor-pointer">Electrodomésticos</button>
          <button onClick={() => go('combo')} className="hover:text-white transition-colors cursor-pointer">Arma tu Combo</button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          <button className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block">
            <Search size={20} />
          </button>

          <div className="relative cursor-pointer group" onClick={() => go('cart')}>
            <ShoppingCart size={24} className="text-white group-hover:text-[#0055FF] transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#FF2D55] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-red-500/20">
                {cartCount}
              </span>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && <div className="md:hidden absolute top-full left-0 right-0 bg-[#0B1120] border-b border-white/10 p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4">
          <button className="text-lg font-medium text-white text-left cursor-pointer" onClick={() => go('catalog', 'Mercado')}>Mercado</button>
          <button className="text-lg font-medium text-white text-left cursor-pointer" onClick={() => go('catalog', 'Combos')}>Combos</button>
          <button className="text-lg font-medium text-white text-left cursor-pointer" onClick={() => go('catalog', 'Electrodomésticos')}>Electrodomésticos</button>
          <button className="text-lg font-medium text-white text-left cursor-pointer" onClick={() => go('combo')}>Arma tu Combo</button>
        </div>}
    </nav>;
};