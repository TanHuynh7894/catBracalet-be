import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { User } from '../../user/entities/user.entity';
import { UserAddress } from '../../user_address/entities/user_address.entity';
import { Vouchers } from '../../vouchers/entities/vouchers.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid', { name: 'address_id' })
  addressId: string;

  @ManyToOne(() => UserAddress)
  @JoinColumn({ name: 'address_id' })
  address: UserAddress;

  @Column('uuid', { name: 'voucher_id', nullable: true })
  voucherId: string;

  @ManyToOne(() => Vouchers)
  @JoinColumn({ name: 'voucher_id' })
  voucher: Vouchers;

  @Column('decimal', { name: 'total_amount', precision: 15, scale: 2 })
  totalAmount: number;

  @Column('varchar', { name: 'status', length: 50 })
  status: string;

  @Column('timestamp', { name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items: OrderItem[];
}

