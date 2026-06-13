import { useState, Suspense, lazy } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { HomeScreen } from '@/components/generated/HomeScreen';
import { ProductCatalog } from '@/components/generated/ProductCatalog';
import { ProductDetailPage } from '@/components/generated/ProductDetailPage';
import { ComboBuilderScreen } from '@/components/generated/ComboBuilder';
import { ShoppingCart } from '@/components/generated/ShoppingCart';
import { CartProvider } from '@/hooks/useCart';
import { WhatsAppButton } from '@/components/generated/WhatsAppButton';

const AdminLogin = lazy(() =>
  import('@/components/admin/AdminLogin').then(m => ({ default: m.AdminLogin }))
);
const AdminDashboard = lazy(() =>
  import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);

export type Page = 'home' | 'catalog' | 'detail' | 'combo' | 'cart' | 'admin-login' | 'admin';
export type FilterCategory = 'Todos' | 'Mercado' | 'Combos' | 'Electrodomésticos';

document.documentElement.classList.remove('dark');
document.documentElement.classList.add('light');

// PayPal Client ID — se lee del .env
// Sandbox IDs empiezan con: AZ... o AU...
// Live IDs empiezan con:    AZ... también — el entorno lo determina PayPal internamente
// Si ves sandbox.paypal.com en la red, el Client ID es de Sandbox aunque diga "live"
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;

function AdminLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9e9' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#003527', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: '#404944' }}>Cargando panel…</p>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [catalogFilter, setCatalogFilter] = useState<FilterCategory>('Todos');

  const navigate = (page: Page, filter?: FilterCategory) => {
    setCurrentPage(page);
    if (filter) setCatalogFilter(filter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminPage = currentPage === 'admin-login' || currentPage === 'admin';

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID || 'test',
        currency: 'USD',
        intent: 'capture',
        components: 'buttons',
        // No pongas enableFunding ni disableFunding aquí — deja que PayPal decida
      }}
    >
      <CartProvider>
        <>
          {currentPage === 'home'    && <HomeScreen navigate={navigate} />}
          {currentPage === 'catalog' && (
            <ProductCatalog navigate={navigate} activeFilter={catalogFilter} setActiveFilter={setCatalogFilter} />
          )}
          {currentPage === 'detail'  && <ProductDetailPage navigate={navigate} />}
          {currentPage === 'combo'   && <ComboBuilderScreen navigate={navigate} />}
          {currentPage === 'cart'    && <ShoppingCart navigate={navigate} />}

          {currentPage === 'admin-login' && (
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminLogin onLogin={() => navigate('admin')} onBack={() => navigate('home')} />
            </Suspense>
          )}
          {currentPage === 'admin' && (
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminDashboard onLogout={() => navigate('home')} />
            </Suspense>
          )}

          {!isAdminPage && <WhatsAppButton />}
        </>
      </CartProvider>
    </PayPalScriptProvider>
  );
}
