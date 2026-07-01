import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useCart } from '../../hooks/useCart';
import { supabase } from '../../lib/supabase';
import type { Page, FilterCategory } from '../../App';

type PaymentMethod = 'whatsapp' | 'tropipay';
interface ShoppingCartProps { navigate?: (page: Page, filter?: FilterCategory) => void; }

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5351365501';
const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Vercel Serverless Function — /api/tropipay
// En local apunta a http://localhost:3000/api/tropipay (vite proxy lo redirige)
// En Vercel apunta al mismo dominio automáticamente
const TROPIPAY_FUNCTION_URL = '/api/tropipay';

// ── Main component ────────────────────────────────────────────────────────────
export const ShoppingCart: React.FC<ShoppingCartProps> = ({ navigate }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [ordered, setOrdered] = useState(false);
  const [orderedVia, setOrderedVia] = useState<PaymentMethod>('whatsapp');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('whatsapp');
  const [formError, setFormError] = useState('');
  const [tropipayLoading, setTropipayLoading] = useState(false);
  const [waUrl, setWaUrl] = useState('');

  const [coords, setCoords] = useState({ lat: 23.1136, lng: -82.3666 });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [googleKey, setGoogleKey] = useState(() => localStorage.getItem('ama_google_key') || '');
  const [tempKey, setTempKey] = useState('');
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'google'>('leaflet');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);
  const googleMapRef = useRef<any>(null);
  const googleMarkerRef = useRef<any>(null);
  const initAttemptRef = useRef(0);

  const total = cartTotal;
  const totalUSD = total.toFixed(2);

  // Load Leaflet
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const l = document.createElement('link');
      l.id = 'leaflet-css'; l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(l);
    }
    if ((window as any).L) { setMapReady(true); return; }
    if (!document.getElementById('leaflet-js')) {
      const s = document.createElement('script');
      s.id = 'leaflet-js'; s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.async = true;
      s.onload = () => setMapReady(true);
      document.body.appendChild(s);
    } else {
      const iv = setInterval(() => { if ((window as any).L) { setMapReady(true); clearInterval(iv); } }, 150);
      return () => clearInterval(iv);
    }
  }, []);

  // Load Google Maps
  useEffect(() => {
    if (!googleKey) return;
    document.getElementById('google-maps-script')?.remove();
    const cb = '__amaGMReady__';
    (window as any)[cb] = () => { setGoogleLoaded(true); setMapEngine('google'); delete (window as any)[cb]; };
    const s = document.createElement('script');
    s.id = 'google-maps-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}&libraries=places&callback=${cb}`;
    s.async = true; s.onerror = () => setMapEngine('leaflet');
    document.body.appendChild(s);
    return () => { delete (window as any)[cb]; };
  }, [googleKey]);

  const initLeaflet = useCallback(() => {
    const c = mapContainerRef.current;
    if (!c || !(window as any).L || c.clientHeight === 0) return false;
    leafletMapRef.current?.remove(); leafletMapRef.current = null;
    c.innerHTML = '';
    const L = (window as any).L;
    const map = L.map(c, { zoomControl: true, attributionControl: false }).setView([coords.lat, coords.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    const pin = L.divIcon({
      html: `<div style="width:22px;height:22px;background:#003527;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,53,39,.45)"></div>`,
      className: '', iconSize: [22, 22], iconAnchor: [11, 11],
    });
    const marker = L.marker([coords.lat, coords.lng], { draggable: true, icon: pin }).addTo(map);
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      setCoords({ lat: p.lat, lng: p.lng });
      reverseGeocode(p.lat, p.lng);
    });
    setTimeout(() => map.invalidateSize(), 100);
    leafletMapRef.current = map; leafletMarkerRef.current = marker;
    return true;
  }, [coords.lat, coords.lng]);

  const initGoogle = useCallback(() => {
    const c = mapContainerRef.current;
    if (!c || !(window as any).google || c.clientHeight === 0) return false;
    c.innerHTML = '';
    const G = (window as any).google;
    const map = new G.maps.Map(c, { center: { lat: coords.lat, lng: coords.lng }, zoom: 15, disableDefaultUI: true, zoomControl: true });
    const marker = new G.maps.Marker({ position: { lat: coords.lat, lng: coords.lng }, map, draggable: true });
    marker.addListener('dragend', () => {
      const p = marker.getPosition();
      if (p) { setCoords({ lat: p.lat(), lng: p.lng() }); reverseGeocodeGoogle(p.lat(), p.lng()); }
    });
    googleMapRef.current = map; googleMarkerRef.current = marker;
    return true;
  }, [coords.lat, coords.lng]);

  useEffect(() => {
    const fn = mapEngine === 'google' && googleLoaded ? initGoogle
      : mapEngine === 'leaflet' && mapReady ? initLeaflet : null;
    if (!fn) return;
    initAttemptRef.current = 0;
    const tryInit = () => { if (!fn() && initAttemptRef.current < 20) { initAttemptRef.current++; setTimeout(tryInit, 150); } };
    tryInit();
  }, [mapReady, mapEngine, googleLoaded, initLeaflet, initGoogle]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
      const d = await r.json();
      if (d?.display_name) setAddress(d.display_name);
    } catch { /* silent */ }
  };

  const reverseGeocodeGoogle = (lat: number, lng: number) => {
    const G = (window as any).google; if (!G) return;
    new G.maps.Geocoder().geocode({ location: { lat, lng } }, (res: any, st: string) => {
      if (st === 'OK' && res?.[0]) setAddress(res[0].formatted_address);
    });
  };

  const handleAddressChange = async (val: string) => {
    setAddress(val);
    if (val.trim().length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    setLoadingSuggestions(true); setShowSuggestions(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}+La+Habana+Cuba&format=json&limit=5`);
      setSuggestions(await r.json());
    } catch { /* silent */ } finally { setLoadingSuggestions(false); }
  };

  const selectSuggestion = (sug: any) => {
    const lat = parseFloat(sug.lat), lng = parseFloat(sug.lon);
    setCoords({ lat, lng }); setAddress(sug.display_name); setShowSuggestions(false);
    leafletMapRef.current?.setView([lat, lng], 16); leafletMarkerRef.current?.setLatLng([lat, lng]);
    googleMapRef.current?.setCenter({ lat, lng }); googleMarkerRef.current?.setPosition({ lat, lng });
  };

  const saveOrder = async (method: PaymentMethod, tropipayRef?: string) => {
    try {
      const orderNumber = `AMA-${Date.now().toString().slice(-8)}`;
      // payment_method: el check constraint de Supabase solo acepta 'whatsapp'|'paypal'
      // hasta que se ejecute supabase_fix.sql. Usamos 'paypal' como workaround temporal
      // y diferenciamos TropiPay por el campo paypal_order_id que comienza con "TP-"
      const dbPaymentMethod = method === 'tropipay' ? 'paypal' : 'whatsapp';
      const { data: order, error } = await supabase.from('orders').insert({
        order_number: orderNumber, customer_name: name.trim(), customer_phone: phone.trim(),
        delivery_address: address.trim(), notes: notes.trim() || null,
        subtotal: total, total,
        status: method === 'tropipay' ? 'pending' : 'pending',
        payment_method: dbPaymentMethod,
        paypal_order_id: method === 'tropipay' ? `TP-${orderNumber}` : (tropipayRef || null),
        gps_lat: coords.lat, gps_lng: coords.lng,
      }).select().single();
      if (error) throw error;
      if (order) {
        await supabase.from('order_items').insert(
          cart.map(item => ({
            order_id: order.id, product_name: item.title,
            quantity: item.quantity, unit_price: item.price,
            total_price: item.price * item.quantity,
          }))
        );
      }

      // Notificar por email a los admins (no bloqueante — no afecta el flujo del usuario)
      fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          customerName:    name.trim(),
          customerPhone:   phone.trim(),
          customerAddress: address.trim(),
          notes:           notes.trim() || null,
          paymentMethod:   method,
          total,
          gpsLat:  coords.lat,
          gpsLng:  coords.lng,
          items: cart.map(item => ({
            name:       item.title,
            quantity:   item.quantity,
            price:      item.price,
            comboItems: item.comboItems || [],
          })),
        }),
      }).catch(e => console.warn('[notify-order] failed silently:', e));

      return orderNumber;
    } catch (err) {
      console.error('[saveOrder] error:', err);
      return `AMA-${Date.now().toString().slice(-8)}`;
    }
  };

  const sendWhatsApp = (method: PaymentMethod, orderNumber: string, extra?: string) => {
    const dateStr = new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
    const itemsText = cart.map(item => {
      let t = `📦 *${item.quantity}x ${item.title}* — $${fmt(item.price * item.quantity)}`;
      if (item.isCombo && item.comboItems?.length)
        t += '\n' + item.comboItems.map(ci => `   🔹 ${ci.quantity}× ${ci.name}`).join('\n');
      return t;
    }).join('\n\n');
    const gpsLink = `https://www.google.com/maps/place/${coords.lat},${coords.lng}`;
    const paymentLine = method === 'tropipay'
      ? `💳 *Pago:* TropiPay 🔗 (Ref: ${extra || orderNumber})\n💵 *USD a pagar:* $${totalUSD}`
      : '💵 *Pago:* Contra entrega en USD';
    const msg = [
      `🌿 *NUEVO PEDIDO AMA* #${orderNumber} 🌿`,
      `📆 *Fecha:* ${dateStr}`,
      '──────────────────────',
      `👤 *Cliente:* ${name.trim()}`,
      `📞 *Teléfono:* ${phone.trim()}`,
      `📍 *Dirección:* ${address.trim()}`,
      `🧭 *Ubicación:* ${gpsLink}`,
      `📝 *Notas:* ${notes.trim() || 'Ninguna'}`,
      paymentLine,
      '──────────────────────',
      '🛒 *PRODUCTOS:*',
      itemsText,
      '──────────────────────',
      `💰 *TOTAL:* *$${fmt(total)}*`,
      '──────────────────────',
      '✅ ¡Gracias por comprar en AMA! Entrega en 24h 🌿',
    ].join('\n');
    setWaUrl(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`);
  };

  const validateForm = () => {
    if (!name.trim()) { setFormError('Por favor ingresa tu nombre.'); return false; }
    if (!address.trim()) { setFormError('Por favor ingresa tu dirección.'); return false; }
    if (!phone.trim()) { setFormError('Por favor ingresa tu teléfono.'); return false; }
    setFormError(''); return true;
  };

  const handleWhatsAppCheckout = async () => {
    if (!validateForm()) return;
    const orderNumber = await saveOrder('whatsapp');
    // Build WA URL and store it — user clicks the button in success screen
    sendWhatsApp('whatsapp', orderNumber);
    setOrderedVia('whatsapp'); setOrdered(true); clearCart();
  };

  // ── TropiPay: genera enlace y redirige ──────────────────────────────────────
  const handleTropipayCheckout = async () => {
    if (!validateForm()) return;
    if (cart.length === 0) return;
    setTropipayLoading(true);
    setFormError('');
    try {
      const orderNumber = await saveOrder('tropipay');
      const description = `Pedido AMA #${orderNumber} (${cart.length} producto${cart.length > 1 ? 's' : ''})`;
      const res = await fetch(TROPIPAY_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderNumber,
          amount: total,
          description,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerAddress: address.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.paymentUrl) {
        throw new Error(data.error || 'No se pudo crear el enlace de pago');
      }
      window.location.href = data.paymentUrl;
    } catch (err: any) {
      setFormError(err.message || 'Error al conectar con TropiPay. Intenta de nuevo.');
    } finally {
      setTropipayLoading(false);
    }
  };


  const handleSaveKey = () => {
    const k = tempKey.trim(); setGoogleKey(k); localStorage.setItem('ama_google_key', k);
    setShowKeyPanel(false); setTempKey('');
  };
  const handleClearKey = () => {
    setGoogleKey(''); localStorage.removeItem('ama_google_key');
    setMapEngine('leaflet'); setGoogleLoaded(false); setShowKeyPanel(false); setTempKey('');
  };

  const iStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface-container)',
    border: '1px solid var(--color-outline-variant)',
    color: 'var(--color-on-surface)',
    borderRadius: '0.75rem', padding: '12px 16px',
    width: '100%', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
  };

  // ── Success screen ────────────────────────────────────────
  if (ordered) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)' }}>
        <Navbar navigate={navigate} />
        <main className="pt-32 pb-24 flex flex-col items-center justify-center text-center px-6">
          <div className="text-7xl mb-6">{orderedVia === 'tropipay' ? '💳' : '🎉'}</div>
          <h1 className="font-display font-bold mb-4" style={{ color: 'var(--color-primary)', fontSize: 'clamp(1.75rem,4vw,2.5rem)' }}>
            {orderedVia === 'tropipay' ? '¡Pago iniciado con TropiPay!' : '¡Pedido enviado a WhatsApp!'}
          </h1>
          <p className="text-lg mb-2 max-w-md leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
            {orderedVia === 'tropipay'
              ? <><span>Fuiste redirigido a TropiPay. </span><span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Completa el pago</span><span> y recibes tu pedido en 24h.</span></>
              : <><span>Por favor </span><span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>envía el mensaje generado</span><span> en WhatsApp para confirmar.</span></>}
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--color-on-surface-variant)' }}>¡Tu pedido llegará en menos de 24 horas! 🌿</p>
          {orderedVia === 'whatsapp' && waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="label-caps px-8 py-4 rounded-xl hover:opacity-90 active:scale-95 flex items-center gap-2 mb-4"
              style={{ backgroundColor: '#25D366', color: 'white' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar pedido por WhatsApp
            </a>
          )}
          <button onClick={() => navigate?.('home')} className="label-caps px-8 py-4 rounded-xl hover:opacity-90 active:scale-95" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            Volver al Inicio
          </button>
        </main>
        <Footer onAdminClick={() => navigate?.('admin-login')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)' }}>
      <Navbar navigate={navigate} />
      <style>{`
        .leaflet-container{height:100%;width:100%;z-index:1}
        .leaflet-bar{border:1px solid var(--color-outline-variant)!important;border-radius:8px!important;overflow:hidden;box-shadow:none!important}
        .leaflet-bar a{background-color:white!important;color:var(--color-on-surface)!important;border-bottom:1px solid var(--color-outline-variant)!important}
        .leaflet-bar a:hover{background-color:var(--color-primary)!important;color:white!important}
      `}</style>

      <main className="pt-24 pb-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-16">

          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="label-caps block mb-2" style={{ color: 'var(--color-gold-muted)' }}>TU PEDIDO</span>
              <h1 className="font-display font-bold" style={{ color: 'var(--color-primary)', fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.02em' }}>
                Carrito de Compras
              </h1>
            </div>
            {/* Google Maps key */}
            <div className="relative">
              {/* <button onClick={() => { setShowKeyPanel(!showKeyPanel); setTempKey(googleKey); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl label-caps"
                style={{ backgroundColor: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)', color: googleKey ? '#10b981' : 'var(--color-on-surface-variant)' }}>
                <span className="material-symbols-outlined text-[16px]">map</span>
                {googleKey ? 'Google Maps Activo' : 'Activar Google Maps'}
              </button> */}
              {showKeyPanel && (
                <div className="absolute right-0 mt-3 w-80 rounded-xl p-5 shadow-2xl z-50"
                  style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}>
                  <h4 className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-primary)' }}>Google Maps API Key</h4>
                  <p className="text-xs mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>Pega tu clave de Google Cloud Console.</p>
                  <input type="password" value={tempKey} onChange={e => setTempKey(e.target.value)} placeholder="AIzaSy..." style={iStyle} className="mb-3"
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-outline-variant)')} />
                  <div className="flex gap-2 justify-end">
                    {googleKey && <button onClick={handleClearKey} className="label-caps px-3 py-2 rounded-lg text-[10px]" style={{ backgroundColor: 'rgba(186,26,26,0.1)', color: 'var(--color-error)', border: '1px solid rgba(186,26,26,0.2)' }}>Eliminar</button>}
                    <button onClick={() => setShowKeyPanel(false)} className="label-caps px-3 py-2 rounded-lg text-[10px]" style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}>Cancelar</button>
                    <button onClick={handleSaveKey} className="label-caps px-3 py-2 rounded-lg text-[10px] hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>Guardar</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery banner */}
          <div className="mb-10 rounded-xl px-6 py-4 flex items-center gap-4" style={{ backgroundColor: 'rgba(0,53,39,0.06)', border: '1px solid rgba(0,53,39,0.15)' }}>
            <span className="material-symbols-outlined shrink-0" style={{ color: 'var(--color-primary)' }}>local_shipping</span>
            <p className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
              <span style={{ fontWeight: 700 }}>Tu pedido llegará en menos de 24 horas</span> — entrega directa a tu puerta 🌿
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">

            {/* Cart items */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {cart.length === 0 ? (
                <div className="rounded-xl p-16 flex flex-col items-center text-center ambient-shadow"
                  style={{ backgroundColor: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                  <p className="text-5xl mb-4">🛒</p>
                  <p className="font-medium mb-2" style={{ color: 'var(--color-on-surface)' }}>Tu carrito está vacío</p>
                  <p className="text-sm mb-6" style={{ color: 'var(--color-on-surface-variant)' }}>Explora nuestro catálogo y agrega productos</p>
                  <button onClick={() => navigate?.('catalog')} className="label-caps px-6 py-3 rounded-xl hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    Ver catálogo
                  </button>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="rounded-xl p-5 flex items-center gap-4 ambient-shadow"
                  style={{ backgroundColor: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="label-caps block mb-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>{item.category}</span>
                    <h3 className="font-display font-semibold text-base truncate" style={{ color: 'var(--color-primary)' }}>{item.title}</h3>
                    {item.isCombo && item.comboItems && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.comboItems.map((ci, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)', border: '1px solid var(--color-outline-variant)' }}>
                            {ci.quantity}× {ci.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm font-semibold mt-1" style={{ color: 'var(--color-secondary)' }}>
                      {fmt(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                        style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-secondary)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-secondary)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-outline-variant)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-on-surface)'; }}>
                        <span className="material-symbols-outlined text-[14px]">remove</span>
                      </button>
                      <span className="w-5 text-center font-bold text-sm" style={{ color: 'var(--color-on-surface)' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                        style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-outline-variant)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-on-surface)'; }}>
                        <span className="material-symbols-outlined text-[14px]">add</span>
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 flex items-center justify-center"
                      style={{ color: 'var(--color-on-surface-variant)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-error)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}>
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right panel */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Summary */}
              <div className="rounded-xl p-6 ambient-shadow flex flex-col gap-4"
                style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}>
                <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--color-primary)' }}>Resumen del pedido</h3>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-on-surface-variant)' }}>Subtotal</span>
                  <span style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>{fmt(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-on-surface-variant)' }}>Envío</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Gratis 🎉</span>
                </div>
                <div className="border-t" style={{ borderColor: 'var(--color-outline-variant)' }} />
                <div className="flex justify-between items-center">
                  <span className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>Total USD</span>
                  <span className="text-2xl font-semibold" style={{ color: 'var(--color-secondary)', fontFamily: 'Inter' }}>
                    {fmt(total)}
                  </span>
                </div>
              </div>

              {/* Delivery form */}
              <div className="rounded-xl p-6 ambient-shadow flex flex-col gap-5"
                style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}>
                <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--color-primary)' }}>Datos de entrega</h3>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="label-caps flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                    <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--color-primary)' }}>person</span>
                    Nombre Completo *
                  </label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre y apellidos" style={iStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-outline-variant)')} />
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="label-caps flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                    <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--color-secondary)' }}>location_on</span>
                    Dirección en La Habana *
                  </label>
                  <div className="relative">
                    <input type="text" value={address} onChange={e => handleAddressChange(e.target.value)}
                      onFocus={() => address.trim().length >= 3 && setShowSuggestions(true)}
                      placeholder="Escribe tu calle, número, reparto…"
                      style={{ ...iStyle, paddingRight: '40px' }}
                      onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                      onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--color-outline-variant)')} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-on-surface-variant)' }}>
                      {loadingSuggestions
                        ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                        : <span className="material-symbols-outlined text-[18px]">search</span>}
                    </div>
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-xl p-2 shadow-xl z-50 max-h-56 overflow-y-auto"
                        style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}>
                        {suggestions.map((sug, i) => (
                          <button key={i} type="button" onClick={() => selectSuggestion(sug)}
                            className="w-full text-left px-3 py-2.5 rounded-lg text-xs truncate"
                            style={{ color: 'var(--color-on-surface-variant)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-container)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-on-surface)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--color-on-surface-variant)'; }}>
                            📍 {sug.display_name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="label-caps flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                    <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--color-primary)' }}>phone</span>
                    Teléfono Móvil *
                  </label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej: 55542936" style={iStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-outline-variant)')} />
                </div>

                {/* Map */}
                <div className="flex flex-col gap-2">
                  <label className="label-caps flex items-center justify-between" style={{ color: 'var(--color-on-surface-variant)' }}>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--color-primary)' }}>map</span>
                      Ubicación en el Mapa
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: mapEngine === 'google' ? 'rgba(16,185,129,0.12)' : 'var(--color-surface-container)', color: mapEngine === 'google' ? '#10b981' : 'var(--color-on-surface-variant)', border: '1px solid var(--color-outline-variant)' }}>
                      {mapEngine === 'google' ? 'Google Maps' : 'OpenStreetMap'}
                    </span>
                  </label>
                  <div ref={mapContainerRef} className="w-full rounded-xl overflow-hidden"
                    style={{ height: '200px', border: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container)' }} />
                  <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Arrastra el pin para ajustar tu ubicación.</p>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="label-caps flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                    <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--color-on-surface-variant)' }}>notes</span>
                    Notas adicionales
                  </label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Instrucciones especiales para el repartidor…" rows={3}
                    style={{ ...iStyle, resize: 'none' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-outline-variant)')} />
                </div>

                {/* Payment method */}
                <div className="flex flex-col gap-3">
                  <span className="label-caps" style={{ color: 'var(--color-on-surface-variant)' }}>Método de pago</span>

                  {/* WhatsApp */}
                  <button onClick={() => setPaymentMethod('whatsapp')}
                    className="flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                    style={{ border: paymentMethod === 'whatsapp' ? '2px solid var(--color-primary)' : '1px solid var(--color-outline-variant)', backgroundColor: paymentMethod === 'whatsapp' ? 'rgba(0,53,39,0.04)' : 'var(--color-surface-container)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#25D366' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-on-surface)' }}>Pagar contra entrega</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>Confirma por WhatsApp y paga al recibir en USD</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                      style={{ borderColor: paymentMethod === 'whatsapp' ? 'var(--color-primary)' : 'var(--color-outline-variant)' }}>
                      {paymentMethod === 'whatsapp' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />}
                    </div>
                  </button>

                  {/* TropiPay */}
                  <button onClick={() => setPaymentMethod('tropipay')}
                    className="flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                    style={{ border: paymentMethod === 'tropipay' ? '2px solid #00B4D8' : '1px solid var(--color-outline-variant)', backgroundColor: paymentMethod === 'tropipay' ? 'rgba(0,180,216,0.05)' : 'var(--color-surface-container)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#006B7D' }}>
                      <span className="text-white font-bold text-sm leading-none">TP</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-on-surface)' }}>Pagar con Tarjeta</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>Pago seguro desde el exterior · ${fmt(total)} USD</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                      style={{ borderColor: paymentMethod === 'tropipay' ? '#00B4D8' : 'var(--color-outline-variant)' }}>
                      {paymentMethod === 'tropipay' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00B4D8' }} />}
                    </div>
                  </button>
                </div>

                {/* Form error */}
                {formError && (
                  <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(186,26,26,0.08)', color: 'var(--color-error)', border: '1px solid rgba(186,26,26,0.2)' }}>
                    ⚠️ {formError}
                  </p>
                )}

                {/* CTA */}
                <div className="mt-2">
                  {paymentMethod === 'whatsapp' ? (
                    <button onClick={handleWhatsAppCheckout} disabled={cart.length === 0}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl label-caps font-bold transition-all active:scale-95 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#25D366', color: 'white' }}>
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                      Confirmar por WhatsApp
                    </button>
                  ) : (
                    <button onClick={handleTropipayCheckout} disabled={cart.length === 0 || tropipayLoading}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl label-caps font-bold transition-all active:scale-95 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#006B7D', color: 'white' }}>
                      {tropipayLoading ? (
                        <><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} /><span>Generando enlace...</span></>
                      ) : (
                        <><span className="material-symbols-outlined text-[20px]">open_in_new</span><span>Pagar con TropiPay</span></>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs justify-center" style={{ color: 'var(--color-on-surface-variant)' }}>
                  <span className="material-symbols-outlined text-[14px]">verified_user</span>
                  <span>Transacciones 100% seguras · Sin riesgo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer onAdminClick={() => navigate?.('admin-login')} />
    </div>
  );
};
