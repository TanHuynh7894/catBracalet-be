import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('shipments') // Khớp với tên bảng public.shipments trong ảnh
export class Shipment {
  @PrimaryGeneratedColumn('uuid', { name: 'shipment_id' })
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ length: 255, name: 'shipping_partner' })
  shippingPartner: string; // Trong ảnh ví dụ là 'GHN' hoặc 'GHTK' sau này

  @Column({ length: 255, name: 'tracking_code', nullable: true })
  trackingCode: string | null; // Trong ảnh ví dụ là 'GHN001'

  @Column({ length: 30, name: 'shipping_status', default: 'SHIPPING' })
  shippingStatus: string; // Trong ảnh ví dụ là 'SHIPPING'

  @Column({
    type: 'timestamp without time zone',
    name: 'shipped_at',
    nullable: true,
  })
  shippedAt: Date | null;

  @Column({
    type: 'timestamp without time zone',
    name: 'delivered_at',
    nullable: true,
  })
  deliveredAt: Date | null;
}
