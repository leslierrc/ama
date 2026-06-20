import React, { useState, useRef } from 'react';

// Importar los assets locales
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

  const openLightbox = (i: number) => setLightbox(i);
  const closeLightbox = () => setLightbox(null);
  const prev = () => setLightbox(i => (i !== null ? (i - 1 + PHOTOS.length) % PHOTOS.length : null));
  const next = () => setLightbox(i => (i !== null ? (i + 1) % PHOTOS.length : null));

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (videoPlaying) { videoRef.current.pause(); setVideoPlaying(false); }
    else { videoRef.current.play(); setVideoPlaying(true); }
  };

  return (
    <section
      className="py-20 md:py-28 px-5 md:px-16 reveal-section"
      style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
    >
      <div className="max-w-[1280px] mx-auto flex flex-col gap-16">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span
              className="label-caps"
              style={{ color: 'var(--color-gold-muted)', letterSpacing: '0.2em' }}
            >
              NUESTRA HISTORIA
            </span>
            <h2
              className="font-display font-bold leading-tight"
              style={{
                color: 'var(--color-primary)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                letterSpacing: '-0.02em',
              }}
            >
              El equipo detrás de AMA
            </h2>
            <div className="h-px w-20" style={{ backgroundColor: 'var(--color-gold-muted)' }} />
          </div>
          <p
            className="text-base leading-relaxed max-w-md"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            Somos un equipo apasionado que une el campo cubano con cada hogar. Calidad real,
            entrega honesta, trato humano.
          </p>
        </div>

        {/* ── Bento grid de fotos ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {/* Foto grande izquierda */}
          <div
            className="row-span-2 relative overflow-hidden rounded-2xl cursor-pointer group ambient-shadow"
            style={{ minHeight: '280px' }}
            onClick={() => openLightbox(0)}
          >
            <img
              src={img1}
              alt="AMA - nuestro local"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ position: 'absolute', inset: 0 }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-white text-[32px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
              >
                zoom_in
              </span>
            </div>
          </div>

          {/* Fotos pequeñas derecha */}
          {[img2, img3, img4].map((src, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl cursor-pointer group ambient-shadow"
              style={{ aspectRatio: '4/3' }}
              onClick={() => openLightbox(i + 1)}
            >
              <img
                src={src}
                alt={`AMA - foto ${i + 2}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-white text-[28px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                >
                  zoom_in
                </span>
              </div>
            </div>
          ))}

          {/* Última foto con overlay de "ver más" */}
          <div
            className="relative overflow-hidden rounded-2xl cursor-pointer group ambient-shadow"
            style={{ aspectRatio: '4/3' }}
            onClick={() => openLightbox(4)}
          >
            <img
              src={img5}
              alt="AMA - equipo"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-white text-[28px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
              >
                zoom_in
              </span>
            </div>
          </div>
        </div>

        {/* ── Video + texto ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Video player */}
          <div
            className="relative overflow-hidden rounded-2xl cursor-pointer ambient-shadow group"
            style={{ backgroundColor: '#0b1120' }}
            onClick={toggleVideo}
          >
            <video
              ref={videoRef}
              src={video}
              className="w-full h-auto block"
              playsInline
              loop
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
              onEnded={() => setVideoPlaying(false)}
            />
            {/* Play / Pause overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
              style={{ backgroundColor: videoPlaying ? 'transparent' : 'rgba(0,0,0,0.3)' }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  opacity: videoPlaying ? 0 : 1,
                }}
              >
                <span
                  className="material-symbols-outlined text-[32px]"
                  style={{ color: 'var(--color-primary)', marginLeft: '4px' }}
                >
                  play_arrow
                </span>
              </div>
            </div>
            {/* Pause button when playing */}
            {videoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
                >
                  <span className="material-symbols-outlined text-[28px]" style={{ color: 'var(--color-primary)' }}>
                    pause
                  </span>
                </div>
              </div>
            )}
            {/* Duration badge */}
            <div
              className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
            >
              VIDEO
            </div>
          </div>

          {/* Texto */}
          <div className="flex flex-col gap-6">
            <div
              className="w-12 h-1 rounded-full"
              style={{ backgroundColor: 'var(--color-gold-muted)' }}
            />
            <h3
              className="font-display font-semibold leading-snug"
              style={{ color: 'var(--color-primary)', fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)' }}
            >
              Cuidamos el origen,<br />elevamos tu mesa.
            </h3>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              AMA nació de la creencia de que la modernidad no debe comprometer la calidad de lo
              esencial. Seleccionamos meticulosamente cada producto de granjas que respetan los
              ciclos naturales y curamos tecnología para el hogar que honra esos ingredientes.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              Uniendo tradición y eficiencia, llevamos la esencia del campo a la sofisticación
              de tu hogar — con entrega en menos de 24 horas en La Habana.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { value: '24h', label: 'Entrega' },
                { value: '100%', label: 'Garantía' },
                { value: '+500', label: 'Clientes' },
              ].map(s => (
                <div key={s.label} className="flex flex-col gap-1">
                  <span
                    className="font-display font-bold text-2xl"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {s.value}
                  </span>
                  <span className="label-caps" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            onClick={closeLightbox}
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Prev */}
          <button
            className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            onClick={e => { e.stopPropagation(); prev(); }}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          {/* Image */}
          <img
            src={PHOTOS[lightbox]}
            alt={`Foto ${lightbox + 1}`}
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          />

          {/* Next */}
          <button
            className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            onClick={e => { e.stopPropagation(); next(); }}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 flex gap-2">
            {PHOTOS.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setLightbox(i); }}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: i === lightbox ? 'white' : 'rgba(255,255,255,0.35)',
                  transform: i === lightbox ? 'scale(1.4)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* Counter */}
          <div
            className="absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
          >
            {lightbox + 1} / {PHOTOS.length}
          </div>
        </div>
      )}
    </section>
  );
};
