/**
 * Formatea un precio en USD
 * Ej: 29.99 → "$29.99"
 * Ej: 1250 → "$1,250.00"
 */
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
