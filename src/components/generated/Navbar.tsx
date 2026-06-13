import React, { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';

type Page = 'home' | 'catalog' | 'detail' | 'combo' | 'cart';
interface NavbarProps {
  navigate?: (page: Page, filter?: any) => void;
  activePage?: Page;
}

export const Navbar: React.FC<NavbarProps> = ({ navigate, activePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (page: Page, filter?: any) => {
    setIsOpen(false);
    navigate?.(page, filter);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-sm' : ''
      }`}
      style={{ backgroundColor: 'rgba(253,249,233,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-[1280px] mx-auto flex justify-between items-center px-5 md:px-16 py-4">
        {/* Logo */}
        <button
          onClick={() => go('home')}
          className="font-display text-2xl font-bold tracking-tighter"
          style={{ color: 'var(--color-emerald-deep)' }}
        >
          AMA
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => go('catalog', 'Todos')}
            className="label-caps transition-colors duration-300"
            style={{
              color: activePage === 'catalog' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              borderBottom: activePage === 'catalog' ? '1px solid var(--color-primary)' : 'none',
              paddingBottom: activePage === 'catalog' ? '4px' : '0',
              opacity: activePage === 'catalog' ? 1 : 0.8,
            }}
          >
            Market
          </button>
          <button
            onClick={() => go('catalog', 'Electrodomésticos')}
            className="label-caps transition-colors duration-300"
            style={{
              color: 'var(--color-on-surface-variant)',
              opacity: 0.8,
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.color = 'var(--color-secondary)';
              (e.target as HTMLElement).style.opacity = '1';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.color = 'var(--color-on-surface-variant)';
              (e.target as HTMLElement).style.opacity = '0.8';
            }}
          >
            Appliances
          </button>
          <button
            onClick={() => go('home')}
            className="label-caps transition-colors duration-300"
            style={{ color: 'var(--color-on-surface-variant)', opacity: 0.8 }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.color = 'var(--color-secondary)';
              (e.target as HTMLElement).style.opacity = '1';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.color = 'var(--color-on-surface-variant)';
              (e.target as HTMLElement).style.opacity = '0.8';
            }}
          >
            About
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-5 md:gap-6">
          <button
            className="transition-colors duration-300"
            style={{ color: 'var(--color-primary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-primary)')}
            aria-label="Buscar"
          >
            <span className="material-symbols-outlined">search</span>
          </button>

          <button
            className="relative transition-colors duration-300"
            style={{ color: 'var(--color-primary)' }}
            onClick={() => go('cart')}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-primary)')}
            aria-label="Carrito"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartCount > 0 && (
              <span
                className="absolute -top-2 -right-2 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold"
                style={{ backgroundColor: 'var(--color-secondary)' }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* Mobile menu button */}
          <button
            className="md:hidden transition-colors duration-300"
            style={{ color: 'var(--color-primary)' }}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menú"
          >
            <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="md:hidden border-t px-5 py-6 flex flex-col gap-6"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-surface-variant)',
          }}
        >
          <button
            className="label-caps text-left transition-colors"
            style={{ color: 'var(--color-primary)' }}
            onClick={() => go('catalog', 'Todos')}
          >
            Market
          </button>
          <button
            className="label-caps text-left transition-colors"
            style={{ color: 'var(--color-on-surface-variant)' }}
            onClick={() => go('catalog', 'Electrodomésticos')}
          >
            Appliances
          </button>
          <button
            className="label-caps text-left transition-colors"
            style={{ color: 'var(--color-on-surface-variant)' }}
            onClick={() => go('home')}
          >
            About
          </button>
          <button
            className="label-caps text-left transition-colors"
            style={{ color: 'var(--color-on-surface-variant)' }}
            onClick={() => go('combo')}
          >
            Arma tu Combo
          </button>
        </div>
      )}
    </header>
  );
};
