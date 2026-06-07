export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
