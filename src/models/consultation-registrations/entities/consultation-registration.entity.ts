import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity'; // Đường dẫn có thể thay đổi tùy cấu trúc của bạn

@Entity('consultation_registrations')
export class ConsultationRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string;

  @Column({ name: 'time_of_birth', type: 'time' })
  timeOfBirth: string;

  @Column({ length: 20 })
  gender: string;

  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string;

  @Column({ type: 'uuid', name: 'product_id', nullable: true })
  productId: string;

  // Thiết lập Relation với bảng Product (nếu bạn cần query join)
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'text', nullable: true })
  objective: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}