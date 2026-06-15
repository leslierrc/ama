import React from 'react';

interface AmaLogoProps {
  /** Tamaño en px de la altura de las letras */
  size?: number;
  /** Variante de fondo — 'dark' para usar sobre fondo oscuro, 'light' para fondo crema */
  variant?: 'dark' | 'light';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Logo AMA oficial:
 *  A — blanca  (#FFFFFF en dark, #0F172A en light)
 *  M — azul    (#1A56FF)
 *  A — roja    (#E8001C)
 *
 * Tipografía condensada bold, igual que el logo de referencia.
 */
export const AmaLogo: React.FC<AmaLogoProps> = ({
  size = 40,
  variant = 'light',
  className = '',
  style,
}) => {
  const colorA1 = variant === 'dark' ? '#FFFFFF' : '#0F172A';
  const colorM  = '#1A56FF';
  const colorA2 = '#E8001C';

  // Proporción del logo: ~3.2 : 1 (ancho : alto)
  const width = size * 3.2;
  const height = size;

  return (
    <svg
      viewBox="0 0 320 100"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AMA"
      role="img"
      className={className}
      style={style}
    >
      {/* A — blanca/oscura */}
      <text
        x="0"
        y="88"
        fontFamily="'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
        fontWeight="900"
        fontSize="100"
        letterSpacing="-4"
        fill={colorA1}
      >
        A
      </text>
      {/* M — azul */}
      <text
        x="102"
        y="88"
        fontFamily="'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
        fontWeight="900"
        fontSize="100"
        letterSpacing="-4"
        fill={colorM}
      >
        M
      </text>
      {/* A — roja */}
      <text
        x="222"
        y="88"
        fontFamily="'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
        fontWeight="900"
        fontSize="100"
        letterSpacing="-4"
        fill={colorA2}
      >
        A
      </text>
    </svg>
  );
};
