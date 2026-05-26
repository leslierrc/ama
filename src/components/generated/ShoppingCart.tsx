import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { 
  Plus, Minus, Trash2, Zap, ShieldCheck, MapPin, User, 
  Phone, FileText, Settings, Search, Navigation, Compass, Check
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';

type Page = 'home' | 'catalog' | 'detail' | 'combo' | 'cart';

interface ShoppingCartProps {
  navigate?: (page: Page) => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  navigate
}) => {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [ordered, setOrdered] = useState(false);

  // Google Maps / Leaflet states
  const [googleKey, setGoogleKey] = useState(() => localStorage.getItem('ama_google_key') || '');
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'google'>('leaflet');
  const [coords, setCoords] = useState<{ lat: number, lng: number }>({ lat: 23.1136, lng: -82.3666 }); // Default La Habana
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState(googleKey);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);
  const googleMapRef = useRef<any>(null);
  const googleMarkerRef = useRef<any>(null);

  const subtotal = cartTotal;
  const shipping = 0;
  const total = subtotal + shipping;

  // 1. Load Leaflet CDN Assets
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if ((window as any).L) {
      setLeafletLoaded(true);
    } else {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    }
  }, []);

  // 2. Load Google Maps script when Key is entered
  useEffect(() => {
    if (!googleKey) {
      setMapEngine('leaflet');
      return;
    }

    const callbackName = 'initGoogleMapsCallback';
    (window as any)[callbackName] = () => {
      setGoogleLoaded(true);
      setMapEngine('google');
    };

    // Remove any previous script
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      delete (window as any)[callbackName];
    };
  }, [googleKey]);

  // Helper: Get Leaflet Custom Pulsing neon pin
  const getLeafletPinIcon = () => {
    if (!(window as any).L) return null;
    const L = (window as any).L;
    return L.divIcon({
      html: `<div class="relative flex items-center justify-center w-8 h-8">
              <div class="absolute w-8 h-8 bg-[#0055FF] rounded-full opacity-35 animate-ping"></div>
              <div class="relative w-5 h-5 bg-[#0055FF] border-2 border-white rounded-full shadow-[0_0_12px_rgba(0,85,255,0.9)] flex items-center justify-center">
                <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
             </div>`,
      className: 'custom-leaflet-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  // 3. Initialize Map based on Active Engine
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup Leaflet
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      leafletMarkerRef.current = null;
    }
    // Cleanup Google references
    googleMapRef.current = null;
    googleMarkerRef.current = null;

    mapContainerRef.current.innerHTML = '';

    if (mapEngine === 'google' && googleLoaded && (window as any).google) {
      try {
        const google = (window as any).google;
        const map = new google.maps.Map(mapContainerRef.current, {
          center: coords,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#0b1329" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0b1329" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#7aa2f7" }] },
            { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bb9af7" }] },
            { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#9ece6a" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a233a" }] },
            { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#41a2f6" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#161b2c" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#020408" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#a9b1d6" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ff9e64" }] },
            { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#020408" }] },
            { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f7768e" }] },
            { featureType: "transit", elementType: "geometry", stylers: [{ color: "#202b46" }] },
            { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#2ac3de" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#070c1a" }] },
            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#565f89" }] },
            { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#070c1a" }] }
          ]
        });

        const marker = new google.maps.Marker({
          position: coords,
          map: map,
          draggable: true,
          title: "Ubicación del pedido"
        });

        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (position) {
            const newLat = position.lat();
            const newLng = position.lng();
            setCoords({ lat: newLat, lng: newLng });
            reverseGeocode(newLat, newLng, 'google');
          }
        });

        googleMapRef.current = map;
        googleMarkerRef.current = marker;
      } catch (err) {
        console.error("Failed to load Google Map:", err);
        setMapEngine('leaflet');
      }
    } else if (leafletLoaded && (window as any).L) {
      try {
        const L = (window as any).L;
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView([coords.lat, coords.lng], 15);

        // Standard OSM tiles (we apply CSS invert for Dark mode!)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const marker = L.marker([coords.lat, coords.lng], {
          draggable: true,
          icon: getLeafletPinIcon()
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
          reverseGeocode(pos.lat, pos.lng, 'leaflet');
        });

        leafletMapRef.current = map;
        leafletMarkerRef.current = marker;
      } catch (err) {
        console.error("Failed to load Leaflet Map:", err);
      }
    }
  }, [mapEngine, leafletLoaded, googleLoaded]);

  // 4. Autocomplete setup for Google Places Input
  useEffect(() => {
    if (mapEngine === 'google' && googleLoaded && addressInputRef.current && (window as any).google) {
      try {
        const google = (window as any).google;
        const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['geocode', 'address'],
          componentRestrictions: { country: 'cu' }
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const newCoords = { lat, lng };
            setCoords(newCoords);
            setAddress(place.formatted_address || '');

            if (googleMapRef.current) {
              googleMapRef.current.setCenter(newCoords);
              googleMapRef.current.setZoom(16);
            }
            if (googleMarkerRef.current) {
              googleMarkerRef.current.setPosition(newCoords);
            }
          }
        });
      } catch (err) {
        console.error("Google autocomplete setup failed:", err);
      }
    }
  }, [mapEngine, googleLoaded]);

  // 5. Reverse Geocode Coordinates
  const reverseGeocode = async (lat: number, lng: number, engine: 'google' | 'leaflet') => {
    if (engine === 'google' && (window as any).google) {
      try {
        const google = (window as any).google;
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
          if (status === 'OK' && results && results[0]) {
            setAddress(results[0].formatted_address);
          }
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
        const data = await res.json();
        if (data && data.display_name) {
          // clean up display name if too long or format it nicely
          setAddress(data.display_name);
        }
      } catch (err) {
        console.error("Reverse geocoding error:", err);
      }
    }
  };

  // 6. Free OSM Nominatim suggestions query for La Habana (Leaflet Fallback)
  const handleAddressChange = async (val: string) => {
    setAddress(val);
    if (mapEngine === 'google') return; // Handled natively by Google Places

    if (val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    setShowSuggestions(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}+La+Habana+Cuba&format=json&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Nominatim fetch error:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const selectSuggestion = (sug: any) => {
    const lat = parseFloat(sug.lat);
    const lon = parseFloat(sug.lon);
    const newCoords = { lat, lng: lon };
    setCoords(newCoords);
    setAddress(sug.display_name);
    setShowSuggestions(false);

    if (leafletMapRef.current) {
      leafletMapRef.current.setView([lat, lon], 16);
    }
    if (leafletMarkerRef.current) {
      leafletMarkerRef.current.setLatLng([lat, lon]);
    }
  };

  // 7. Save API Key to localStorage
  const handleSaveKey = () => {
    setGoogleKey(tempKey.trim());
    localStorage.setItem('ama_google_key', tempKey.trim());
    setShowKeyInput(false);
  };

  const handleClearKey = () => {
    setTempKey('');
    setGoogleKey('');
    localStorage.removeItem('ama_google_key');
    setMapEngine('leaflet');
    setShowKeyInput(false);
  };

  // 8. Order Placement (Sends details to WhatsApp)
  const handleCheckout = () => {
    if (!name.trim() || !address.trim() || !phone.trim()) {
      alert("Por favor, completa los campos requeridos: Nombre, Dirección y Teléfono.");
      return;
    }

    const dateStr = new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
    const formattedTotal = total.toLocaleString('es-CU');
    
    // Generate order products text
    const itemsText = cart.map((item, index) => {
      let text = `📦 *${item.quantity}x ${item.title}* - CUP $${(item.price * item.quantity).toLocaleString('es-CU')}`;
      if (item.isCombo && item.comboItems && item.comboItems.length > 0) {
        const comboDetails = item.comboItems.map(ci => `   🔹 ${ci.quantity}× ${ci.name}`).join('\n');
        text += `\n${comboDetails}`;
      }
      return text;
    }).join('\n\n');

    // Maps Coordinate Links
    const gpsLink = `https://www.google.com/maps/place/${coords.lat},${coords.lng}`;

    // Compile message
    const message = `⚡ *NUEVO PEDIDO EN AMA La Habana* ⚡
📆 *Fecha:* ${dateStr}
----------------------------------
👤 *Cliente:* ${name.trim()}
📞 *Teléfono:* ${phone.trim()}
📍 *Dirección:* ${address.trim()}
🧭 *Coordenadas de Entrega:* ${gpsLink}
📝 *Notas:* ${notes.trim() || 'Ninguna'}

----------------------------------
🛒 *PRODUCTOS DEL PEDIDO:*
${itemsText}

----------------------------------
💰 *TOTAL A PAGAR:* *CUP $${formattedTotal}*
----------------------------------
🚗 ¡El pedido llegará en menos de 24 horas! ¡Gracias por comprar en AMA! 🚗⚡`;

    const encodedMessage = encodeURIComponent(message);
    // WhatsApp redirect to configured number
    const whatsappUrl = `https://wa.me/5355542936?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setOrdered(true);
    clearCart();
  };

  if (ordered) {
    return <div className="min-h-screen bg-[#020408] text-white overflow-x-hidden font-sans">
        <Navbar navigate={navigate} />
        <main className="pt-32 pb-24 flex flex-col items-center justify-center text-center px-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-7xl mb-6 relative">
            <span className="relative z-10 animate-bounce block">🎉</span>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#0055FF]/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">¡Pedido enviado a WhatsApp!</h1>
          <p className="text-gray-400 text-lg mb-2 max-w-md leading-relaxed">
            Hemos abierto un chat con nuestro equipo. Por favor, <span className="text-[#0055FF] font-black">envía el mensaje generado</span> en tu WhatsApp para confirmar tu pedido.
          </p>
          <p className="text-gray-500 text-sm mb-10">¡Tu pedido llegará en menos de 24 horas en nuestra Lambo! 🚗⚡</p>
          <button onClick={() => navigate?.('home')} className="px-8 py-4 bg-[#0055FF] text-white rounded-xl font-black text-lg hover:bg-[#0044CC] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,85,255,0.4)] cursor-pointer">
            Volver al Inicio
          </button>
        </main>
        <Footer />
      </div>;
  }

  return <div className="min-h-screen bg-[#020408] text-white overflow-x-hidden font-sans">
      <Navbar navigate={navigate} />
      
      {/* Dynamic Leaflet Dark style injection */}
      <style>{`
        .dark-leaflet-map .leaflet-tile {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(90%);
        }
        .dark-leaflet-map {
          background: #070c1a !important;
        }
        .leaflet-container {
          height: 100%;
          width: 100%;
          z-index: 10;
        }
        .leaflet-bar {
          border: 1px solid rgba(255,255,255,0.1) !important;
          background-color: rgba(11, 17, 32, 0.8) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .leaflet-bar a {
          background-color: rgba(11, 17, 32, 0.8) !important;
          color: white !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
          transition: all 0.2s;
        }
        .leaflet-bar a:hover {
          background-color: #0055FF !important;
          color: white !important;
        }
      `}</style>

      <main className="pt-24 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[#0055FF] font-bold text-sm uppercase tracking-widest mb-3">Tu pedido</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">Carrito de Compras</h1>
            </div>
            
            {/* Google Key Configuration Button */}
            <div className="relative">
              <button 
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-[#0055FF] rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <Settings size={14} className={googleKey ? "text-emerald-400" : ""} />
                <span>{googleKey ? "Google Maps Activo" : "Configurar Google Maps"}</span>
              </button>

              {showKeyInput && (
                <div className="absolute right-0 mt-3 w-80 glass border border-white/10 rounded-2xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <h4 className="font-black text-sm mb-2 text-white flex items-center gap-1.5">
                    <Compass size={15} className="text-[#0055FF]" />
                    Configurar Google Maps API Key
                  </h4>
                  <p className="text-[11px] text-gray-400 mb-4">
                    Coloca tu API Key de Google Cloud Console para activar el autocompletado y mapas oficiales de Google.
                  </p>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="password" 
                      value={tempKey}
                      onChange={e => setTempKey(e.target.value)}
                      placeholder="AIzaSy..." 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0055FF]"
                    />
                    <div className="flex gap-2 justify-end">
                      {googleKey && (
                        <button 
                          onClick={handleClearKey}
                          className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Eliminar
                        </button>
                      )}
                      <button 
                        onClick={() => setShowKeyInput(false)}
                        className="px-3 py-1.5 bg-white/5 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSaveKey}
                        className="px-3 py-1.5 bg-[#0055FF] text-white hover:bg-[#0044CC] rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Banner */}
          <div className="mb-10 glass rounded-2xl px-6 py-4 border border-[#0055FF]/30 flex items-center gap-4 bg-[#0055FF]/5">
            <Zap size={22} className="text-[#0055FF] shrink-0" />
            <p className="text-sm text-gray-200">
              <span className="text-white font-black">⚡ Tu pedido llegará en menos de 24 horas</span>
              {' '}— en nuestra Lambo 🚗
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
            {/* Cart Items */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {cart.length === 0 ? <div className="glass rounded-3xl p-16 border border-white/10 flex flex-col items-center text-center">
                  <p className="text-5xl mb-4">🛒</p>
                  <p className="text-gray-400 text-lg font-medium">Tu carrito está vacío</p>
                  <button onClick={() => navigate?.('catalog')} className="mt-6 px-6 py-3 bg-[#0055FF] text-white rounded-xl font-bold hover:bg-[#0044CC] transition-colors cursor-pointer">
                    Ver catálogo
                  </button>
                </div> : cart.map(item => <div key={item.id} className="glass rounded-2xl p-5 border border-white/10 flex items-center gap-5">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.category}</span>
                      <h3 className="font-black text-white text-base truncate">{item.title}</h3>
                      {item.isCombo && item.comboItems && (
                        <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-gray-400">
                          {item.comboItems.map((ci, index) => (
                            <span key={index} className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              {ci.quantity}× {ci.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[#0055FF] font-black text-sm mt-0.5">
                        <span className="text-gray-500 font-medium mr-1 text-xs">CUP</span>
                        ${item.price.toLocaleString('es-CU')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center hover:border-[#FF2D55] hover:text-[#FF2D55] transition-colors cursor-pointer">
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center font-black text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center hover:border-[#0055FF] hover:text-[#0055FF] transition-colors cursor-pointer">
                          <Plus size={12} />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#FF2D55] transition-colors cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>)}
            </div>

            {/* Right Panel: Summary + Form */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Order Summary */}
              <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
                <h3 className="font-black text-white text-lg">Resumen del pedido</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-bold">CUP ${subtotal.toLocaleString('es-CU')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Envío</span>
                  <span className="text-emerald-400 font-bold">Gratis 🎉</span>
                </div>
                <div className="border-t border-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-white font-black">Total</span>
                  <span className="text-2xl font-black">
                    <span className="text-sm font-medium text-gray-400 mr-1">CUP</span>
                    ${total.toLocaleString('es-CU')}
                  </span>
                </div>
              </div>

              {/* Delivery Form */}
              <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col gap-5">
                <h3 className="font-black text-white text-lg">Datos de entrega</h3>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-[#0055FF]" />
                    <span>Nombre Completo *</span>
                  </label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Tu nombre y apellidos" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#0055FF] transition-colors" 
                  />
                </div>

                {/* Address + Autocomplete */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#FF2D55]" />
                    <span>Dirección en La Habana *</span>
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      ref={addressInputRef}
                      value={address} 
                      onChange={e => handleAddressChange(e.target.value)} 
                      onFocus={() => address.trim().length >= 3 && mapEngine !== 'google' && setShowSuggestions(true)}
                      placeholder="Escribe tu calle, número, apto, reparto..." 
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#0055FF] transition-colors" 
                    />
                    <div className="absolute right-3.5 text-gray-500">
                      {loadingSuggestions ? (
                        <div className="w-4 h-4 border-2 border-t-transparent border-[#0055FF] rounded-full animate-spin"></div>
                      ) : (
                        <Search size={16} />
                      )}
                    </div>
                  </div>

                  {/* OpenStreetMap Suggestions Popover */}
                  {showSuggestions && suggestions.length > 0 && mapEngine !== 'google' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                      <div className="absolute top-[100%] left-0 right-0 mt-2 bg-[#0b1120] border border-white/10 rounded-xl p-2 shadow-2xl z-50 max-h-60 overflow-y-auto">
                        {suggestions.map((sug, i) => (
                          <button 
                            key={i} 
                            type="button"
                            onClick={() => selectSuggestion(sug)}
                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#0055FF]/10 text-xs text-gray-300 hover:text-white transition-all border-b border-white/5 last:border-0 truncate cursor-pointer"
                          >
                            📍 {sug.display_name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Telephone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={13} className="text-[#0055FF]" />
                    <span>Teléfono Móvil *</span>
                  </label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="Ej: 55542936" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#0055FF] transition-colors" 
                  />
                </div>

                {/* Map Selector */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation size={13} className="text-emerald-400 animate-pulse" />
                      <span>Ubicación Exacta en La Habana</span>
                    </label>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {mapEngine === 'google' ? 'Google Maps activo 🌐' : 'Leaflet libre (OSM) 🗺️'}
                    </span>
                  </div>
                  
                  {/* Map Wrapper */}
                  <div className="h-56 w-full rounded-2xl overflow-hidden border border-white/10 relative shadow-inner bg-slate-900">
                    <div ref={mapContainerRef} className={`h-full w-full ${mapEngine === 'leaflet' ? 'dark-leaflet-map' : ''}`} />
                  </div>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    📌 <span className="text-gray-400 font-bold">Arrastra el marcador azul</span> en el mapa para fijar tu ubicación exacta de entrega. Esto actualizará tu dirección.
                  </p>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={13} className="text-gray-400" />
                    <span>Notas e Indicaciones (Opcional)</span>
                  </label>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Referencias de color, entre qué calles, timbrar en altos..." 
                    rows={3} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#0055FF] transition-colors resize-none" 
                  />
                </div>

                {/* Checkout Button */}
                <button 
                  onClick={handleCheckout} 
                  disabled={cart.length === 0} 
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#FF2D55] text-white rounded-xl font-black text-base hover:bg-[#e02249] transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(255,45,85,0.35)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 mt-2 cursor-pointer"
                >
                  <Zap size={20} />
                  <span>Enviar Pedido por WhatsApp</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck size={13} />
                  <span>Pago en efectivo contra entrega en La Habana</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
};