export const VIP_ACCUMULATION_PERIOD = 'YEARLY';

export const VIP_LEVEL_POLICIES = [
  {
    levelName: 'Dong',
    minSpending: 0,
    discountPercent: 5,
    minimumOrderAmount: 99000,
    benefits: '1 voucher 5% cho don tiep theo, uu dai sinh nhat, qua sinh nhat',
  },
  {
    levelName: 'Bac',
    minSpending: 300000,
    discountPercent: 8,
    minimumOrderAmount: 149000,
    benefits:
      '1 voucher 8% cho don tiep theo, mien phi/giam ship 15k moi thang, mien phi thanh tay vong 1 lan',
  },
  {
    levelName: 'Vang',
    minSpending: 700000,
    discountPercent: 10,
    minimumOrderAmount: 199000,
    benefits:
      '1 voucher 10%, mien phi van chuyen, goi thanh tay vong 2 lan moi thang, uu tien tu van chon vong',
  },
  {
    levelName: 'Kim Cuong',
    minSpending: 1400000,
    discountPercent: 12,
    minimumOrderAmount: 249000,
    benefits:
      '2 voucher 12%, mien phi ship toan quoc, tu van phong thuy 1-1, uu tien ra mat BST moi, goi boc qua mien phi',
  },
] as const;
