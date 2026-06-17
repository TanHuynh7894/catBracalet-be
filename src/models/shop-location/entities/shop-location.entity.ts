import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('shop_locations')
@Check(`latitude >= -90 AND latitude <= 90`)
@Check(`longitude >= -180 AND longitude <= 180`)
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
export class ShopLocation {
  @PrimaryGeneratedColumn('uuid', { name: 'shop_location_id' })
  id: string;

  @Column({ length: 255, name: 'shop_name' })
  shopName: string;

  @Column({ length: 500 })
  address: string;

  @Column('double precision')
  latitude: number;

  @Column('double precision')
  longitude: number;

  @Column({ length: 255, name: 'google_place_id', nullable: true })
  googlePlaceId?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
