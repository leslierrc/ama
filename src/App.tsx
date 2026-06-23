import { useState, useEffect, Suspense, lazy } from 'react';
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

export type Page = 'home' | 'catalog' | 'detail' | 'combo' | 'cart' | 'admin-login' | 'admin' | 'payment-success' | 'payment-failed';
export type FilterCategory = 'Todos' | 'Mercado' | 'Combos' | 'Electrodomésticos';

document.documentElement.classList.remove('dark');
document.documentElement.classList.add('light');

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

function PaymentResultScreen({
  success, orderId, onBack,
}: { success: boolean; orderId: string | null; onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: '#F7F3EC', color: '#1C3A2F' }}>
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 text-5xl`}
        style={{ backgroundColor: success ? 'rgba(16,185,129,0.12)' : 'rgba(186,26,26,0.1)' }}>
        {success ? '✅' : '❌'}
      </div>
      <h1 className="font-display font-bold mb-3 leading-tight"
        style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)' }}>
        {success ? '¡Pago completado!' : 'Pago no procesado'}
      </h1>
      {orderId && (
        <p className="text-sm font-mono mb-2" style={{ color: '#9b4500' }}>
          Pedido #{orderId}
        </p>
      )}
      <p className="text-base max-w-md mb-10 leading-relaxed" style={{ color: '#404944' }}>
        {success
          ? 'Tu pago fue procesado por TropiPay. Tu pedido está confirmado y lo recibirás en menos de 24 horas. 🌿'
          : 'Hubo un problema al procesar el pago. Puedes intentarlo de nuevo o usar el pago por WhatsApp.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={onBack}
          className="px-8 py-4 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#1C3A2F', color: 'white' }}>
          {success ? 'Volver al inicio' : 'Reintentar pedido'}
        </button>
        {success && (
          <a href={`https://wa.me/5355542936`} target="_blank" rel="noopener noreferrer"
            className="px-8 py-4 rounded-xl font-bold transition-all active:scale-95"
            style={{ backgroundColor: '#25D366', color: 'white' }}>
            Confirmar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [catalogFilter, setCatalogFilter] = useState<FilterCategory>('Todos');
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; isCombo: boolean } | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);

  // Detecta el redirect de TropiPay: /?payment=success&order=AMA-XXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment');
    const order  = params.get('order');
    if (status === 'success' || status === 'failed') {
      setPaymentOrderId(order);
      setCurrentPage(status === 'success' ? 'payment-success' : 'payment-failed');
      // Limpiar la URL sin recargar
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const navigate = (
    page: Page,
    filter?: FilterCategory,
    productInfo?: { id: string; isCombo: boolean }
  ) => {
    setCurrentPage(page);
    if (filter) setCatalogFilter(filter);
    if (productInfo) setSelectedProduct(productInfo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminPage = currentPage === 'admin-login' || currentPage === 'admin';

  return (
    <CartProvider>
      <>
        {currentPage === 'home'    && <HomeScreen navigate={navigate} />}
        {currentPage === 'catalog' && (
          <ProductCatalog navigate={navigate} activeFilter={catalogFilter} setActiveFilter={setCatalogFilter} />
        )}
        {currentPage === 'detail'  && (
          <ProductDetailPage navigate={navigate} selectedProduct={selectedProduct} />
        )}
        {currentPage === 'combo'   && <ComboBuilderScreen navigate={navigate} />}
        {currentPage === 'cart'    && <ShoppingCart navigate={navigate} />}

        {currentPage === 'payment-success' && (
          <PaymentResultScreen
            success={true}
            orderId={paymentOrderId}
            onBack={() => navigate('home')}
          />
        )}
        {currentPage === 'payment-failed' && (
          <PaymentResultScreen
            success={false}
            orderId={paymentOrderId}
            onBack={() => navigate('cart')}
          />
        )}

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
  );
}
