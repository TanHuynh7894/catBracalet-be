export const VIP_ACCUMULATION_PERIOD = 'YEARLY';

export const VIP_LEVEL_POLICIES = [
  {
    levelName: 'Dong',
    minSpending: 0,
    discountPercent: 5,
    minimumOrderAmount: 99000,
    benefits:
      '1 voucher 5% for the next order, birthday flower, birthday gift benefit',
  },
  {
    levelName: 'Bac',
    minSpending: 300000,
    discountPercent: 8,
    minimumOrderAmount: 149000,
    benefits:
      '1 voucher 8% for the next order, 15k shipping support once per month, one free bracelet cleaning',
  },
  {
    levelName: 'Vang',
    minSpending: 700000,
    discountPercent: 10,
    minimumOrderAmount: 199000,
    benefits:
      '1 voucher 10%, free shipping, monthly cleansing package twice, priority bracelet consultation',
  },
  {
    levelName: 'Kim Cuong',
    minSpending: 1400000,
    discountPercent: 12,
    minimumOrderAmount: 249000,
    benefits:
      '2 vouchers 12%, nationwide free shipping, 1-on-1 feng shui consultation, priority new collection access, free gift wrapping',
  },
] as const;
