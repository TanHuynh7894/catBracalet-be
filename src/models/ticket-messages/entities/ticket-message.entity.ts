import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ticket_messages')
export class TicketMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ticket_id: string;

  @Column({ type: 'uuid' })
  sender_id: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  sender_role: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'sent' })
  status: string;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  created_at: Date;
}