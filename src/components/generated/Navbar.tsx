import React, { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { AmaLogo } from './AmaLogo';
import type { Page } from '../../App';

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

  const go = (page: Page, filter?: string) => {
    setIsOpen(false);
    navigate?.(page, filter as any);
  };

  const navLinks = [
    { label: 'Mercado',          action: () => go('catalog', 'Mercado') },
    { label: 'Electrodomésticos', action: () => go('catalog', 'Electrodomésticos') },
    { label: 'Armar Combo',       action: () => go('combo') },
  ];

  const isActive = (label: string) => {
    if (label === 'Armar Combo') return activePage === 'combo';
    return activePage === 'catalog';
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-sm' : ''}`}
      style={{ backgroundColor: 'rgba(253,249,233,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-[1280px] mx-auto flex justify-between items-center px-5 md:px-16 py-4">

        {/* Logo */}
        <button
          onClick={() => go('home')}
      className="font-display flex text-2xl font-bold tracking-tighter"
          style={{ color: 'var(--color-emerald-deep)' }}
        >
          <p style={{color: 'black' }}>A</p>
          <p style={{color: 'blue' }}>M</p>
          <p style={{color: 'red' }}>A</p>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={link.action}
              className="label-caps transition-all duration-200 relative"
              style={{
                color: isActive(link.label) ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                opacity: isActive(link.label) ? 1 : 0.75,
              }}
              onMouseEnter={e => {
                if (!isActive(link.label)) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)';
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                }
              }}
              onMouseLeave={e => {
                if (!isActive(link.label)) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-on-surface-variant)';
                  (e.currentTarget as HTMLElement).style.opacity = '0.75';
                }
              }}
            >
              {link.label}
              {/* Active underline */}
              {isActive(link.label) && (
                <span
                  className="absolute -bottom-1 left-0 right-0 h-px rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4 md:gap-5">
          {/* Search */}
          <button
            className="transition-colors duration-200 hidden sm:flex"
            style={{ color: 'var(--color-on-surface-variant)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}
            aria-label="Buscar"
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>

          {/* Cart */}
          <button
            className="relative transition-colors duration-200"
            style={{ color: 'var(--color-on-surface-variant)' }}
            onClick={() => go('cart')}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}
            aria-label="Carrito"
          >
            <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
            {cartCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold"
                style={{ backgroundColor: 'var(--color-secondary)' }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden transition-colors duration-200"
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
          className="md:hidden border-t px-5 py-6 flex flex-col gap-1"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-variant)' }}
        >
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={link.action}
              className="label-caps text-left py-3 px-2 rounded-xl transition-all"
              style={{
                color: isActive(link.label) ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                backgroundColor: isActive(link.label) ? 'rgba(0,53,39,0.06)' : 'transparent',
              }}
            >
              {link.label}
            </button>
          ))}
          {/* Divider */}
          <div className="h-px my-2" style={{ backgroundColor: 'var(--color-surface-variant)' }} />
          {/* Cart shortcut on mobile */}
          <button
            onClick={() => go('cart')}
            className="label-caps text-left py-3 px-2 rounded-xl flex items-center gap-2 transition-all"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
            Carrito
            {cartCount > 0 && (
              <span
                className="text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold"
                style={{ backgroundColor: 'var(--color-secondary)' }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      )}
    </header>
  );
};
