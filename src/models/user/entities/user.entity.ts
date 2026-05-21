
import { Column, CreateDateColumn, Entity, ManyToMany, JoinTable, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

import { Role } from '../../role/entities/role.entity';
import { VipLevel } from '../../VIP/entities/vip-level.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  id: string;

  @Column({ type: 'uuid', name: 'vip_level_id', nullable: true })
  vipLevelId: string;

  @ManyToOne(() => VipLevel, (vipLevel) => vipLevel.users)
  @JoinColumn({ name: 'vip_level_id' })
  vipLevel: VipLevel;

  @Column({ length: 255, name: 'full_name' })
  fullName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 500, nullable: true })
  avatar: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'total_spending',
    default: 0,
  })
  totalSpending: number;

  @Column({ type: 'timestamp', name: 'vip_updated_at', nullable: true })
  vipUpdatedAt: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}
