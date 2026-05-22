import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('vip_levels')
export class VipLevel {
  @PrimaryGeneratedColumn('uuid', { name: 'vip_level_id' })
  id: string;

  @Column({ length: 100, name: 'level_name' })
  levelName: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'min_spending',
    default: 0,
  })
  minSpending: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'discount_percent',
    default: 0,
  })
  discountPercent: number;

  @Column({ type: 'text', nullable: true })
  benefits: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => User, (user) => user.vipLevel)
  users: User[];
}
