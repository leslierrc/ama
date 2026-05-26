import React from 'react';
export const DeliveryTicker: React.FC = () => {
  return <div className="w-full bg-[#0055FF] overflow-hidden whitespace-nowrap py-3 relative border-y border-white/10">
      <div className="flex animate-marquee-infinite items-center gap-8 md:gap-12">
        {[...Array(10)].map((_, i) => <div key={i} className="flex items-center gap-3">
            <span className="text-white font-black italic tracking-widest text-sm md:text-base uppercase flex items-center gap-2">
              <span className="text-2xl">🏎️</span>
              domicilios rápidos en menos de 24 horas en nuestra lambo
            </span>
            <span className="w-2 h-2 rounded-full bg-white opacity-50" />
          </div>)}
      </div>

      <style dangerouslySetInnerHTML={{
      __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-infinite {
          display: flex;
          width: fit-content;
          animation: marquee 20s linear infinite;
        }
      `
    }} />
    </div>;
};