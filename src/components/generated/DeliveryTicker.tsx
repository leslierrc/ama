import React from 'react';

interface DeliveryTickerProps {
  bannerText?: string;
}

export const DeliveryTicker: React.FC<DeliveryTickerProps> = ({ bannerText }) => {
  const message = bannerText || 'domicilios rápidos en menos de 24 horas en nuestra lambo';

  return (
    <div
      className="w-full overflow-hidden whitespace-nowrap py-3 border-y"
      style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary-container)' }}
    >
      <div className="flex items-center animate-delivery-ticker">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 shrink-0 px-6">
            <span className="text-xl">🏎️</span>
            <span className="label-caps italic"
              style={{ color: 'var(--color-inverse-primary)', letterSpacing: '0.12em' }}>
              {message}
            </span>
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--color-inverse-primary)', opacity: 0.4 }} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes delivery-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-delivery-ticker {
          display: flex;
          width: max-content;
          animation: delivery-ticker 28s linear infinite;
        }
      `}</style>
    </div>
  );
};
