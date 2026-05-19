import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
    id: string;

    @Column('uuid', { name: 'user_id' })
    userId: string;

    @Column('uuid', { name: 'address_id' })
    addressId: string;

    @Column('uuid', { name: 'voucher_id', nullable: true })
    voucherId: string;

    @Column('decimal', { name: 'total_amount', precision: 10, scale: 2 })
    totalAmount: number;

    @Column('varchar', { name: 'status', length: 50 })
    status: string;

    @Column('timestamp', { name: 'create_at' })
    createdAt: Date;
}
