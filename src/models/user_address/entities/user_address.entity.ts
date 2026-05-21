import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('addresses')
export class UserAddress {
  @PrimaryGeneratedColumn('uuid', { name: 'address_id' })
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ length: 255, name: 'receiver_name' })
  receiverName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 100 })
  province: string;

  @Column({ length: 100 })
  district: string;

  @Column({ length: 100 })
  ward: string;

  @Column({ length: 500, name: 'detail_address' })
  detailAddress: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
