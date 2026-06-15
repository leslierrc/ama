import React from 'react';

interface FooterProps {
  onAdminClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: 'var(--color-surface-container-lowest)',
        borderColor: 'var(--color-surface-variant)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-0">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            <div className="font-display text-2xl font-bold tracking-tighter" style={{ color: 'var(--color-emerald-deep)' }}>AMA</div>
            <p className="text-sm leading-relaxed max-w-[240px]" style={{ color: 'var(--color-on-surface-variant)' }}>
              Elevando lo cotidiano a través de la excelencia orgánica y tecnológica.
            </p>
            <div className="flex gap-4">
              {['share', 'mail'].map(icon => (
                <a key={icon} href="#" className="transition-colors duration-300" style={{ color: 'var(--color-primary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-gold-muted)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-primary)')}>
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-12 md:gap-16">
            <div className="flex flex-col gap-4">
              <span className="label-caps" style={{ color: 'var(--color-emerald-deep)' }}>EMPRESA</span>
              <ul className="flex flex-col gap-2">
                {['Política de Privacidad', 'Envíos y Devoluciones'].map(t => (
                  <li key={t}>
                    <a href="#" className="text-sm transition-colors duration-300" style={{ color: 'var(--color-on-surface-variant)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-gold-muted)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}>{t}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <span className="label-caps" style={{ color: 'var(--color-emerald-deep)' }}>AYUDA</span>
              <ul className="flex flex-col gap-2">
                {['Contáctanos', 'Preguntas Frecuentes'].map(t => (
                  <li key={t}>
                    <a href="#" className="text-sm transition-colors duration-300" style={{ color: 'var(--color-on-surface-variant)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-gold-muted)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}>{t}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-4 min-w-[280px]">
            <span className="label-caps" style={{ color: 'var(--color-emerald-deep)' }}>SUSCRIPCIÓN</span>
            <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Recibe noticias de cosechas exclusivas.</p>
            <div className="flex items-center border-b pb-2" style={{ borderColor: 'var(--color-outline)' }}>
              <input type="email" placeholder="Email" className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-sm" style={{ color: 'var(--color-on-surface)' }} />
              <button className="transition-colors duration-300 shrink-0" style={{ color: 'var(--color-primary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-primary)')}>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderColor: 'var(--color-surface-variant)' }}>
          <span className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            © 2024 AMA Modern Heritage. Todos los derechos reservados.
          </span>
           <button
              onClick={onAdminClick}
              className="text-xs transition-colors duration-300"
              style={{ color: 'var(--color-outline-variant)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-outline-variant)')}
            >
              ¿Eres administrador?
            </button>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--color-on-surface-variant)' }}>language</span>
              <span className="label-caps" style={{ color: 'var(--color-on-surface-variant)' }}>ESPAÑOL (CU)</span>
            </div>
            {/* Discrete admin link */}
           
          </div>
        </div>
      </div>
    </footer>
  );
};
