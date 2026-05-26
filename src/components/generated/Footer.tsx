import React from 'react';
import { Instagram, Twitter, Facebook, Mail, MapPin, Phone } from 'lucide-react';
export const Footer: React.FC = () => {
  return <footer className="bg-[#0B1120] border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-1 text-3xl font-black tracking-tighter mb-6">
              <span className="text-white">A</span>
              <span className="text-[#0055FF]">M</span>
              <span className="text-[#FF2D55]">A</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              La tienda más rápida de La Habana. Calidad premium en productos del mercado, combos y electrodomésticos directamente a tu puerta.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:text-[#0055FF] transition-colors border border-white/10">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:text-[#0055FF] transition-colors border border-white/10">
                <Twitter size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:text-[#0055FF] transition-colors border border-white/10">
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Categorías</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Mercado</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Combos Familiares</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Electrodomésticos</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Arma tu Combo</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-bold mb-6">Información</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Sobre Nosotros</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Términos de Servicio</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Preguntas Frecuentes</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Envíos en 24h</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6">Contacto Habana</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <MapPin size={18} className="text-[#FF2D55]" />
                Calle 23, Vedado, La Habana
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone size={18} className="text-[#0055FF]" />
                +53 5 000 0000
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail size={18} className="text-white" />
                soporte@amastore.cu
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © 2024 AMA Store. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <span className="text-white text-xs font-bold uppercase tracking-tighter">Visa</span>
            <span className="text-white text-xs font-bold uppercase tracking-tighter">Mastercard</span>
            <span className="text-white text-xs font-bold uppercase tracking-tighter">Zelle</span>
          </div>
        </div>
      </div>
    </footer>;
};