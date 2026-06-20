import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity'; // <-- Nhớ check lại tên folder là 'user' hay 'users' nhé

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 1. Cột user_id (Đã mở nullable: true để chứa được thông báo Hệ thống)
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  // 2. Cột con út vừa được tái sinh: Khóa phụ trỏ đến ID của Order/Ticket...
  @Column({ type: 'uuid', name: 'related_id', nullable: true })
  relatedId: string;

  // Ràng buộc Khóa ngoại với bảng User
  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
    nullable: true, // Thêm dòng này để TypeORM không cằn nhằn khi user_id = null
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}