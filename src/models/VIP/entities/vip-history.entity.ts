import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { VipLevel } from './vip-level.entity';

@Entity('vip_history')
export class VipHistory {
    @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
    id: string;

    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    @Column({ type: 'uuid', name: 'old_level_id', nullable: true })
    oldLevelId: string;

    @Column({ type: 'uuid', name: 'new_level_id', nullable: true })
    newLevelId: string;

    @CreateDateColumn({ type: 'timestamp', name: 'changed_at' })
    changedAt: Date;

    @Column({ type: 'text', nullable: true })
    reason: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => VipLevel)
    @JoinColumn({ name: 'old_level_id' })
    oldLevel: VipLevel;

    @ManyToOne(() => VipLevel)
    @JoinColumn({ name: 'new_level_id' })
    newLevel: VipLevel;
}
