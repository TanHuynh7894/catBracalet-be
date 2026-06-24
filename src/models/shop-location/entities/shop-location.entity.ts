import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('store_locations')
@Check(`shop_latitude >= -90 AND shop_latitude <= 90`)
@Check(`shop_longitude >= -180 AND shop_longitude <= 180`)
export class ShopLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, name: 'name' })
  shopName: string;

  @Column({ length: 500, name: 'shop_address' })
  shopAddress: string;

  @Column({ length: 100 })
  province: string;

  @Column({ length: 100 })
  district: string;

  @Column({ length: 100 })
  ward: string;

  @Column({ length: 500, name: 'detail_address' })
  detailAddress: string;

  @Column({ length: 20, name: 'phone_number' })
  phoneNumber: string;

  @Column({ length: 255, name: 'working_hours' })
  workingHours: string;

  @Column('numeric', {
    name: 'shop_latitude',
    transformer: {
      from: (value: string | number) => Number(value),
      to: (value: number) => value,
    },
  })
  shopLatitude: number;

  @Column('numeric', {
    name: 'shop_longitude',
    transformer: {
      from: (value: string | number) => Number(value),
      to: (value: number) => value,
    },
  })
  shopLongitude: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
