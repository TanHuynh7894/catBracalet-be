import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('payments')
export class Payments {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_id' })
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'integer', name: 'transition', unique: true, nullable: true })
  orderCode: number | null;

  @Column({ length: 50, name: 'payment_method' })
  paymentMethod: string;

  @Column({ length: 255, name: 'transaction_code', nullable: true })
  transactionCode: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 30, name: 'payment_status', default: 'PENDING' })
  paymentStatus: string;

  @Column({ type: 'timestamp', name: 'paid_at', nullable: true })
  paidAt: Date | null;
}
