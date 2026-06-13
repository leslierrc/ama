import React from 'react';

interface ProductCardProps {
  id?: string;
  title: string;
  price: number;
  image: string;
  category?: string;
  badge?: string;
  description?: string;
  onAdd?: () => void;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  title,
  price,
  image,
  category = 'Producto',
  badge,
  description,
  onAdd,
  onClick,
}) => {
  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl ambient-shadow transition-transform duration-300 cursor-pointer"
      style={{ backgroundColor: 'var(--color-surface-container-low)' }}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-square">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          onClick={e => {
            e.stopPropagation();
            onAdd?.();
          }}
          className="absolute bottom-4 right-4 p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 active:scale-90"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          aria-label={`Añadir ${title} al carrito`}
        >
          <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
        </button>

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className="label-caps px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'rgba(2,44,34,0.75)',
              color: 'white',
              backdropFilter: 'blur(4px)',
            }}
          >
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-2 flex-1">
        <h3
          className="font-display text-xl font-semibold leading-tight"
          style={{ color: 'var(--color-primary)' }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            {description}
          </p>
        )}
        <div className="pt-4 flex justify-between items-center mt-auto">
          <span
            className="text-xl font-medium"
            style={{ color: 'var(--color-secondary)', fontFamily: 'Inter' }}
          >
            CUP ${price.toLocaleString('es-CU')}
          </span>
          {badge && (
            <span className="label-caps" style={{ color: 'var(--color-emerald-deep)' }}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
