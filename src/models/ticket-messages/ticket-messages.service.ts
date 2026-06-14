import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketMessageEntity } from './entities/ticket-message.entity';

// Dùng Interface thay vì DTO class để tránh bị ValidationPipe cắt nhầm dữ liệu
export interface CreateMessagePayload {
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  status?: string;
}

@Injectable()
export class TicketMessagesService {
  constructor(
    @InjectRepository(TicketMessageEntity)
    private readonly messageRepository: Repository<TicketMessageEntity>,
  ) {}

  // Hàm này sẽ được Socket Gateway gọi để lưu tin nhắn
  async saveMessage(data: CreateMessagePayload): Promise<TicketMessageEntity> {
    console.log('[DEBUG SERVICE] Dữ liệu từ Gateway truyền xuống:', data);

    const newMessage = this.messageRepository.create({
      ticket_id: data.ticket_id,
      sender_id: data.sender_id,
      sender_role: data.sender_role,
      message: data.message,
      status: data.status || 'sent', // Mặc định khi gửi là sent
    });
    
    console.log('[DEBUG SERVICE] Entity sau khi Create (chuẩn bị Save):', newMessage);

    return await this.messageRepository.save(newMessage);
  }

  // Hàm lấy lịch sử tin nhắn của một phòng chat
  async getMessagesByTicketId(ticketId: string): Promise<TicketMessageEntity[]> {
    return await this.messageRepository.find({
      where: { ticket_id: ticketId },
      order: { created_at: 'ASC' }, // Lấy từ cũ đến mới để hiển thị khung chat
    });
  }
}