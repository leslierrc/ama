import React, { useState, useRef } from 'react';

import img1 from '../../assets/magicpath/WhatsApp Image 2026-06-15 at 8.51.38 AM.webp';
import img2 from '../../assets/magicpath/WhatsApp Image 2026-06-15 at 8.53.07 AM.webp';
import img3 from '../../assets/magicpath/WhatsApp Image 2026-06-15 at 8.53.08 AM.webp';
import img4 from '../../assets/magicpath/WhatsApp Image 2026-06-15 at 8.53.14 AM.webp';
import img5 from '../../assets/magicpath/WhatsApp Image 2026-06-15 at 8.53.15 AM.webp';
import video from '../../assets/magicpath/WhatsApp Video 2026-06-15 at 8.57.03 AM.webm';

const PHOTOS = [img1, img2, img3, img4, img5];

export const AboutSection: React.FC = () => {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const closeLightbox = () => setLightbox(null);
  const prev = () => setLightbox(i => (i !== null ? (i - 1 + PHOTOS.length) % PHOTOS.length : null));
  const next = () => setLightbox(i => (i !== null ? (i + 1) % PHOTOS.length : null));

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (videoPlaying) { videoRef.current.pause(); setVideoPlaying(false); }
    else { videoRef.current.play(); setVideoPlaying(true); }
  };

  return (
    <section className="py-24 reveal-section" style={{ backgroundColor: '#0F2318', color: 'white' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-16">
          <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: '#E07B39' }}>
            Nuestra Historia
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            <h2 className="font-display font-bold leading-tight" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              El equipo detrás de AMA
            </h2>
            <p className="text-lg leading-relaxed font-light" style={{ color: 'rgba(255,255,255,0.78)' }}>
              Olvida las largas caminatas buscando cada producto bajo el sol de La Habana.
              AMA nació para llevarte el mercado a casa: alimentos frescos, electrodomésticos
              con garantía y precios imbatibles, y combos fitness para los atletas del hogar —
              todo sin salir de tu puerta. Somos un equipo joven, apasionado, con calidad real,
              entrega honesta y trato humano.
            </p>
          </div>
        </div>

        {/* ── Photo / Video grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-16" style={{ height: 'auto' }}>
          {/* Left: Video (col-span-5) */}
          <div
            className="md:col-span-5 rounded-2xl overflow-hidden relative group cursor-pointer"
            style={{ minHeight: '360px', backgroundColor: '#0b1120' }}
            onClick={toggleVideo}
          >
            <video
              ref={videoRef}
              src={video}
              className="w-full h-full object-cover block"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              playsInline
              loop
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
              onEnded={() => setVideoPlaying(false)}
            />
            {/* Play overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-colors duration-300"
              style={{ backgroundColor: videoPlaying ? 'transparent' : 'rgba(0,0,0,0.25)' }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  opacity: videoPlaying ? 0 : 1,
                }}
              >
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: '36px', marginLeft: '4px' }}
                >
                  play_arrow
                </span>
              </div>
              {/* Pause on hover when playing */}
              {videoPlaying && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}>
                    <span className="material-symbols-outlined text-[28px]" style={{ color: '#0F2318' }}>pause</span>
                  </div>
                </div>
              )}
            </div>
            {/* VIDEO badge */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
              Video
            </div>
          </div>

          {/* Right: 2×2 photo grid (col-span-7) */}
          <div className="md:col-span-7 grid grid-rows-2 gap-4" style={{ minHeight: '360px' }}>
            {/* Top row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden group cursor-pointer" onClick={() => setLightbox(0)}>
                <img src={img1} alt="AMA tienda"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{ minHeight: '160px' }} />
              </div>
              <div className="rounded-2xl overflow-hidden group cursor-pointer" onClick={() => setLightbox(1)}>
                <img src={img2} alt="AMA productos"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{ minHeight: '160px' }} />
              </div>
            </div>
            {/* Bottom row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden group cursor-pointer" onClick={() => setLightbox(2)}>
                <img src={img3} alt="AMA equipo"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{ minHeight: '160px' }} />
              </div>
              {/* Last slot: join us card OR photo */}
              <div className="rounded-2xl overflow-hidden group cursor-pointer" onClick={() => setLightbox(3)}>
                <img src={img4} alt="AMA local"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{ minHeight: '160px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 mb-12 text-center md:text-left"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { value: '24h', label: 'Entrega rápida' },
            { value: '100%', label: 'Garantía de calidad' },
            { value: '+500', label: 'Clientes satisfechos' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-display font-bold mb-2" style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: '#E07B39' }}>
                {s.value}
              </p>
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.78)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── WhatsApp CTA ── */}
        <div className="flex justify-center">
          <a
            href="https://wa.me/5355542936"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all"
            style={{ backgroundColor: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#20bd5a')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#25D366')}>
            <span className="material-symbols-outlined text-[20px]">chat</span>
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(10px)' }}
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            onClick={closeLightbox}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <button
            className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            onClick={e => { e.stopPropagation(); prev(); }}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <img
            src={PHOTOS[lightbox]}
            alt={`Foto ${lightbox + 1}`}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            onClick={e => { e.stopPropagation(); next(); }}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <div className="absolute bottom-6 flex gap-2">
            {PHOTOS.map((_, i) => (
              <button key={i}
                onClick={e => { e.stopPropagation(); setLightbox(i); }}
                className="rounded-full transition-all"
                style={{
                  width: i === lightbox ? '20px' : '8px',
                  height: '8px',
                  backgroundColor: i === lightbox ? 'white' : 'rgba(255,255,255,0.35)',
                }} />
            ))}
          </div>
          <div className="absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white' }}>
            {lightbox + 1} / {PHOTOS.length}
          </div>
        </div>
      )}
    </section>
  );
};
