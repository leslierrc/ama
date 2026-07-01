import { useState, useEffect, Suspense, lazy } from 'react';
import { HomeScreen } from '@/components/generated/HomeScreen';
import { ProductCatalog } from '@/components/generated/ProductCatalog';
import { ProductDetailPage } from '@/components/generated/ProductDetailPage';
import { ComboBuilderScreen } from '@/components/generated/ComboBuilder';
import { ShoppingCart } from '@/components/generated/ShoppingCart';
import { CartProvider } from '@/hooks/useCart';
import { WhatsAppButton } from '@/components/generated/WhatsAppButton';
import { supabase } from '@/lib/supabase';

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

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5351365501';

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
  const [waUrl, setWaUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!success || !orderId) return;

    const raw = localStorage.getItem('ama_pending_tropipay_order');
    if (!raw) return;

    let order: {
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      notes: string;
      gpsLat: number;
      gpsLng: number;
      total: number;
      items: { title: string; quantity: number; price: number; isCombo?: boolean; comboItems?: { quantity: number; name: string }[] }[];
    };
    try { order = JSON.parse(raw); } catch { return; }

    // Solo procesar si el orderNumber coincide
    if (order.orderNumber !== orderId) return;

    const run = async () => {
      setUpdating(true);
      try {
        // 1. Actualizar el pedido a 'paid' en Supabase
        await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('order_number', orderId);
      } catch (e) {
        console.warn('[payment-success] DB update error:', e);
      } finally {
        setUpdating(false);
      }

      // 2. Construir mensaje de WhatsApp con todos los detalles
      const dateStr = new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
      const fmtNum = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const itemsText = (order.items || []).map((item) => {
        let t = `📦 *${item.quantity}x ${item.title}* — $${fmtNum(item.price * item.quantity)}`;
        if (item.isCombo && item.comboItems?.length) {
          t += '\n' + item.comboItems.map((ci) => `   🔹 ${ci.quantity}× ${ci.name}`).join('\n');
        }
        return t;
      }).join('\n\n');
      const gpsLink = order.gpsLat && order.gpsLng
        ? `https://www.google.com/maps/place/${order.gpsLat},${order.gpsLng}`
        : null;

      const msg = [
        `✅ *PAGO COMPLETADO — AMA Store* ✅`,
        '',
        `🌿 Hola AMA, este pedido *ya fue pagado* por TropiPay 💳`,
        `Aquí dejo los detalles:`,
        '',
        `📋 *Pedido:* #${orderId}`,
        `📆 *Fecha:* ${dateStr}`,
        '──────────────────────',
        `👤 *Cliente:* ${order.customerName}`,
        `📞 *Teléfono:* ${order.customerPhone}`,
        `📍 *Dirección:* ${order.customerAddress}`,
        gpsLink ? `🧭 *Ubicación:* ${gpsLink}` : null,
        order.notes ? `📝 *Notas:* ${order.notes}` : null,
        `💳 *Pago:* TropiPay ✅ PAGADO`,
        '──────────────────────',
        '🛒 *PRODUCTOS:*',
        itemsText,
        '──────────────────────',
        `💰 *TOTAL PAGADO:* *${fmtNum(order.total)}*`,
        '──────────────────────',
        '🚀 ¡Por favor coordinar la entrega! Entrega en 24h 🌿',
      ].filter(Boolean).join('\n');

      setWaUrl(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`);

      // 3. Limpiar localStorage
      localStorage.removeItem('ama_pending_tropipay_order');
    };

    run();
  }, [success, orderId]);

  if (!success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ backgroundColor: '#F7F3EC', color: '#1C3A2F' }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 text-5xl"
          style={{ backgroundColor: 'rgba(186,26,26,0.1)' }}>❌</div>
        <h1 className="font-display font-bold mb-3" style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)' }}>
          Pago no completado
        </h1>
        {orderId && <p className="text-sm font-mono mb-2" style={{ color: '#9b4500' }}>Pedido #{orderId}</p>}
        <p className="text-base max-w-md mb-10 leading-relaxed" style={{ color: '#404944' }}>
          El pago no fue procesado. Puedes intentarlo de nuevo o usar el pago contra entrega por WhatsApp.
        </p>
        <button onClick={onBack}
          className="px-8 py-4 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#1C3A2F', color: 'white' }}>
          Reintentar pedido
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: '#F7F3EC', color: '#1C3A2F' }}>
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 text-5xl"
        style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>✅</div>
      <h1 className="font-display font-bold mb-3 leading-tight"
        style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)' }}>
        ¡Pago completado!
      </h1>
      {orderId && (
        <p className="text-sm font-mono mb-2" style={{ color: '#9b4500' }}>
          Pedido #{orderId}
        </p>
      )}
      <p className="text-base max-w-md mb-8 leading-relaxed" style={{ color: '#404944' }}>
        Tu pago con TropiPay fue procesado exitosamente. Toca el botón para notificar a AMA y coordinar la entrega en menos de 24 horas. 🌿
      </p>

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {updating && (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#707974' }}>
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#003527', borderTopColor: 'transparent' }} />
            Registrando pedido…
          </div>
        )}
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90"
            style={{ backgroundColor: '#25D366', color: 'white' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Notificar a AMA por WhatsApp
          </a>
        )}
        <button onClick={onBack}
          className="px-8 py-4 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#1C3A2F', color: 'white' }}>
          Volver al inicio
        </button>
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
