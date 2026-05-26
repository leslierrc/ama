import { useState } from 'react';
import { HomeScreen } from './components/generated/HomeScreen';
import { ProductCatalog } from './components/generated/ProductCatalog';
import { ProductDetailPage } from './components/generated/ProductDetailPage';
import { ComboBuilderScreen } from './components/generated/ComboBuilder';
import { ShoppingCart } from './components/generated/ShoppingCart';
import { CartProvider } from './hooks/useCart';

export type Page = 'home' | 'catalog' | 'detail' | 'combo' | 'cart';

export default function App() {
  document.documentElement.classList.add('dark');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [catalogFilter, setCatalogFilter] = useState<'Todos' | 'Mercado' | 'Combos' | 'Electrodomésticos'>('Todos');

  const navigate = (page: Page, filter?: 'Todos' | 'Mercado' | 'Combos' | 'Electrodomésticos') => {
    setCurrentPage(page);
    if (filter) {
      setCatalogFilter(filter);
    }
    window.scrollTo(0, 0);
  };

  return (
    <CartProvider>
      <div>
        {currentPage === 'home' && <HomeScreen navigate={navigate} />}
        {currentPage === 'catalog' && (
          <ProductCatalog 
            navigate={navigate} 
            activeFilter={catalogFilter} 
            setActiveFilter={setCatalogFilter} 
          />
        )}
        {currentPage === 'detail' && <ProductDetailPage navigate={navigate} />}
        {currentPage === 'combo' && <ComboBuilderScreen navigate={navigate} />}
        {currentPage === 'cart' && <ShoppingCart navigate={navigate} />}
      </div>
    </CartProvider>
  );
}

