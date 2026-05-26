import React from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
interface ProductCardProps {
  id?: string;
  title: string;
  price: number;
  image: string;
  category?: string;
  onAdd?: () => void;
}
export const ProductCard: React.FC<ProductCardProps> = ({
  title = "Producto Premium",
  price = 0,
  image = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400",
  category = "Categoría",
  onAdd
}) => {
  return <div className="group relative glass rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,85,255,0.15)] hover:-translate-y-1">
      {/* Product Image */}
      <div className="aspect-square w-full overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020408]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <button onClick={onAdd} className="w-full py-3 bg-[#0055FF] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#0044CC] transition-colors shadow-lg shadow-blue-500/20">
            <Plus size={18} />
            Añadir al Carrito
          </button>
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white group-hover:text-[#0055FF] transition-colors line-clamp-1">
            {title}
          </h3>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-black text-white">
            ${price.toLocaleString('es-CU')}
          </span>
          <button onClick={onAdd} className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#FF2D55] hover:text-[#FF2D55] transition-all text-white/70">
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>

      {/* Animated Border/Glow effect on hover */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-transparent via-[#0055FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>;
};