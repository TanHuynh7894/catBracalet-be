import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('vouchers')
export class Vouchers {
  @PrimaryGeneratedColumn('uuid', { name: 'voucher_id' })
  id: string;

  @Column({ length: 255, unique: true })
  code: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'discount_value' })
  discountValue: number;

  @Column({ length: 50, name: 'discount_type' })
  discountType: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'timestamp', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamp', name: 'end_date' })
  endDate: Date;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}
